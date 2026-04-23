import { describe, it, expect } from '@jest/globals';
import { filterAppointmentsByDate } from '../dateFilters';
import type { Appointment } from '@/types';

const makeAppointment = (
  id: string,
  date: string,
  overrides: Partial<Appointment> = {}
): Appointment => ({
  id,
  studentIds: ['s1'],
  date,
  time: '14:00',
  duration: 60,
  status: 'attended',
  ...overrides,
});

// Reference date: March 15 2026 (Sunday)
const REF = new Date(2026, 2, 15, 12, 0, 0);

// ─── filterAppointmentsByDate ────────────────────────────────────────────────

describe('filterAppointmentsByDate', () => {
  const appointments: Appointment[] = [
    makeAppointment('a1', '2026-01-15'),  // January
    makeAppointment('a2', '2026-03-01'),  // March
    makeAppointment('a3', '2026-03-10'),  // March
    makeAppointment('a4', '2026-03-20'),  // March (after ref date)
    makeAppointment('a5', '2026-05-01'),  // May
    makeAppointment('a6', '2026-03-05', { status: 'planned' }), // March, planned
  ];

  it('filters by month (March)', () => {
    const result = filterAppointmentsByDate(appointments, {
      timeRange: 'month',
      referenceDate: REF,
    });
    // March non-planned: a2, a3, a4 (a6 is planned → excluded)
    expect(result).toHaveLength(3);
    expect(result.every(a => a.date.startsWith('2026-03'))).toBe(true);
  });

  it('filters by year', () => {
    const result = filterAppointmentsByDate(appointments, {
      timeRange: 'year',
      referenceDate: REF,
    });
    // All 2026 non-planned: a1, a2, a3, a4, a5
    expect(result).toHaveLength(5);
  });

  it('returns all non-planned for timeRange=all', () => {
    const result = filterAppointmentsByDate(appointments, {
      timeRange: 'all',
      referenceDate: REF,
    });
    expect(result).toHaveLength(5);
  });

  it('filters by custom date range', () => {
    const result = filterAppointmentsByDate(appointments, {
      timeRange: 'custom',
      startDate: '2026-03-01',
      endDate: '2026-03-15',
      referenceDate: REF,
    });
    // a2 (Mar 1), a3 (Mar 10) — a6 is planned
    expect(result).toHaveLength(2);
  });

  it('custom range with no start/end returns all non-planned', () => {
    const result = filterAppointmentsByDate(appointments, {
      timeRange: 'custom',
      referenceDate: REF,
    });
    expect(result).toHaveLength(5);
  });

  it('excludes planned appointments regardless of time range', () => {
    const plannedOnly = [makeAppointment('p1', '2026-03-10', { status: 'planned' })];
    const result = filterAppointmentsByDate(plannedOnly, {
      timeRange: 'month',
      referenceDate: REF,
    });
    expect(result).toHaveLength(0);
  });

  it('sorts results by date ascending', () => {
    const result = filterAppointmentsByDate(appointments, {
      timeRange: 'all',
      referenceDate: REF,
    });
    for (let i = 1; i < result.length; i++) {
      expect(new Date(result[i].date) >= new Date(result[i - 1].date)).toBe(true);
    }
  });

  it('includes end date boundary (23:59:59.999)', () => {
    const result = filterAppointmentsByDate(appointments, {
      timeRange: 'custom',
      startDate: '2026-03-01',
      endDate: '2026-03-01',
      referenceDate: REF,
    });
    // a2 is March 1 → should be included
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a2');
  });

  it('returns empty for empty input', () => {
    const result = filterAppointmentsByDate([], {
      timeRange: 'all',
      referenceDate: REF,
    });
    expect(result).toHaveLength(0);
  });
});
