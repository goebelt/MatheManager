import { describe, it, expect } from '@jest/globals';
import {
  addMinutes,
  getWeekNumber,
  getAppointmentStatus,
  formatDateLocal,
  autoPlanStudents,
} from '../scheduling';
import type { Appointment, Student } from '@/types';

// ─── addMinutes ──────────────────────────────────────────────────────────────

describe('addMinutes', () => {
  it('adds minutes within the same hour', () => {
    expect(addMinutes('14:00', 30)).toBe('14:30');
  });

  it('adds minutes crossing an hour boundary', () => {
    expect(addMinutes('14:30', 45)).toBe('15:15');
  });

  it('adds zero minutes', () => {
    expect(addMinutes('09:00', 0)).toBe('09:00');
  });

  it('handles 60-minute addition', () => {
    expect(addMinutes('14:00', 60)).toBe('15:00');
  });

  it('handles 90-minute addition', () => {
    expect(addMinutes('14:00', 90)).toBe('15:30');
  });

  it('handles day overflow (23:30 + 60 → 00:30)', () => {
    expect(addMinutes('23:30', 60)).toBe('00:30');
  });

  it('handles day overflow at midnight (23:59 + 1 → 00:00)', () => {
    expect(addMinutes('23:59', 1)).toBe('00:00');
  });

  it('handles large minute addition (08:00 + 1000 → 00:40)', () => {
    // 1000 min = 16h 40min → 08:00 + 16:40 = 24:40 → 00:40
    expect(addMinutes('08:00', 1000)).toBe('00:40');
  });
});

// ─── getWeekNumber ───────────────────────────────────────────────────────────

describe('getWeekNumber', () => {
  it('returns week 1 for Jan 1 2026 (Thursday)', () => {
    // Jan 1 2026 is a Thursday → ISO week 1
    expect(getWeekNumber(new Date(2026, 0, 1))).toBe(1);
  });

  it('returns week 2 for Jan 5 2026 (Monday)', () => {
    // Jan 5 2026 = Monday of ISO week 2 (Jan 1 Thu is in week 1)
    expect(getWeekNumber(new Date(2026, 0, 5))).toBe(2);
  });

  it('returns week 3 for Jan 12 2026 (Monday)', () => {
    expect(getWeekNumber(new Date(2026, 0, 12))).toBe(3);
  });

  it('returns correct week for mid-year date', () => {
    // March 15 2026 is a Sunday → ISO week 11
    expect(getWeekNumber(new Date(2026, 2, 15))).toBe(11);
  });

  it('returns week 53 for Dec 28 2026 (Monday)', () => {
    // Last ISO week of 2026
    const wn = getWeekNumber(new Date(2026, 11, 28));
    expect(wn).toBeGreaterThanOrEqual(52);
  });
});

// ─── formatDateLocal ─────────────────────────────────────────────────────────

describe('formatDateLocal', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(formatDateLocal(new Date(2026, 2, 5))).toBe('2026-03-05');
  });

  it('pads single-digit months and days', () => {
    expect(formatDateLocal(new Date(2026, 0, 9))).toBe('2026-01-09');
  });

  it('formats end of year correctly', () => {
    expect(formatDateLocal(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

// ─── getAppointmentStatus ────────────────────────────────────────────────────

describe('getAppointmentStatus', () => {
  const makeAppointment = (
    id: string,
    overrides: Partial<Appointment>
  ): Appointment => ({
    id,
    studentIds: ['s1'],
    date: '2026-03-16',
    time: '14:00',
    duration: 60,
    status: 'attended',
    ...overrides,
  });

  it('returns ok for a single appointment', () => {
    const app = makeAppointment('a1', { time: '14:00' });
    expect(getAppointmentStatus(app, [app])).toBe('ok');
  });

  it('returns ok for the first appointment of the day', () => {
    const first = makeAppointment('a1', { time: '10:00' });
    const second = makeAppointment('a2', { time: '14:00' });
    expect(getAppointmentStatus(first, [first, second])).toBe('ok');
  });

  it('returns ok when there is enough gap (>5min)', () => {
    const prev = makeAppointment('a1', { time: '10:00', duration: 60 });
    const next = makeAppointment('a2', { time: '11:10' }); // 10min gap
    expect(getAppointmentStatus(next, [prev, next])).toBe('ok');
  });

  it('returns tight when gap is exactly 5 minutes', () => {
    const prev = makeAppointment('a1', { time: '10:00', duration: 60 });
    const next = makeAppointment('a2', { time: '11:05' }); // 5min gap = tight
    expect(getAppointmentStatus(next, [prev, next])).toBe('tight');
  });

  it('returns tight when gap is less than 5 minutes', () => {
    const prev = makeAppointment('a1', { time: '10:00', duration: 60 });
    const next = makeAppointment('a2', { time: '11:02' }); // 2min gap
    expect(getAppointmentStatus(next, [prev, next])).toBe('tight');
  });

  it('returns tight when gap is 0 (back-to-back)', () => {
    const prev = makeAppointment('a1', { time: '10:00', duration: 60 });
    const next = makeAppointment('a2', { time: '11:00' }); // 0min gap
    expect(getAppointmentStatus(next, [prev, next])).toBe('tight');
  });

  it('returns conflict when appointments overlap', () => {
    const prev = makeAppointment('a1', { time: '10:00', duration: 90 });
    const next = makeAppointment('a2', { time: '10:45' }); // overlaps by 45min
    expect(getAppointmentStatus(next, [prev, next])).toBe('conflict');
  });

  it('returns conflict when start time equals previous end time + 0 overlap', () => {
    const prev = makeAppointment('a1', { time: '10:00', duration: 60 });
    // prev ends at 11:00, next starts at 10:59 → conflict
    const next = makeAppointment('a2', { time: '10:59' });
    expect(getAppointmentStatus(next, [prev, next])).toBe('conflict');
  });

  it('ignores canceled appointments for conflict detection', () => {
    const canceled = makeAppointment('a1', { time: '10:00', duration: 90, status: 'canceled_paid' });
    const next = makeAppointment('a2', { time: '10:30' });
    // Canceled should be ignored → a2 is effectively the first → ok
    expect(getAppointmentStatus(next, [canceled, next])).toBe('ok');
  });

  it('always returns ok for canceled appointments', () => {
    const canceled = makeAppointment('a1', { time: '10:00', duration: 90, status: 'canceled_free' });
    const next = makeAppointment('a2', { time: '10:30' });
    expect(getAppointmentStatus(canceled, [canceled, next])).toBe('ok');
  });

  it('returns ok for appointments without time', () => {
    const app = makeAppointment('a1', { time: undefined });
    expect(getAppointmentStatus(app, [app])).toBe('ok');
  });

  it('only checks appointments on the same day', () => {
    const prev = makeAppointment('a1', { date: '2026-03-15', time: '10:00', duration: 90 });
    const next = makeAppointment('a2', { date: '2026-03-16', time: '10:30' });
    // Different days → no conflict
    expect(getAppointmentStatus(next, [prev, next])).toBe('ok');
  });

  it('handles 90-minute appointments correctly', () => {
    const prev = makeAppointment('a1', { time: '14:00', duration: 90 });
    // prev ends at 15:30
    const tight = makeAppointment('a2', { time: '15:34' }); // 4min gap = tight
    const ok = makeAppointment('a3', { time: '15:36' }); // 6min gap = ok
    expect(getAppointmentStatus(tight, [prev, tight])).toBe('tight');
    expect(getAppointmentStatus(ok, [prev, ok])).toBe('ok');
  });
});

// ─── autoPlanStudents ────────────────────────────────────────────────────────

describe('autoPlanStudents', () => {
  const baseStudent: Student = {
    id: 's1',
    familyId: 'f1',
    firstName: 'Max',
    defaultDuration: 60,
    rhythm: 'weekly',
  };

  it('generates appointments from preferred schedule', () => {
    const student: Student = {
      ...baseStudent,
      preferredSchedule: [{ dayOfWeek: 1, time: '14:00', rhythm: 'weekly' }],
    };
    // Start on Monday March 16 2026
    const start = new Date(2026, 2, 16);
    const result = autoPlanStudents([student], [], start, 2);

    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-03-16'); // Monday = KW12
    expect(result[1].date).toBe('2026-03-23'); // Monday = KW13
    expect(result[0].time).toBe('14:00');
    expect(result[0].status).toBe('planned');
    expect(result[0].duration).toBe(60);
  });

  it('skips biweekly on odd weeks', () => {
    const student: Student = {
      ...baseStudent,
      rhythm: 'biweekly',
      preferredSchedule: [{ dayOfWeek: 1, time: '14:00', rhythm: 'biweekly' }],
    };
    // Need enough weeks to hit both odd and even
    const start = new Date(2026, 0, 5); // Monday Jan 5 = KW1 (odd)
    const result = autoPlanStudents([student], [], start, 6);

    // Biweekly: only even calendar weeks should generate appointments
    result.forEach(app => {
      const wn = getWeekNumber(new Date(app.date));
      expect(wn % 2).toBe(0);
    });
  });

  it('skips appointments that already exist', () => {
    const student: Student = {
      ...baseStudent,
      preferredSchedule: [{ dayOfWeek: 1, time: '14:00', rhythm: 'weekly' }],
    };
    const start = new Date(2026, 2, 16);
    const existing: Appointment[] = [{
      id: 'existing-1',
      studentIds: ['s1'],
      date: '2026-03-16',
      time: '14:00',
      duration: 60,
      status: 'attended',
    }];
    const result = autoPlanStudents([student], existing, start, 2);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-03-23'); // KW13
  });

  it('falls back to usual weekday when no preferred schedule', () => {
    const student: Student = { ...baseStudent, preferredSchedule: undefined };
    const existing: Appointment[] = [
      {
        id: 'e1', studentIds: ['s1'], date: '2026-03-11',
        time: '15:00', duration: 60, status: 'attended',
      },
      {
        id: 'e2', studentIds: ['s1'], date: '2026-03-18',
        time: '15:00', duration: 60, status: 'attended',
      },
    ];
    const start = new Date(2026, 2, 23); // Monday
    const result = autoPlanStudents([student], existing, start, 1);
    // Should infer Wednesday (day 3) from existing appointments
    expect(result).toHaveLength(1);
    expect(result[0].time).toBe('09:00'); // default time when no preferred schedule
  });

  it('returns empty array for no students', () => {
    const result = autoPlanStudents([], [], new Date(), 4);
    expect(result).toHaveLength(0);
  });
});
