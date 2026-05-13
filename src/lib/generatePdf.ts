/**
 * generatePdf.ts – browser-only helper to render a DOM element to PDF
 * and trigger a direct browser download (no popup, no print dialog).
 *
 * Uses jsPDF + html2canvas, with a critical workaround:
 * html2canvas 1.x has a known bug where Range.setEnd is called with
 * an offset larger than the text node's length, causing IndexSizeError.
 *
 * We fix this by temporarily monkey-patching Range.prototype.setEnd
 * to clamp the offset to the node's actual length.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _jsPDF: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _html2canvas: any = null;

async function loadDeps() {
  if (!_jsPDF) {
    const mod = await import('jspdf');
    _jsPDF = mod.default || mod;
  }
  if (!_html2canvas) {
    const mod = await import('html2canvas');
    _html2canvas = mod.default || mod;
  }
  return { jsPDF: _jsPDF, html2canvas: _html2canvas };
}

export interface GeneratePdfOptions {
  filename: string;
  margin?: number | number[]; // mm, like [top, right, bottom, left]
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | string;
  imageQuality?: number; // 0–1
  html2canvasScale?: number;
}

/**
 * Install a temporary monkey-patch on Range.prototype.setEnd that
 * clamps the offset to the node's length. This prevents the
 * IndexSizeError that html2canvas triggers with stale text nodes.
 *
 * Returns a cleanup function that restores the original method.
 */
function installRangePatch(): () => void {
  const originalSetEnd = Range.prototype.setEnd;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Range.prototype as any).setEnd = function (
    node: Node,
    offset: number,
    ...rest: unknown[]
  ) {
    // Clamp offset to the node's actual length
    let safeOffset = offset;
    if (node && typeof (node as Text).length === 'number') {
      const maxOffset = (node as Text).length;
      if (offset > maxOffset) {
        safeOffset = maxOffset;
      }
    }
    // Also handle the 3-arg overload: setEnd(node, offset, offsetEnd)
    if (rest.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (originalSetEnd as any).call(this, node, safeOffset, ...rest);
    }
    return originalSetEnd.call(this, node, safeOffset);
  };

  // Return cleanup function
  return () => {
    Range.prototype.setEnd = originalSetEnd;
  };
}

/**
 * Renders `element` as a PDF and triggers a browser download.
 * Returns a promise that resolves when the download starts.
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  options: GeneratePdfOptions,
): Promise<void> {
  const { jsPDF, html2canvas } = await loadDeps();

  const margin = options.margin ?? [10, 10, 10, 10];
  const mTop = Array.isArray(margin) ? margin[0] : margin;
  const mRight = Array.isArray(margin) ? margin[1] : margin;
  const mBottom = Array.isArray(margin) ? margin[2] : margin;
  const mLeft = Array.isArray(margin) ? margin[3] : margin;

  // Ensure the element is in the DOM and visible for html2canvas
  const wasHidden = element.style.display === 'none';
  const origPosition = element.style.position;
  const origLeft = element.style.left;
  const origTop = element.style.top;
  const origZIndex = element.style.zIndex;
  const origOpacity = element.style.opacity;

  if (wasHidden) {
    element.style.display = '';
  }

  // If the element is not in the document body, attach it temporarily
  const isAttached = document.body.contains(element);
  if (!isAttached) {
    element.style.position = 'absolute';
    element.style.left = '-99999px';
    element.style.top = '0';
    element.style.zIndex = '-1';
    element.style.opacity = '1';
    document.body.appendChild(element);
  }

  // Install the Range.setEnd patch for the duration of html2canvas
  const cleanupPatch = installRangePatch();

  try {
    // 1. Capture the element as canvas via html2canvas
    const canvas = await html2canvas(element, {
      scale: options.html2canvasScale ?? 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // 2. Calculate PDF dimensions
    const imgData = canvas.toDataURL('image/jpeg', options.imageQuality ?? 0.98);
    const pdf = new jsPDF({
      orientation: options.orientation ?? 'portrait',
      unit: 'mm',
      format: options.format ?? 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - mLeft - mRight;
    const contentHeight = pageHeight - mTop - mBottom;

    // Calculate the image height on the PDF based on the canvas aspect ratio
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // 3. If content spans multiple pages, split across pages
    let heightLeft = imgHeight;
    let position = mTop;

    // First page
    pdf.addImage(imgData, 'JPEG', mLeft, position, imgWidth, imgHeight);
    heightLeft -= contentHeight;

    while (heightLeft > 0) {
      position = position - contentHeight; // negative offset = scroll up
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', mLeft, position, imgWidth, imgHeight);
      heightLeft -= contentHeight;
    }

    // 4. Trigger download
    pdf.save(options.filename);
  } finally {
    // Always clean up the patch
    cleanupPatch();

    // Restore original styles
    if (wasHidden) {
      element.style.display = 'none';
    }
    if (!isAttached) {
      document.body.removeChild(element);
    } else {
      element.style.position = origPosition;
      element.style.left = origLeft;
      element.style.top = origTop;
      element.style.zIndex = origZIndex;
      element.style.opacity = origOpacity;
    }
  }
}
