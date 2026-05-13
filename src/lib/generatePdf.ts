/**
 * generatePdf.ts – browser-only helper to render a DOM element to PDF
 * and trigger a direct browser download (no popup, no print dialog).
 *
 * Uses jsPDF + html2canvas (the same engines html2pdf.js wraps,
 * but with clean SSR-safe imports).
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
}
