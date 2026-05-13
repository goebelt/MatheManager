/**
 * generatePdf.ts – browser-only helper to render a DOM element to PDF
 * and open it in a new browser tab for viewing/saving.
 *
 * Uses jsPDF + html2canvas, with a critical workaround:
 * html2canvas 1.x has a known bug where Range.setEnd is called with
 * an offset larger than the text node's length, causing IndexSizeError.
 *
 * We fix this by monkey-patching Range.prototype.setEnd for the
 * ENTIRE duration of the PDF generation process. The patch must
 * stay active across all async operations (including microtasks
 * that html2canvas schedules internally after the main promise resolves).
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

// ── Global Range.setEnd patch ──
// We keep the patch installed permanently once any PDF generation
// has been requested. This avoids timing issues where html2canvas
// schedules microtasks that call setEnd after our cleanup runs.
// The patch is harmless — it only clamps offsets that would otherwise
// throw an IndexSizeError, with no visible effect on rendering.

let _rangePatchInstalled = false;

function ensureRangePatchInstalled(): void {
  if (_rangePatchInstalled) return;
  _rangePatchInstalled = true;

  const originalSetEnd = Range.prototype.setEnd;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Range.prototype as any).setEnd = function (
    node: Node,
    offset: number,
    ...rest: unknown[]
  ) {
    let safeOffset = offset;
    if (node && typeof (node as Text).length === 'number') {
      const maxOffset = (node as Text).length;
      if (offset > maxOffset) {
        safeOffset = maxOffset;
      }
    }
    if (rest.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (originalSetEnd as any).call(this, node, safeOffset, ...rest);
    }
    return originalSetEnd.call(this, node, safeOffset);
  };
}

/**
 * Open the PDF in a new browser tab so the user can view and save it.
 */
function openPdfInNewTab(
  pdfBlob: Blob,
  filename: string,
): void {
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result as string;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
<!DOCTYPE html>
<html>
<head><title>${filename}</title></head>
<body style="margin:0;padding:0">
<iframe src="${dataUrl}" style="width:100%;height:100vh;border:none"></iframe>
</body>
</html>`);
      newWindow.document.close();
    } else {
      // Popup blocked — fall back to download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 500);
    }
  };
  reader.readAsDataURL(pdfBlob);
}

/**
 * Capture an element as canvas using html2canvas.
 * NOTE: The Range.setEnd patch must be installed BEFORE calling this.
 */
async function captureElement(
  element: HTMLElement,
  scale: number,
): Promise<HTMLCanvasElement> {
  const wasHidden = element.style.display === 'none';
  const origPosition = element.style.position;
  const origLeft = element.style.left;
  const origTop = element.style.top;
  const origZIndex = element.style.zIndex;
  const origOpacity = element.style.opacity;

  if (wasHidden) {
    element.style.display = '';
  }

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
    const canvas = await _html2canvas(element, {
      scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    return canvas;
  } finally {
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

/**
 * Add a canvas image to a jsPDF document, splitting across pages if needed.
 */
function addCanvasToPdf(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdf: any,
  canvas: HTMLCanvasElement,
  margin: [number, number, number, number],
  imageQuality: number,
  startOnNewPage: boolean,
): void {
  const [mTop, mRight, mBottom, mLeft] = margin;

  const imgData = canvas.toDataURL('image/jpeg', imageQuality);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - mLeft - mRight;
  const contentHeight = pageHeight - mTop - mBottom;

  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (startOnNewPage && pdf.internal.getNumberOfPages() > 0) {
    pdf.addPage();
  }

  let heightLeft = imgHeight;
  let position = mTop;
  let isFirstPage = true;

  while (heightLeft > 0) {
    if (!isFirstPage) {
      pdf.addPage();
    }
    pdf.addImage(imgData, 'JPEG', mLeft, position, imgWidth, imgHeight);
    heightLeft -= contentHeight;
    position = position - contentHeight;
    isFirstPage = false;
  }
}

/**
 * Renders `element` as a PDF and opens it in a new browser tab.
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  options: GeneratePdfOptions,
): Promise<void> {
  ensureRangePatchInstalled();
  const { jsPDF } = await loadDeps();

  const margin = options.margin ?? [10, 10, 10, 10];
  const mArr: [number, number, number, number] = Array.isArray(margin)
    ? [margin[0] ?? 10, margin[1] ?? 10, margin[2] ?? 10, margin[3] ?? 10]
    : [margin, margin, margin, margin];

  const pdf = new jsPDF({
    orientation: options.orientation ?? 'portrait',
    unit: 'mm',
    format: options.format ?? 'a4',
  });

  const canvas = await captureElement(element, options.html2canvasScale ?? 2);

  addCanvasToPdf(pdf, canvas, mArr, options.imageQuality ?? 0.98, false);

  const pdfBlob = pdf.output('blob');
  openPdfInNewTab(pdfBlob, options.filename);
}

/**
 * Generate a single PDF containing multiple elements (one per family).
 * Each element starts on a new page. Opens in new tab once.
 */
export async function generateBatchPdf(
  elements: { element: HTMLElement; cleanup?: () => void }[],
  options: {
    filename: string;
    margin?: number | number[];
    orientation?: 'portrait' | 'landscape';
    format?: 'a4' | string;
    imageQuality?: number;
    html2canvasScale?: number;
  },
): Promise<void> {
  ensureRangePatchInstalled();
  const { jsPDF } = await loadDeps();

  const margin = options.margin ?? [10, 10, 10, 10];
  const mArr: [number, number, number, number] = Array.isArray(margin)
    ? [margin[0] ?? 10, margin[1] ?? 10, margin[2] ?? 10, margin[3] ?? 10]
    : [margin, margin, margin, margin];

  const pdf = new jsPDF({
    orientation: options.orientation ?? 'portrait',
    unit: 'mm',
    format: options.format ?? 'a4',
  });

  const scale = options.html2canvasScale ?? 2;
  const quality = options.imageQuality ?? 0.98;

  for (let i = 0; i < elements.length; i++) {
    const { element, cleanup } = elements[i];
    try {
      const canvas = await captureElement(element, scale);
      addCanvasToPdf(pdf, canvas, mArr, quality, i > 0);
    } finally {
      cleanup?.();
    }
  }

  const pdfBlob = pdf.output('blob');
  openPdfInNewTab(pdfBlob, options.filename);
}
