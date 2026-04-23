import { describe, it, expect } from '@jest/globals';
import {
  formatInvoiceNumber,
  calculateDueDate,
  calculateInvoiceTotals,
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
