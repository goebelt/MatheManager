/**
 * generatePdf.ts – browser-only helper to render a DOM element to PDF
 * and open it in a new browser tab for viewing/saving.
 *
 * Uses jsPDF + SVG foreignObject approach instead of html2canvas.
 * html2canvas 1.x has an unfixable bug where Range.setEnd is called
 * with offsets larger than the text node's length. Since html2canvas
 * bundles its own reference to Range.prototype.setEnd, monkey-patching
 * the prototype does not help.
 *
 * The SVG foreignObject approach:
 * 1. Serialize the element's HTML to an XML string
 * 2. Wrap it in an SVG <foreignObject>
 * 3. Create an Image from the SVG data URI
 * 4. Draw the Image onto a Canvas
 * 5. Use the Canvas image in jsPDF
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _jsPDF: any = null;

async function loadJsPDF() {
  if (!_jsPDF) {
    const mod = await import('jspdf');
    _jsPDF = mod.default || mod;
  }
  return _jsPDF;
}

export interface GeneratePdfOptions {
  filename: string;
  margin?: number | number[]; // mm, like [top, right, bottom, left]
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | string;
  imageQuality?: number; // 0–1
  scale?: number; // pixel scale factor (default 2)
}

/**
 * Capture a DOM element as a canvas using the SVG foreignObject approach.
 * This avoids html2canvas and its Range.setEnd bug entirely.
 */
async function captureElementViaSvg(
  element: HTMLElement,
  scale: number,
): Promise<HTMLCanvasElement> {
  // Ensure the element is visible and in the DOM
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
    // Get the element's actual rendered dimensions
    const rect = element.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Compute all inline styles from the element and its ancestors
    // so the foreignObject rendering matches the page styles
    const styles = collectStyles(element);

    // Serialize the element's HTML
    const html = new XMLSerializer().serializeToString(element);

    // Build the SVG with foreignObject
    const svgStr = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;">
      <style>${styles}</style>
      ${html}
    </div>
  </foreignObject>
</svg>`;

    // Encode to data URI
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Load into an Image, then draw to canvas
    const canvas = await new Promise<HTMLCanvasElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = width * scale;
        c.height = height * scale;
        const ctx = c.getContext('2d')!;
        ctx.scale(scale, scale);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(c);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error('SVG foreignObject rendering failed: ' + e));
      };
      img.src = url;
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
 * Collect all relevant CSS styles from the document's stylesheets
 * so the SVG foreignObject rendering can use them.
 */
function collectStyles(element: HTMLElement): string {
  const sheets = document.styleSheets;
  let css = '';

  for (let i = 0; i < sheets.length; i++) {
    try {
      const rules = sheets[i].cssRules || sheets[i].rules;
      for (let j = 0; j < rules.length; j++) {
        const rule = rules[j] as CSSRule;
        if (rule && rule.cssText) {
          // Skip @font-face and @keyframes that reference external URLs
          // (they can cause the SVG to fail to render)
          if (rule.cssText.includes('@font-face') && rule.cssText.includes('url(')) {
            continue;
          }
          css += rule.cssText + '\n';
        }
      }
    } catch {
      // Cross-origin stylesheets throw SecurityError — skip them
    }
  }

  return css;
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
  const jsPDF = await loadJsPDF();

  const margin = options.margin ?? [10, 10, 10, 10];
  const mArr: [number, number, number, number] = Array.isArray(margin)
    ? [margin[0] ?? 10, margin[1] ?? 10, margin[2] ?? 10, margin[3] ?? 10]
    : [margin, margin, margin, margin];

  const pdf = new jsPDF({
    orientation: options.orientation ?? 'portrait',
    unit: 'mm',
    format: options.format ?? 'a4',
  });

  const canvas = await captureElementViaSvg(element, options.scale ?? 2);
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
    scale?: number;
  },
): Promise<void> {
  const jsPDF = await loadJsPDF();

  const margin = options.margin ?? [10, 10, 10, 10];
  const mArr: [number, number, number, number] = Array.isArray(margin)
    ? [margin[0] ?? 10, margin[1] ?? 10, margin[2] ?? 10, margin[3] ?? 10]
    : [margin, margin, margin, margin];

  const pdf = new jsPDF({
    orientation: options.orientation ?? 'portrait',
    unit: 'mm',
    format: options.format ?? 'a4',
  });

  const scale = options.scale ?? 2;
  const quality = options.imageQuality ?? 0.98;

  for (let i = 0; i < elements.length; i++) {
    const { element, cleanup } = elements[i];
    try {
      const canvas = await captureElementViaSvg(element, scale);
      addCanvasToPdf(pdf, canvas, mArr, quality, i > 0);
    } finally {
      cleanup?.();
    }
  }

  const pdfBlob = pdf.output('blob');
  openPdfInNewTab(pdfBlob, options.filename);
}
