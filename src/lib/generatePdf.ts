/**
 * generatePdf.ts – browser-only helper to render a DOM element to PDF
 * and trigger a direct browser download (no popup, no print dialog).
 *
 * Uses jsPDF + html2canvas with workarounds for common bugs:
 * - IndexSizeError in Range.setEnd during DOM cloning (html2canvas #2699)
 * - Missing rendering of elements not visible in viewport
 */

// These libraries are browser-only → use dynamic import
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
 * Workaround for html2canvas IndexSizeError:
 * Walk the cloned DOM and normalize all text nodes so their
 * length matches what html2canvas expects when setting Range offsets.
 */
function sanitizeClonedDom(doc: Document) {
  const walker = doc.createTreeWalker(
    doc.body,
    NodeFilter.SHOW_TEXT,
    null,
  );
  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }
  // Normalize text content — trim trailing whitespace and ensure consistency
  for (const textNode of textNodes) {
    const parent = textNode.parentNode;
    if (!parent) continue;
    // Replace the text node with a fresh one (avoids stale Range references)
    const fresh = doc.createTextNode(textNode.textContent || '');
    parent.replaceChild(fresh, textNode);
  }
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

  try {
    // 1. Capture the element as canvas via html2canvas
    const canvas = await html2canvas(element, {
      scale: options.html2canvasScale ?? 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc: Document, _clonedElement: HTMLElement) => {
        // Sanitize the cloned DOM to prevent IndexSizeError
        sanitizeClonedDom(clonedDoc);
        // Ensure the cloned element is visible
        _clonedElement.style.display = '';
        _clonedElement.style.position = 'absolute';
        _clonedElement.style.left = '0';
        _clonedElement.style.top = '0';
        _clonedElement.style.opacity = '1';
        _clonedElement.style.zIndex = '-1';
      },
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
    let page = 1;

    // First page
    pdf.addImage(imgData, 'JPEG', mLeft, position, imgWidth, imgHeight);
    heightLeft -= contentHeight;

    while (heightLeft > 0) {
      position = position - contentHeight; // negative offset = scroll up
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', mLeft, position, imgWidth, imgHeight);
      heightLeft -= contentHeight;
      page++;
    }

    // 4. Trigger download
    pdf.save(options.filename);
  } finally {
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
