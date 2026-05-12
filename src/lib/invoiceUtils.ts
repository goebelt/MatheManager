/**
 * Invoice utilities – extracted from invoices page for testability
 */

import type { InvoiceData } from '@/components/InvoiceTemplate';

/**
 * Build a complete InvoiceData object for one family.
 * All appointments for students belonging to the given family are grouped into one invoice.
 */
export function buildInvoiceDataForFamily(
  familyId: string,
  familyName: string,
  familyAddress: string | undefined,
  studentIdsInFamily: string[],
  appointmentsForFamily: Array<{
    id: string;
    date: string;
    studentId: string;
    studentName: string;
    lessonType: 'individual' | 'group' | 'block';
    status: 'attended' | 'canceled_paid' | 'canceled_free' | 'planned';
    description: string;
    totalPrice: number;
    isPaid: boolean;
  }>,
  issuedBy: InvoiceData['issuedBy'],
  invoiceNumber: string,
  invoiceDate: Date,
  paymentTerms: number
): InvoiceData {
  const { subtotal, taxAmount, total } = calculateInvoiceTotals(
    appointmentsForFamily.map(a => ({ totalPrice: a.totalPrice }))
  );
  const dueDate = calculateDueDate(invoiceDate, paymentTerms);

  return {
    invoiceNumber,
    invoiceDate: invoiceDate.toISOString(),
    dueDate: dueDate.toISOString(),
    issuedBy,
    billedTo: {
      name: familyName,
      street: familyAddress,
      zipCode: undefined,
      city: undefined,
    },
    items: appointmentsForFamily.map(a => ({
      appointmentId: a.id,
      date: a.date,
      studentName: a.studentName,
      lessonType: a.lessonType,
      status: a.status,
      hourlyRate: 0,
      description: a.description,
      unitPrice: a.totalPrice,
      quantity: 1,
      totalPrice: a.totalPrice,
      isPaid: a.isPaid,
    })),
    subtotal,
    taxRate: 0,
    taxAmount,
    total,
  };
}

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
