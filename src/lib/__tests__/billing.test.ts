import { describe, it, expect } from '@jest/globals';
import {
  calculateAppointmentFee,
  calculateTotalEarnings,
  getEarningsBreakdown,
  calculateTotalPrice,
  formatCurrency,
} from '../billing';
import type { Appointment, PriceEntry } from '@/types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const DEFAULT_PRICE: PriceEntry = {
  id: 'price-default',
  name: 'Standard',
  studentIds: [], // leer = Standardpreis
  individual60: 30,
  individual90: 45,
  group60: 20,
  group90: 30,
  validFrom: '2026-01-01',
  validTo: null,
  isDefault: true,
};

const STUDENT_PRICE: PriceEntry = {
  id: 'price-student-a',
  name: 'Spezial Schüler A',
  studentIds: ['student-a'],
  individual60: 35,
  individual90: 50,
  group60: 22,
  group90: 33,
  validFrom: '2026-01-01',
  validTo: null,
};

const ALL_PRICES: PriceEntry[] = [DEFAULT_PRICE, STUDENT_PRICE];

const makeAppointment = (
  overrides: Partial<Appointment> & { id: string }
): Appointment => ({
  studentIds: ['student-a'],
  date: '2026-03-15',
  time: '14:00',
  duration: 60,
  status: 'attended',
  ...overrides,
});

// ─── calculateAppointmentFee ────────────────────────────────────────────────

describe('calculateAppointmentFee', () => {
  // --- Status-Logik ---

  it('returns 0 for planned appointments', () => {
    const app = makeAppointment({ id: '1', status: 'planned' });
    expect(calculateAppointmentFee(app, 'student-a', ALL_PRICES)).toBe(0);
  });

  it('returns 0 for canceled_free appointments', () => {
    const app = makeAppointment({ id: '2', status: 'canceled_free' });
    expect(calculateAppointmentFee(app, 'student-a', ALL_PRICES)).toBe(0);
  });

  it('returns 50% for canceled_paid appointments (individual 60)', () => {
    const app = makeAppointment({ id: '3', status: 'canceled_paid' });
    // Schüler-spezifisch: individual60 = 35 → 50% = 17.50
    expect(calculateAppointmentFee(app, 'student-a', ALL_PRICES)).toBe(17.5);
  });

  it('returns 50% for canceled_paid with default price', () => {
    const app = makeAppointment({
      id: '4',
      studentIds: ['student-b'], // kein Spezialspreis
      status: 'canceled_paid',
    });
    // Default: individual60 = 30 → 50% = 15
    expect(calculateAppointmentFee(app, 'student-b', ALL_PRICES)).toBe(15);
  });

  it('returns full price for attended individual 60min', () => {
    const app = makeAppointment({ id: '5', status: 'attended', duration: 60 });
    // Schüler-spezifisch: individual60 = 35
    expect(calculateAppointmentFee(app, 'student-a', ALL_PRICES)).toBe(35);
  });

  it('returns full price for attended individual 90min', () => {
    const app = makeAppointment({ id: '6', status: 'attended', duration: 90 });
    // Schüler-spezifisch: individual90 = 50
    expect(calculateAppointmentFee(app, 'student-a', ALL_PRICES)).toBe(50);
  });

  // --- Gruppen-Logik ---

  it('uses group price when appointment has 2 students (group60)', () => {
    const app = makeAppointment({
      id: '7',
      studentIds: ['student-a', 'student-b'],
      duration: 60,
    });
    // Schüler-spezifisch für student-a: group60 = 22
    expect(calculateAppointmentFee(app, 'student-a', ALL_PRICES)).toBe(22);
  });

  it('uses group price when appointment has 2 students (group90)', () => {
    const app = makeAppointment({
      id: '8',
      studentIds: ['student-a', 'student-b'],
      duration: 90,
    });
    // Schüler-spezifisch für student-a: group90 = 33
    expect(calculateAppointmentFee(app, 'student-a', ALL_PRICES)).toBe(33);
  });

  it('uses default group prices when student has no specific price', () => {
    const app = makeAppointment({
      id: '9',
      studentIds: ['student-x', 'student-y'],
      duration: 60,
    });
    // Default: group60 = 20
    expect(calculateAppointmentFee(app, 'student-x', ALL_PRICES)).toBe(20);
  });

  // --- Fallback auf Standardpreis ---

  it('falls back to default price when no student-specific price exists', () => {
    const app = makeAppointment({
      id: '10',
      studentIds: ['student-unknown'],
      duration: 60,
    });
    // Default: individual60 = 30
    expect(calculateAppointmentFee(app, 'student-unknown', ALL_PRICES)).toBe(30);
  });

  it('falls back to default price when studentId is undefined', () => {
    const app = makeAppointment({ id: '11', duration: 90 });
    // Default: individual90 = 45
    expect(calculateAppointmentFee(app, undefined, ALL_PRICES)).toBe(45);
  });

  // --- Gültigkeitszeitraum ---

  it('selects price entry within validFrom/validTo range', () => {
    const timeLimitedPrice: PriceEntry = {
      id: 'price-limited',
      studentIds: ['student-a'],
      individual60: 40,
      individual90: 55,
      group60: 25,
      group90: 35,
      validFrom: '2026-03-01',
      validTo: '2026-03-31',
    };
    const app = makeAppointment({ id: '12', date: '2026-03-15' });
    expect(
      calculateAppointmentFee(app, 'student-a', [DEFAULT_PRICE, timeLimitedPrice])
    ).toBe(40);
  });

  it('ignores price entry outside validTo range', () => {
    const expiredPrice: PriceEntry = {
      id: 'price-expired',
      studentIds: ['student-a'],
      individual60: 40,
      individual90: 55,
      group60: 25,
      group90: 35,
      validFrom: '2026-01-01',
      validTo: '2026-02-28',
    };
    const app = makeAppointment({ id: '13', date: '2026-03-15' });
    // Expired price should be ignored, falls back to default
    expect(
      calculateAppointmentFee(app, 'student-a', [DEFAULT_PRICE, expiredPrice])
    ).toBe(30); // default individual60
  });

  it('ignores price entry before validFrom', () => {
    const futurePrice: PriceEntry = {
      id: 'price-future',
      studentIds: ['student-a'],
      individual60: 40,
      individual90: 55,
      group60: 25,
      group90: 35,
      validFrom: '2026-04-01',
      validTo: null,
    };
    const app = makeAppointment({ id: '14', date: '2026-03-15' });
    expect(
      calculateAppointmentFee(app, 'student-a', [DEFAULT_PRICE, futurePrice])
    ).toBe(30);
  });

  // --- Edge Cases ---

  it('returns 0 when no price entries are provided', () => {
    const app = makeAppointment({ id: '15' });
    expect(calculateAppointmentFee(app, 'student-a', [])).toBe(0);
  });

  it('returns 0 when priceEntries is undefined', () => {
    const app = makeAppointment({ id: '16' });
    expect(calculateAppointmentFee(app, 'student-a', undefined)).toBe(0);
  });

  it('returns 0 on invalid appointment and swallows error', () => {
    const broken = { id: 'broken' } as unknown as Appointment;
    expect(calculateAppointmentFee(broken, 'x', ALL_PRICES)).toBe(0);
  });

  it('rounds result to 2 decimal places', () => {
    const oddPrice: PriceEntry = {
      id: 'price-odd',
      studentIds: [],
      individual60: 33.33,
      individual90: 49.99,
      group60: 21.11,
      group90: 31.67,
      validFrom: '2026-01-01',
      validTo: null,
    };
    const app = makeAppointment({
      id: '17',
      studentIds: ['s1'],
      status: 'canceled_paid',
      duration: 60,
    });
    // 33.33 * 0.5 = 16.665 → rounded to 16.67
    expect(calculateAppointmentFee(app, 's1', [oddPrice])).toBe(16.67);
  });

  it('defaults duration to 60 when missing', () => {
    const app = makeAppointment({ id: '18', duration: 0 as unknown as number });
    // Fallback duration=60 → individual60 = 35
    expect(calculateAppointmentFee(app, 'student-a', ALL_PRICES)).toBe(35);
  });
});

// ─── calculateTotalEarnings ──────────────────────────────────────────────────

describe('calculateTotalEarnings', () => {
  it('sums fees for all non-planned appointments', () => {
    const apps: Appointment[] = [
      makeAppointment({ id: 'a1', status: 'attended', duration: 60 }),
      makeAppointment({ id: 'a2', status: 'canceled_paid', duration: 60, studentIds: ['student-b'] }),
      makeAppointment({ id: 'a3', status: 'planned', duration: 60 }),
      makeAppointment({ id: 'a4', status: 'canceled_free', duration: 60, studentIds: ['student-b'] }),
    ];
    // a1: student-a, but calculateTotalEarnings passes undefined → default individual60 = 30
    // a2: student-b, undefined → default individual60 = 30, 50% = 15
    // a3: planned = 0 (filtered out)
    // a4: canceled_free = 0 (filtered out)
    const total = calculateTotalEarnings(apps, ALL_PRICES);
    expect(total).toBe(45);
  });

  it('returns 0 for empty appointment list', () => {
    expect(calculateTotalEarnings([], ALL_PRICES)).toBe(0);
  });
});

// ─── getEarningsBreakdown ────────────────────────────────────────────────────

describe('getEarningsBreakdown', () => {
  it('splits earnings into individual and group', () => {
    const apps: Appointment[] = [
      makeAppointment({ id: 'b1', studentIds: ['s1'], status: 'attended', duration: 60 }),
      makeAppointment({ id: 'b2', studentIds: ['s1', 's2'], status: 'attended', duration: 60 }),
    ];
    const breakdown = getEarningsBreakdown(apps, ALL_PRICES);
    // b1: individual (1 student) → default 30
    // b2: group (2 students) → default 20
    expect(breakdown.individual).toBe(30);
    expect(breakdown.group).toBe(20);
  });

  it('excludes planned appointments from breakdown', () => {
    const apps: Appointment[] = [
      makeAppointment({ id: 'c1', status: 'planned', duration: 60 }),
      makeAppointment({ id: 'c2', studentIds: ['s1'], status: 'attended', duration: 60 }),
    ];
    const breakdown = getEarningsBreakdown(apps, ALL_PRICES);
    expect(breakdown.individual).toBe(30);
    expect(breakdown.group).toBe(0);
  });

  it('returns zeros for empty list', () => {
    const breakdown = getEarningsBreakdown([], ALL_PRICES);
    expect(breakdown).toEqual({ individual: 0, group: 0 });
  });
});

// ─── calculateTotalPrice ─────────────────────────────────────────────────────

describe('calculateTotalPrice', () => {
  it('calculates sum of quantity × unitPrice', () => {
    const items = [
      { quantity: 2, unitPrice: 30 },
      { quantity: 1, unitPrice: 45 },
    ];
    expect(calculateTotalPrice(items)).toBe(105);
  });

  it('returns 0 for empty array', () => {
    expect(calculateTotalPrice([])).toBe(0);
  });

  it('returns 0 for null/undefined', () => {
    expect(calculateTotalPrice(null as unknown as [])).toBe(0);
    expect(calculateTotalPrice(undefined as unknown as [])).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    const items = [{ quantity: 3, unitPrice: 10.555 }];
    // 3 × 10.555 = 31.665 → 31.67
    expect(calculateTotalPrice(items)).toBe(31.67);
  });
});

// ─── formatCurrency ──────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats as Euro with German locale', () => {
    const result = formatCurrency(30);
    // de-DE: 30,00 €
    expect(result).toMatch(/30,00/);
    expect(result).toContain('€');
  });

  it('shows 2 decimal places for whole numbers', () => {
    expect(formatCurrency(100)).toMatch(/100,00/);
  });

  it('handles fractional amounts', () => {
    expect(formatCurrency(17.5)).toMatch(/17,50/);
  });

  it('formats 0 correctly', () => {
    expect(formatCurrency(0)).toMatch(/0,00/);
  });
});
