/**
 * generatePdf.ts – browser-only helper to render a DOM element to PDF
 * and open it in a new browser tab for viewing/saving.
 *
 * Uses jsPDF + SVG foreignObject approach instead of html2canvas.
 * html2canvas has an unfixable Range.setEnd bug (bundles its own
 * reference to the native method, making prototype patching useless).
 *
 * The SVG foreignObject approach:
 * 1. Clone the element and inline all computed styles
 * 2. Wrap it in an SVG <foreignObject>
 * 3. Create an Image from the SVG data URI (using Blob URL to avoid
 *    tainted canvas from data URI restrictions in some browsers)
 * 4. Draw the Image onto a Canvas
 * 5. Use the Canvas image in jsPDF
 *
 * Key: We use a Blob URL (not a data URI) for the SVG image source,
 * which avoids the "tainted canvas" SecurityError. We also strip
 * any external resource references (images, fonts) from the SVG
 * to prevent cross-origin tainting.
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
 * Recursively inline all computed styles onto each element in a clone.
 * This produces a self-contained DOM that doesn't rely on external stylesheets.
 */
function inlineStyles(source: Element, target: Element): void {
  const computed = window.getComputedStyle(source);
  let cssText = '';

  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i];
    const val = computed.getPropertyValue(prop);
    cssText += `${prop}:${val};`;
  }

  (target as HTMLElement).style.cssText = cssText;

  // Recurse into children
  const sourceChildren = source.children;
  const targetChildren = target.children;
  for (let i = 0; i < sourceChildren.length && i < targetChildren.length; i++) {
    inlineStyles(sourceChildren[i], targetChildren[i]);
  }
}

/**
 * Serialize a DOM element to a self-contained XHTML string
 * with all styles inlined and no external resource references.
 */
function elementToXhtml(element: HTMLElement): string {
  // Deep clone the element
  const clone = element.cloneNode(true) as HTMLElement;

  // Inline all computed styles recursively
  inlineStyles(element, clone);

  // Remove any elements that reference external resources (img, svg use, etc.)
  const imgs = clone.querySelectorAll('img');
  imgs.forEach((img) => {
    // Convert images to data URIs or remove them
    // For safety, we replace with a placeholder
    (img as HTMLElement).style.display = 'none';
  });

  // Remove any external font references or url() in inline styles
  // that could taint the canvas (keep only local data: URIs)
  const allElements = clone.querySelectorAll('*');
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.style && htmlEl.style.cssText) {
      // Remove any url() references that aren't data: URIs
      htmlEl.style.cssText = htmlEl.style.cssText.replace(
        /url\((?!['"]?data:)[^)]*\)/gi,
        'none'
      );
    }
  });

  // Serialize to XHTML (required for SVG foreignObject)
  const serializer = new XMLSerializer();
  let xhtml = serializer.serializeToString(clone);

  // Fix common serialization issues:
  // XMLSerializer may produce HTML namespace issues
  xhtml = xhtml.replace(/\sxmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/g, '');
  // Ensure self-closing tags work in XHTML
  xhtml = xhtml.replace(/<br>/g, '<br/>');
  xhtml = xhtml.replace(/<hr>/g, '<hr/>');

  return xhtml;
}

/**
 * Capture a DOM element as a canvas using the SVG foreignObject approach.
 */
async function captureElementViaSvg(
  element: HTMLElement,
  scale: number,
): Promise<HTMLCanvasElement> {
  // Ensure the element is visible and in the DOM for accurate dimensions
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
    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);

    // Serialize the element to self-contained XHTML
    const xhtml = elementToXhtml(element);

    // Build the SVG with foreignObject
    // We use a Blob URL (not data:) to avoid tainted canvas issues
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;background:#fff;">
      ${xhtml}
    </div>
  </foreignObject>
</svg>`;

    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Load into an Image, then draw to canvas
    const canvas = await new Promise<HTMLCanvasElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
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
