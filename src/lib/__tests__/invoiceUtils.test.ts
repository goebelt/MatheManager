import { describe, it, expect } from '@jest/globals';
import {
  formatInvoiceNumber,
  calculateDueDate,
  calculateInvoiceTotals,
  buildInvoiceDataForFamily,
} from '../invoiceUtils';

// ─── formatInvoiceNumber ─────────────────────────────────────────────────────

describe('formatInvoiceNumber', () => {
  it('formats with 5-digit padding', () => {
    expect(formatInvoiceNumber(2026, 1)).toBe('2026/00001');
  });

  it('formats larger numbers correctly', () => {
    expect(formatInvoiceNumber(2026, 123)).toBe('2026/00123');
  });

  it('formats max 5-digit number', () => {
    expect(formatInvoiceNumber(2026, 99999)).toBe('2026/99999');
  });

  it('works for different years', () => {
    expect(formatInvoiceNumber(2027, 1)).toBe('2027/00001');
  });
});

// ─── calculateDueDate ─────────────────────────────────────────────────────────

describe('calculateDueDate', () => {
  it('adds default 14 days', () => {
    const invoiceDate = new Date(2026, 2, 15); // March 15
    const due = calculateDueDate(invoiceDate);
    expect(due.getDate()).toBe(29); // March 29
    expect(due.getMonth()).toBe(2);
  });

  it('respects custom payment terms', () => {
    const invoiceDate = new Date(2026, 2, 15);
    const due = calculateDueDate(invoiceDate, 7);
    expect(due.getDate()).toBe(22);
  });

  it('handles month overflow', () => {
    const invoiceDate = new Date(2026, 2, 25); // March 25
    const due = calculateDueDate(invoiceDate, 14); // April 8
    expect(due.getMonth()).toBe(3);
    expect(due.getDate()).toBe(8);
  });

  it('handles zero payment terms', () => {
    const invoiceDate = new Date(2026, 2, 15);
    const due = calculateDueDate(invoiceDate, 0);
    expect(due.getDate()).toBe(15);
  });
});

// ─── calculateInvoiceTotals ──────────────────────────────────────────────────

describe('calculateInvoiceTotals', () => {
  it('calculates totals with 0% tax (default)', () => {
    const items = [{ totalPrice: 30 }, { totalPrice: 45 }];
    const result = calculateInvoiceTotals(items);
    expect(result.subtotal).toBe(75);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(75);
  });

  it('calculates totals with 19% tax', () => {
    const items = [{ totalPrice: 100 }];
    const result = calculateInvoiceTotals(items, 19);
    expect(result.subtotal).toBe(100);
    expect(result.taxAmount).toBe(19);
    expect(result.total).toBe(119);
  });

  it('returns zeros for empty items', () => {
    const result = calculateInvoiceTotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    const items = [{ totalPrice: 33.333 }];
    const result = calculateInvoiceTotals(items, 19);
    // subtotal: 33.33, tax: 6.33, total: 39.66
    expect(result.subtotal).toBe(33.33);
  });

  it('handles multiple items with tax', () => {
    const items = [{ totalPrice: 30 }, { totalPrice: 20 }, { totalPrice: 50 }];
    const result = calculateInvoiceTotals(items, 19);
    expect(result.subtotal).toBe(100);
    expect(result.taxAmount).toBe(19);
    expect(result.total).toBe(119);
  });
});

// ─── buildInvoiceDataForFamily ──────────────────────────────────────────────────

describe('buildInvoiceDataForFamily', () => {
  const mockIssuedBy = {
    name: 'Max Mustermann',
    street: 'Musterstraße 1',
    zipCode: '12345',
    city: 'Musterstadt',
    email: 'max@example.com',
    phone: '0123456789',
    vatId: 'DE123456789',
    iban: 'DE89370400440532013000',
  };

  const mockAppointmentItems = [
    {
      id: 'app1',
      date: '2026-01-15',
      studentId: 'st1',
      studentName: 'Anna Müller',
      lessonType: 'individual' as const,
      status: 'attended' as const,
      description: 'Einzelunterricht (besucht)',
      totalPrice: 45,
      isPaid: false,
    },
    {
      id: 'app2',
      date: '2026-01-22',
      studentId: 'st1',
      studentName: 'Anna Müller',
      lessonType: 'individual' as const,
      status: 'attended' as const,
      description: 'Einzelunterricht (besucht)',
      totalPrice: 45,
      isPaid: false,
    },
    {
      id: 'app3',
      date: '2026-01-19',
      studentId: 'st2',
      studentName: 'Ben Müller',
      lessonType: 'group' as const,
      status: 'attended' as const,
      description: 'Gruppenunterricht (besucht)',
      totalPrice: 35,
      isPaid: true,
    },
  ];

  it('builds a complete invoice for a family with multiple students', () => {
    const invoice = buildInvoiceDataForFamily(
      'fam1',
      'Familie Müller',
      'Müllerweg 5',
      ['st1', 'st2'],
      mockAppointmentItems,
      mockIssuedBy,
      '2026/00005',
      new Date(2026, 0, 31),
      14
    );

    expect(invoice.invoiceNumber).toBe('2026/00005');
    expect(invoice.issuedBy.name).toBe('Max Mustermann');
    expect(invoice.billedTo.name).toBe('Familie Müller');
    expect(invoice.billedTo.street).toBe('Müllerweg 5');
    expect(invoice.items).toHaveLength(3);
    expect(invoice.subtotal).toBe(125);
    expect(invoice.taxRate).toBe(0);
    expect(invoice.taxAmount).toBe(0);
    expect(invoice.total).toBe(125);
  });

  it('calculates due date correctly with custom payment terms', () => {
    const invoiceDate = new Date(2026, 0, 15); // Jan 15, 2026
    const invoice = buildInvoiceDataForFamily(
      'fam1',
      'Familie Müller',
      undefined,
      ['st1'],
      [mockAppointmentItems[0]],
      mockIssuedBy,
      '2026/00001',
      invoiceDate,
      30
    );

    expect(invoice.invoiceDate).toBe(invoiceDate.toISOString());
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);
    expect(new Date(invoice.dueDate).toDateString()).toBe(dueDate.toDateString());
  });

  it('handles empty appointments (generates invoice with 0 total)', () => {
    const invoice = buildInvoiceDataForFamily(
      'fam1',
      'Familie Müller',
      'Müllerweg 5',
      ['st1'],
      [],
      mockIssuedBy,
      '2026/00001',
      new Date(),
      14
    );

    expect(invoice.items).toHaveLength(0);
    expect(invoice.subtotal).toBe(0);
    expect(invoice.total).toBe(0);
  });

  it('maps all appointment fields correctly into invoice items', () => {
    const invoice = buildInvoiceDataForFamily(
      'fam1',
      'Familie Müller',
      undefined,
      ['st1'],
      [mockAppointmentItems[0]],
      mockIssuedBy,
      '2026/00001',
      new Date(),
      14
    );

    expect(invoice.items[0]).toEqual({
      appointmentId: 'app1',
      date: '2026-01-15',
      studentName: 'Anna Müller',
      lessonType: 'individual',
      status: 'attended',
      hourlyRate: 0,
      description: 'Einzelunterricht (besucht)',
      unitPrice: 45,
      quantity: 1,
      totalPrice: 45,
      isPaid: false,
    });
  });
});
