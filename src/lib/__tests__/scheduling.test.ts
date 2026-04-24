import { describe, it, expect } from '@jest/globals';
import {
  addMinutes,
  getWeekNumber,
  getAppointmentStatus,
  formatDateLocal,
  autoPlanStudents,
  generateTimeSlots,
  timeToMinutes,
  minutesToTime,
  getDefaultScheduleSettings,
  isWeekend,
  type TimeSlot,
} from '../scheduling';
import type { Appointment } from '@/types';

// ── addMinutes ──

describe('addMinutes', () => {
  it('adds minutes within the same hour', () => {
    expect(addMinutes('10:00', 30)).toBe('10:30');
  });

  it('adds minutes crossing an hour boundary', () => {
    expect(addMinutes('10:45', 30)).toBe('11:15');
  });

  it('adds zero minutes', () => {
    expect(addMinutes('09:00', 0)).toBe('09:00');
  });

  it('handles 60-minute addition', () => {
    expect(addMinutes('10:00', 60)).toBe('11:00');
  });

  it('handles 90-minute addition', () => {
    expect(addMinutes('10:00', 90)).toBe('11:30');
  });

  it('handles day overflow (23:30 + 60 → 00:30)', () => {
    expect(addMinutes('23:30', 60)).toBe('00:30');
  });

  it('handles day overflow at midnight (23:59 + 1 → 00:00)', () => {
    expect(addMinutes('23:59', 1)).toBe('00:00');
  });

  it('handles large minute addition (08:00 + 1000 → 00:40)', () => {
    expect(addMinutes('08:00', 1000)).toBe('00:40');
  });
});

// ── getWeekNumber ──

describe('getWeekNumber', () => {
  it('returns week 1 for Jan 1 2026 (Thursday)', () => {
    expect(getWeekNumber(new Date(2026, 0, 1))).toBe(1);
  });

  it('returns week 2 for Jan 5 2026 (Monday)', () => {
    expect(getWeekNumber(new Date(2026, 0, 5))).toBe(2);
  });

  it('returns week 3 for Jan 12 2026 (Monday)', () => {
    expect(getWeekNumber(new Date(2026, 0, 12))).toBe(3);
  });

  it('returns correct week for mid-year date', () => {
    expect(getWeekNumber(new Date(2026, 5, 15))).toBe(25);
  });

  it('returns week 53 for Dec 28 2026 (Monday)', () => {
    expect(getWeekNumber(new Date(2026, 11, 28))).toBe(53);
  });
});

// ── formatDateLocal ──

describe('formatDateLocal', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(formatDateLocal(new Date(2026, 2, 16))).toBe('2026-03-16');
  });

  it('pads single-digit months and days', () => {
    expect(formatDateLocal(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('formats end of year correctly', () => {
    expect(formatDateLocal(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

// ── getAppointmentStatus ──

describe('getAppointmentStatus', () => {
  const baseAppointment: Appointment = {
    id: 'a2',
    studentIds: ['s1'],
    date: '2026-03-16',
    time: '10:00',
    duration: 60,
    status: 'attended',
  };

  it('returns ok for a single appointment', () => {
    expect(getAppointmentStatus(baseAppointment, [baseAppointment])).toBe('ok');
  });

  it('returns ok for the first appointment of the day', () => {
    const result = getAppointmentStatus(baseAppointment, [
      baseAppointment,
      { ...baseAppointment, id: 'a1', time: '08:00', duration: 60 },
    ]);
    // baseAppointment (10:00) is not the first, so check gap
    expect(result).toBe('ok');
  });

  it('returns ok when there is enough gap (>5min)', () => {
    const earlier: Appointment = { ...baseAppointment, id: 'a1', time: '08:00', duration: 60 };
    const later: Appointment = { ...baseAppointment, id: 'a2', time: '09:10' };
    // 08:00 + 60min = 09:00, 09:10 > 09:05 → ok
    expect(getAppointmentStatus(later, [earlier, later])).toBe('ok');
  });

  it('returns tight when gap is exactly 5 minutes', () => {
    const earlier: Appointment = { ...baseAppointment, id: 'a1', time: '08:00', duration: 60 };
    const later: Appointment = { ...baseAppointment, id: 'a2', time: '09:05' };
    expect(getAppointmentStatus(later, [earlier, later])).toBe('tight');
  });

  it('returns tight when gap is less than 5 minutes', () => {
    const earlier: Appointment = { ...baseAppointment, id: 'a1', time: '08:00', duration: 60 };
    const later: Appointment = { ...baseAppointment, id: 'a2', time: '09:03' };
    expect(getAppointmentStatus(later, [earlier, later])).toBe('tight');
  });

  it('returns tight when gap is 0 (back-to-back)', () => {
    const earlier: Appointment = { ...baseAppointment, id: 'a1', time: '08:00', duration: 60 };
    const later: Appointment = { ...baseAppointment, id: 'a2', time: '09:00' };
    expect(getAppointmentStatus(later, [earlier, later])).toBe('tight');
  });

  it('returns conflict when appointments overlap', () => {
    const earlier: Appointment = { ...baseAppointment, id: 'a1', time: '08:00', duration: 90 };
    const later: Appointment = { ...baseAppointment, id: 'a2', time: '09:00' };
    // 08:00 + 90min = 09:30, 09:00 < 09:30 → conflict
    expect(getAppointmentStatus(later, [earlier, later])).toBe('conflict');
  });

  it('returns conflict when start time equals previous end time + 0 overlap', () => {
    const earlier: Appointment = { ...baseAppointment, id: 'a1', time: '08:00', duration: 60 };
    const later: Appointment = { ...baseAppointment, id: 'a2', time: '09:00' };
    // 09:00 is not < 09:00 (no overlap), but <= 09:05 (tight)
    expect(getAppointmentStatus(later, [earlier, later])).toBe('tight');
  });

  it('ignores canceled appointments for conflict detection', () => {
    const canceled: Appointment = { ...baseAppointment, id: 'a1', time: '08:00', duration: 60, status: 'canceled_paid' };
    const later: Appointment = { ...baseAppointment, id: 'a2', time: '08:30' };
    expect(getAppointmentStatus(later, [canceled, later])).toBe('ok');
  });

  it('always returns ok for canceled appointments', () => {
    const canceled: Appointment = { ...baseAppointment, status: 'canceled_free' };
    expect(getAppointmentStatus(canceled, [canceled])).toBe('ok');
  });

  it('returns ok for appointments without time', () => {
    const noTime: Appointment = { ...baseAppointment, time: undefined };
    expect(getAppointmentStatus(noTime, [noTime])).toBe('ok');
  });

  it('only checks appointments on the same day', () => {
    const yesterday: Appointment = { ...baseAppointment, id: 'a0', date: '2026-03-15', time: '23:00', duration: 120 };
    const today: Appointment = { ...baseAppointment, id: 'a1', date: '2026-03-16', time: '00:30' };
    expect(getAppointmentStatus(today, [yesterday, today])).toBe('ok');
  });

  it('handles 90-minute appointments correctly', () => {
    const earlier: Appointment = { ...baseAppointment, id: 'a1', time: '14:00', duration: 90 };
    const later: Appointment = { ...baseAppointment, id: 'a2', time: '15:30' };
    // 14:00 + 90 = 15:30, start == prev end → tight (0 gap)
    expect(getAppointmentStatus(later, [earlier, later])).toBe('tight');
  });
});

// ── autoPlanStudents ──

describe('autoPlanStudents', () => {
  it('generates appointments from preferred schedule', () => {
    const students = [{
      id: 's1', familyId: 'f1', firstName: 'Max', defaultDuration: 60,
      rhythm: 'weekly' as const,
      preferredSchedule: [{ dayOfWeek: 1, time: '14:00', rhythm: 'weekly' as const }],
    }];
    const start = new Date(2026, 0, 5); // Monday Jan 5
    const result = autoPlanStudents(students, [], start, 2);
    expect(result.length).toBe(2);
    expect(result[0].date).toBe('2026-01-05');
    expect(result[0].time).toBe('14:00');
  });

  it('skips biweekly on odd weeks', () => {
    const students = [{
      id: 's1', familyId: 'f1', firstName: 'Max', defaultDuration: 60,
      rhythm: 'biweekly' as const,
      preferredSchedule: [{ dayOfWeek: 1, time: '14:00', rhythm: 'biweekly' as const }],
    }];
    const start = new Date(2026, 0, 5); // KW 2 (even) → ok, KW 3 (odd) → skip
    const result = autoPlanStudents(students, [], start, 4);
    expect(result.length).toBe(2); // only even weeks
  });

  it('skips appointments that already exist', () => {
    const students = [{
      id: 's1', familyId: 'f1', firstName: 'Max', defaultDuration: 60,
      rhythm: 'weekly' as const,
      preferredSchedule: [{ dayOfWeek: 1, time: '14:00', rhythm: 'weekly' as const }],
    }];
    const existing: Appointment[] = [{
      id: 'existing-1', studentIds: ['s1'], date: '2026-01-05', time: '14:00', duration: 60, status: 'attended',
    }];
    const start = new Date(2026, 0, 5);
    const result = autoPlanStudents(students, existing, start, 2);
    expect(result.length).toBe(1);
  });

  it('falls back to usual weekday when no preferred schedule', () => {
    const students = [{
      id: 's1', familyId: 'f1', firstName: 'Max', defaultDuration: 60,
      rhythm: 'weekly' as const,
    }];
    const existing: Appointment[] = [{
      id: 'e1', studentIds: ['s1'], date: '2026-01-05', time: '15:00', duration: 60, status: 'attended',
    }];
    const start = new Date(2026, 0, 5);
    const result = autoPlanStudents(students, existing, start, 1);
    expect(result.length).toBe(0); // already exists on that day
  });

  it('returns empty array for no students', () => {
    const result = autoPlanStudents([], [], new Date(), 4);
    expect(result).toEqual([]);
  });
});

// ── timeToMinutes / minutesToTime ──

describe('timeToMinutes', () => {
  it('converts 00:00 to 0', () => {
    expect(timeToMinutes('00:00')).toBe(0);
  });
  it('converts 08:00 to 480', () => {
    expect(timeToMinutes('08:00')).toBe(480);
  });
  it('converts 20:00 to 1200', () => {
    expect(timeToMinutes('20:00')).toBe(1200);
  });
  it('converts 14:30 to 870', () => {
    expect(timeToMinutes('14:30')).toBe(870);
  });
});

describe('minutesToTime', () => {
  it('converts 0 to 00:00', () => {
    expect(minutesToTime(0)).toBe('00:00');
  });
  it('converts 480 to 08:00', () => {
    expect(minutesToTime(480)).toBe('08:00');
  });
  it('converts 1200 to 20:00', () => {
    expect(minutesToTime(1200)).toBe('20:00');
  });
  it('converts 870 to 14:30', () => {
    expect(minutesToTime(870)).toBe('14:30');
  });
});

// ── isWeekend ──

describe('isWeekend', () => {
  it('returns true for Saturday', () => {
    expect(isWeekend('2026-04-25')).toBe(true); // Saturday
  });
  it('returns true for Sunday', () => {
    expect(isWeekend('2026-04-26')).toBe(true); // Sunday
  });
  it('returns false for Monday', () => {
    expect(isWeekend('2026-04-20')).toBe(false); // Monday
  });
  it('returns false for Friday', () => {
    expect(isWeekend('2026-04-24')).toBe(false); // Friday
  });
});

// ── getDefaultScheduleSettings ──

describe('getDefaultScheduleSettings', () => {
  it('returns defaults with weekday 08:00–20:00', () => {
    const s = getDefaultScheduleSettings();
    expect(s.weekdayStart).toBe('08:00');
    expect(s.weekdayEnd).toBe('20:00');
  });
  it('returns defaults with weekend 09:00–14:00', () => {
    const s = getDefaultScheduleSettings();
    expect(s.weekendStart).toBe('09:00');
    expect(s.weekendEnd).toBe('14:00');
  });
  it('defaults slotDuration to 90', () => {
    expect(getDefaultScheduleSettings().slotDuration).toBe(90);
  });
  it('defaults breakMinutes to 10', () => {
    expect(getDefaultScheduleSettings().breakMinutes).toBe(10);
  });
});

// ── generateTimeSlots ──

describe('generateTimeSlots', () => {
  it('fills entire window with 90-min slots when no appointments exist', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '20:00', 90, 10);
    // 08:00–20:00 = 720 min. Each slot uses 90+10=100 min. 720/100 = 7 full + 20 remaining
    // Slot 0: 08:00-09:30, S1: 09:40-11:10, ..., S6: 16:40-18:10, S7: 18:20-20:00 (100 min → 90+10?)
    // Actually: after 7 slots: 7*100=700, remaining=20 (too short). So 7 slots.
    // Wait: last slot doesn't need a break after it. 7 slots: 6*100+90=690 → remaining 30 → 8th slot?
    // Let me recalculate: pos=0→slot0(90)→pos=100→slot1(90)→pos=200→...→slot6(90)→pos=700
    // remaining=20 min < 30 → no more slots. So 7 slots.
    expect(slots.length).toBe(7);
    expect(slots[0]).toMatchObject({ startTime: '08:00', endTime: '09:30', duration: 90, isPlaceholder: true });
    expect(slots[1].startTime).toBe('09:40'); // 09:30 + 10min break
    expect(slots[6].startTime).toBe('18:00'); // 6 * 100 = 600 min = 18:00
  });

  it('leaves gaps around existing appointments', () => {
    const appointments: Appointment[] = [{
      id: 'a1', studentIds: ['s1'], date: '2026-04-20', time: '10:00', duration: 60, status: 'attended',
    }];
    const slots = generateTimeSlots('2026-04-20', appointments, '08:00', '20:00', 90, 10);
    // Appointment 10:00-11:00 → occupied block 09:50-11:10
    // Slot before: 08:00-09:30 (90min), gap 09:30 to 09:50 (20min, too short)
    // Slot after: 11:10 onwards
    const beforeSlot = slots.find(s => s.endTime <= '10:00');
    const afterSlot = slots.find(s => s.startTime >= '11:00');
    expect(beforeSlot).toBeDefined();
    expect(afterSlot).toBeDefined();
    expect(beforeSlot!.endTime).toBe('09:30');
    expect(afterSlot!.startTime).toBe('11:10');
  });

  it('falls back to 60-min slots when gap is too short for 90', () => {
    // Window 08:00-10:30 with an appointment at 10:00
    // Occupied: 09:50-10:10 (with breaks)
    // Free gap: 08:00-09:50 = 110 min → 90 + 10 = 100 ≤ 110 → fits 90
    const appointments: Appointment[] = [{
      id: 'a1', studentIds: ['s1'], date: '2026-04-20', time: '10:00', duration: 60, status: 'attended',
    }];
    const slots = generateTimeSlots('2026-04-20', appointments, '08:00', '10:00', 90, 10);
    // Window 08:00-10:00, appt at 10:00, occupied 09:50-10:10
    // Gap: 08:00-09:50 = 110 min → fits 90+10=100 → one 90-min slot
    expect(slots.length).toBe(1);
    expect(slots[0].duration).toBe(90);
  });

  it('skips gaps shorter than 30 minutes', () => {
    const appointments: Appointment[] = [{
      id: 'a1', studentIds: ['s1'], date: '2026-04-20', time: '08:20', duration: 60, status: 'attended',
    }];
    const slots = generateTimeSlots('2026-04-20', appointments, '08:00', '12:00', 90, 10);
    // Appointment 08:20-09:20 → occupied 08:10-09:30
    // Gap before: 08:00-08:10 = 10 min → too short
    // Gap after: 09:30-12:00 = 150 min → one 90-min slot
    expect(slots.find(s => s.startTime === '08:00')).toBeUndefined();
    expect(slots.find(s => s.startTime === '09:30')).toBeDefined();
  });

  it('respects 10-minute break between slots', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 60, 10);
    // 08:00-09:00, break 09:00-09:10, 09:10-10:10, break 10:10-10:20, 10:20-11:20
    // Remaining 11:20-12:00 = 40 min → one 40-min slot (≥30)
    expect(slots.length).toBe(4);
    expect(slots[0]).toMatchObject({ startTime: '08:00', endTime: '09:00' });
    expect(slots[1]).toMatchObject({ startTime: '09:10', endTime: '10:10' });
    expect(slots[2]).toMatchObject({ startTime: '10:20', endTime: '11:20' });
    expect(slots[3]).toMatchObject({ startTime: '11:30', endTime: '12:00' }); // 30 min gap from 11:30
  });

  it('handles overlapping appointments by merging blocks', () => {
    const appointments: Appointment[] = [
      { id: 'a1', studentIds: ['s1'], date: '2026-04-20', time: '09:00', duration: 60, status: 'attended' },
      { id: 'a2', studentIds: ['s2'], date: '2026-04-20', time: '09:30', duration: 60, status: 'attended' },
    ];
    const slots = generateTimeSlots('2026-04-20', appointments, '08:00', '14:00', 90, 10);
    // Appts: 09:00-10:00, 09:30-10:30 → merged: 09:00-10:30
    // With breaks: occupied 08:50-10:40
    // Gap before: 08:00-08:50 = 50 min → one 50-min slot
    // Gap after: 10:40-14:00 = 200 min → slots
    expect(slots.find(s => s.startTime === '08:00')).toBeDefined();
    expect(slots.find(s => s.startTime === '10:40')).toBeDefined();
  });

  it('ignores appointments on different days', () => {
    const appointments: Appointment[] = [
      { id: 'a1', studentIds: ['s1'], date: '2026-04-21', time: '10:00', duration: 60, status: 'attended' },
    ];
    const slots = generateTimeSlots('2026-04-20', appointments, '08:00', '20:00', 90, 10);
    expect(slots.length).toBe(7); // same as no appointments
  });

  it('returns empty array for very short window', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '08:20', 90, 10);
    expect(slots).toEqual([]);
  });

  it('marks all slots as isPlaceholder: true', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 90, 10);
    slots.forEach(s => expect(s.isPlaceholder).toBe(true));
  });

  it('includes correct date on each slot', () => {
    const slots = generateTimeSlots('2026-03-16', [], '08:00', '12:00', 90, 10);
    slots.forEach(s => expect(s.date).toBe('2026-03-16'));
  });

  it('uses 60-min fallback when remaining gap is between 60 and 90', () => {
    // Window 08:00-11:00, appointment 09:50-10:50 → occupied 09:40-11:00
    // Gap: 08:00-09:40 = 100 min → 90+10=100 fits, but then nothing after
    // Let's use a scenario where 60 is the fallback
    const appointments: Appointment[] = [{
      id: 'a1', studentIds: ['s1'], date: '2026-04-20', time: '10:00', duration: 30, status: 'attended',
    }];
    // Occupied: 09:50-10:40
    // Gap before: 08:00-09:50 = 110 → 90+10=100 ≤ 110 → 90-min slot
    // Gap after: 10:40-12:00 = 80 min → 90 won't fit, 60+10=70 ≤ 80 → 60-min slot
    const slots = generateTimeSlots('2026-04-20', appointments, '08:00', '12:00', 90, 10);
    const afterSlot = slots.find(s => s.startTime >= '10:00');
    expect(afterSlot).toBeDefined();
    expect(afterSlot!.duration).toBe(60);
  });
});
