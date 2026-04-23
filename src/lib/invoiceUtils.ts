/**
 * Invoice utilities – extracted from invoices page for testability
 */

/**
 * Format invoice number as YYYY/NNNNN
 * @param year - e.g. 2026
 * @param sequenceNumber - sequential number (1-based)
 * @returns formatted string like "2026/00001"
 */
export function formatInvoiceNumber(year: number, sequenceNumber: number): string {
  return `${year}/${sequenceNumber.toString().padStart(5, '0')}`;
}

/**
 * Calculate due date (default: 14 days from invoice date)
 */
export function calculateDueDate(invoiceDate: Date, paymentTerms = 14): Date {
  const due = new Date(invoiceDate);
  due.setDate(due.getDate() + paymentTerms);
  return due;
}

/**
 * Calculate invoice totals from line items.
 * Tax rate defaults to 0 (Umsatzsteuerbefreit nach §4 Nr. 21).
 */
export function calculateInvoiceTotals(
  items: Array<{ totalPrice: number }>,
  taxRate = 0
): { subtotal: number; taxAmount: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
