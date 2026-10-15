/**
 * generatePdf.ts – browser-only helper to generate PDFs via the
 * browser's native Print dialog.
 *
 * Instead of the fragile html2canvas / SVG foreignObject canvas pipeline,
 * we render the invoice HTML into a new window and call window.print().
 * The user can then "Save as PDF" from the print dialog — this is
 * the most reliable cross-browser approach.
 *
 * For batch invoices (Serienrechnung), all invoices are rendered in
 * a single document with CSS page breaks between each family.
 */

export interface GeneratePdfOptions {
  filename: string;
  margin?: number | number[]; // mm, like [top, right, bottom, left]
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | string;
  imageQuality?: number; // unused, kept for API compat
  scale?: number; // unused, kept for API compat
}

/**
 * Open a new window with the element's HTML and trigger the print dialog.
 * CSS @page rules control margins and orientation.
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  options: GeneratePdfOptions,
): Promise<void> {
  const margin = options.margin ?? [10, 10, 10, 10];
  const mArr: [number, number, number, number] = Array.isArray(margin)
    ? [margin[0] ?? 10, margin[1] ?? 10, margin[2] ?? 10, margin[3] ?? 10]
    : [margin, margin, margin, margin];

  const [mTop, mRight, mBottom, mLeft] = mArr;
  const orientation = options.orientation ?? 'portrait';

  const html = buildPrintHtml([element.outerHTML], mTop, mRight, mBottom, mLeft, orientation);
  openPrintWindow(html, options.filename);
}

/**
 * Generate a print-ready document with multiple elements (one per family),
 * each on a separate printed page. Triggers the print dialog once.
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
  const margin = options.margin ?? [10, 10, 10, 10];
  const mArr: [number, number, number, number] = Array.isArray(margin)
    ? [margin[0] ?? 10, margin[1] ?? 10, margin[2] ?? 10, margin[3] ?? 10]
    : [margin, margin, margin, margin];

  const [mTop, mRight, mBottom, mLeft] = mArr;
  const orientation = options.orientation ?? 'portrait';

  // Collect HTML from each element, then clean up
  const htmlParts: string[] = [];
  for (const { element, cleanup } of elements) {
    // Remove display:none added for hiding on main page before extracting HTML
    const html = element.outerHTML.replace(/style="([^"]*)display:\s*none[^"]*"/, (match, styles) => {
      const cleaned = styles.replace(/display:\s*none\s*;?\s*/g, '').trim();
      return cleaned ? `style="${cleaned}"` : '';
    });
    htmlParts.push(html);
    cleanup?.();
  }

  const html = buildPrintHtml(htmlParts, mTop, mRight, mBottom, mLeft, orientation);
  openPrintWindow(html, options.filename);
}

/**
 * Build a complete HTML document for printing, with:
 * - CSS @page rules for margins and orientation
 * - page-break-after between each invoice
 * - Clean print styling
 */
function buildPrintHtml(
  invoiceHtmlParts: string[],
  mTop: number,
  mRight: number,
  mBottom: number,
  mLeft: number,
  orientation: string,
): string {
  const invoiceSections = invoiceHtmlParts
    .map((html, i) => {
      const breakAfter = i < invoiceHtmlParts.length - 1
        ? 'page-break-after: always;'
        : '';
      return `<div class="invoice-page" style="${breakAfter}">${html}</div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Serienrechnung</title>
  <style>
    @page {
      size: A4 ${orientation};
      margin: ${mTop}mm ${mRight}mm ${mBottom}mm ${mLeft}mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .invoice-page {
      width: 100%;
      max-width: 190mm;
      margin: 0 auto;
    }

    @media screen {
      .invoice-page {
        padding: 10mm;
        margin-bottom: 20px;
        border: 1px solid #ddd;
        background: #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
    }

    @media print {
      .invoice-page {
        padding: 0;
        border: none;
        box-shadow: none;
      }
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 4px 6px;
    }

    .no-print {
      display: none !important;
    }
  </style>
</head>
<body>
  ${invoiceSections}
</body>
</html>`;
}

/**
 * Open a new window with the HTML content and trigger the print dialog.
 */
function openPrintWindow(html: string, _filename: string): void {
  const newWindow = window.open('', '_blank');
  if (!newWindow) {
    // Popup blocked — inform user to allow popups
    alert('Bitte erlauben Sie Popups für diese Seite, um das PDF zu drucken oder zu speichern.');
    return;
  }

  newWindow.document.write(html);
  newWindow.document.close();

  // Wait for content to render, then trigger print
  newWindow.onload = () => {
    setTimeout(() => {
      newWindow.focus();
      newWindow.print();
    }, 300);
  };
}
