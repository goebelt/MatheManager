import { describe, it, expect } from '@jest/globals';
import {
  addMinutes,
  getWeekNumber,
  getAppointmentStatus,
  formatDateLocal,
  autoPlanStudents,
  generateTimeSlots,
  getBreakBlocks,
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
    id: 'a2', studentIds: ['s1'], date: '2026-03-16', time: '10:00', duration: 60, status: 'attended',
  };

  it('returns ok for a single appointment', () => {
    expect(getAppointmentStatus(baseAppointment, [baseAppointment])).toBe('ok');
  });
  it('returns ok when there is enough gap (>5min)', () => {
    const earlier: Appointment = { ...baseAppointment, id: 'a1', time: '08:00', duration: 60 };
    const later: Appointment = { ...baseAppointment, id: 'a2', time: '09:10' };
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
    expect(getAppointmentStatus(later, [earlier, later])).toBe('conflict');
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
});

// ── autoPlanStudents ──

describe('autoPlanStudents', () => {
  it('generates appointments from preferred schedule', () => {
    const students = [{
      id: 's1', familyId: 'f1', firstName: 'Max', defaultDuration: 60,
      rhythm: 'weekly' as const,
      preferredSchedule: [{ dayOfWeek: 1, time: '14:00', rhythm: 'weekly' as const }],
    }];
    const start = new Date(2026, 0, 5);
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
    const start = new Date(2026, 0, 5);
    const result = autoPlanStudents(students, [], start, 4);
    expect(result.length).toBe(2);
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
  it('returns empty array for no students', () => {
    const result = autoPlanStudents([], [], new Date(), 4);
    expect(result).toEqual([]);
  });
});

// ── timeToMinutes / minutesToTime ──

describe('timeToMinutes', () => {
  it('converts 00:00 to 0', () => { expect(timeToMinutes('00:00')).toBe(0); });
  it('converts 08:00 to 480', () => { expect(timeToMinutes('08:00')).toBe(480); });
  it('converts 20:00 to 1200', () => { expect(timeToMinutes('20:00')).toBe(1200); });
  it('converts 14:30 to 870', () => { expect(timeToMinutes('14:30')).toBe(870); });
});

describe('minutesToTime', () => {
  it('converts 0 to 00:00', () => { expect(minutesToTime(0)).toBe('00:00'); });
  it('converts 480 to 08:00', () => { expect(minutesToTime(480)).toBe('08:00'); });
  it('converts 1200 to 20:00', () => { expect(minutesToTime(1200)).toBe('20:00'); });
  it('converts 870 to 14:30', () => { expect(minutesToTime(870)).toBe('14:30'); });
});

// ── isWeekend ──

describe('isWeekend', () => {
  it('returns true for Saturday', () => { expect(isWeekend('2026-04-25')).toBe(true); });
  it('returns true for Sunday', () => { expect(isWeekend('2026-04-26')).toBe(true); });
  it('returns false for Monday', () => { expect(isWeekend('2026-04-20')).toBe(false); });
  it('returns false for Friday', () => { expect(isWeekend('2026-04-24')).toBe(false); });
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
  it('defaults weekdayBreakStart to 12:10', () => {
    expect(getDefaultScheduleSettings().weekdayBreakStart).toBe('12:10');
  });
  it('defaults weekdayBreakEnd to 13:00', () => {
    expect(getDefaultScheduleSettings().weekdayBreakEnd).toBe('13:00');
  });
  it('defaults weekendBreakStart to empty', () => {
    expect(getDefaultScheduleSettings().weekendBreakStart).toBe('');
  });
  it('defaults weekendBreakEnd to empty', () => {
    expect(getDefaultScheduleSettings().weekendBreakEnd).toBe('');
  });
});

// ── getBreakBlocks ──

describe('getBreakBlocks', () => {
  const weekdaySettings = getDefaultScheduleSettings();

  it('returns break block for a weekday with configured break', () => {
    const blocks = getBreakBlocks('2026-04-20', weekdaySettings); // Monday
    expect(blocks.length).toBe(1);
    expect(blocks[0]).toMatchObject({
      startTime: '12:10',
      endTime: '13:00',
      duration: 50,
      label: 'Mittagspause',
    });
  });

  it('returns empty array for weekend when no break configured', () => {
    const blocks = getBreakBlocks('2026-04-25', weekdaySettings); // Saturday
    expect(blocks).toEqual([]);
  });

  it('returns break block for weekend when configured', () => {
    const weekendSettings = { ...weekdaySettings, weekendBreakStart: '11:30', weekendBreakEnd: '12:00' };
    const blocks = getBreakBlocks('2026-04-25', weekendSettings); // Saturday
    expect(blocks.length).toBe(1);
    expect(blocks[0].startTime).toBe('11:30');
    expect(blocks[0].endTime).toBe('12:00');
    expect(blocks[0].duration).toBe(30);
  });

  it('returns empty array when break start is empty', () => {
    const settings = { ...weekdaySettings, weekdayBreakStart: '' };
    const blocks = getBreakBlocks('2026-04-20', settings);
    expect(blocks).toEqual([]);
  });

  it('returns empty array when break end is empty', () => {
    const settings = { ...weekdaySettings, weekdayBreakEnd: '' };
    const blocks = getBreakBlocks('2026-04-20', settings);
    expect(blocks).toEqual([]);
  });

  it('returns empty array when break end is before break start', () => {
    const settings = { ...weekdaySettings, weekdayBreakStart: '13:00', weekdayBreakEnd: '12:10' };
    const blocks = getBreakBlocks('2026-04-20', settings);
    expect(blocks).toEqual([]);
  });

  it('includes correct date in break block', () => {
    const blocks = getBreakBlocks('2026-03-16', weekdaySettings);
    expect(blocks[0].date).toBe('2026-03-16');
  });
});

// ── generateTimeSlots ──

describe('generateTimeSlots', () => {
  it('fills entire window with 90-min slots when no appointments exist', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '20:00', 90, 10);
    expect(slots.length).toBe(7);
    expect(slots[0]).toMatchObject({ startTime: '08:00', endTime: '09:30', duration: 90, isPlaceholder: true });
    expect(slots[1].startTime).toBe('09:40');
    expect(slots[6].startTime).toBe('18:00');
  });

  it('leaves gaps around existing appointments', () => {
    const appointments: Appointment[] = [{
      id: 'a1', studentIds: ['s1'], date: '2026-04-20', time: '10:00', duration: 60, status: 'attended',
    }];
    const slots = generateTimeSlots('2026-04-20', appointments, '08:00', '20:00', 90, 10);
    const beforeSlot = slots.find(s => s.endTime <= '10:00');
    const afterSlot = slots.find(s => s.startTime >= '11:00');
    expect(beforeSlot).toBeDefined();
    expect(afterSlot).toBeDefined();
  });

  it('respects 10-minute break between slots', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 60, 10);
    expect(slots.length).toBe(4);
    expect(slots[0]).toMatchObject({ startTime: '08:00', endTime: '09:00' });
    expect(slots[1]).toMatchObject({ startTime: '09:10', endTime: '10:10' });
  });

  it('ignores appointments on different days', () => {
    const appointments: Appointment[] = [
      { id: 'a1', studentIds: ['s1'], date: '2026-04-21', time: '10:00', duration: 60, status: 'attended' },
    ];
    const slots = generateTimeSlots('2026-04-20', appointments, '08:00', '20:00', 90, 10);
    expect(slots.length).toBe(7);
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

  // ── Break block integration ──

  it('excludes lunch break area from slots', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '20:00', 90, 10, '12:10', '13:00');
    // Lunch 12:10-13:00 is treated as occupied → no slots should overlap it
    const overlapping = slots.find(s =>
      (s.startTime < '13:00' && s.endTime > '12:10')
    );
    expect(overlapping).toBeUndefined();
  });

  it('splits morning and afternoon slots around lunch break', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '20:00', 90, 10, '12:10', '13:00');
    // Morning: 08:00-12:10 = 250 min → slots before 12:10
    const morningSlots = slots.filter(s => s.endTime <= '12:10');
    const afternoonSlots = slots.filter(s => s.startTime >= '13:00');
    expect(morningSlots.length).toBeGreaterThanOrEqual(1);
    expect(afternoonSlots.length).toBeGreaterThanOrEqual(1);
  });

  it('places slots correctly around a lunch break from 12:10 to 13:00', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '17:00', 90, 10, '12:10', '13:00');
    // Morning: 08:00 → 09:30 (90min), break 10min, 09:40 → 11:10 (90min), break 10min
    // 11:20 → 12:10 = 50 min (short) → one 50-min slot? No, need ≥30 min → 50 min slot
    // After lunch: 13:00 → 14:30 (90min), break 10min, 14:40 → 16:10 (90min)
    // Remaining: 16:20 → 17:00 = 40 min → one 40-min slot
    expect(slots.find(s => s.startTime === '11:20')).toMatchObject({ endTime: '12:10', duration: 50 });
    expect(slots.find(s => s.startTime === '13:00')).toMatchObject({ endTime: '14:30', duration: 90 });
  });

  it('works without break parameters (no lunch)', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 90, 10);
    // Same as before – no break block
    expect(slots.length).toBeGreaterThanOrEqual(1);
    const overlapping = slots.find(s => s.startTime === undefined);
    expect(overlapping).toBeUndefined();
  });

  it('handles lunch break overlapping with appointment', () => {
    const appointments: Appointment[] = [{
      id: 'a1', studentIds: ['s1'], date: '2026-04-20', time: '11:30', duration: 120, status: 'attended',
    }];
    // Appointment 11:30-13:30, Lunch 12:10-13:00 → merged block: 11:20-13:40
    // (with 10min break around appointment, lunch merged in)
    const slots = generateTimeSlots('2026-04-20', appointments, '08:00', '17:00', 90, 10, '12:10', '13:00');
    // No slots should overlap the merged block
    const overlapping = slots.find(s =>
      s.startTime < '13:40' && s.endTime > '11:20'
    );
    expect(overlapping).toBeUndefined();
  });

  it('does not add extra break padding around lunch break', () => {
    // Lunch 12:10-13:00 → occupied block is exactly 12:10-13:00 (no ±10min padding)
    // So a slot ending at 12:10 should be allowed, and one starting at 13:00 too
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '17:00', 60, 10, '12:10', '13:00');
    // A 60-min slot from 11:10-12:10 ends exactly at break start → should exist
    const slotEndingAtBreak = slots.find(s => s.endTime === '12:10');
    expect(slotEndingAtBreak).toBeDefined();
    // A 60-min slot from 13:00-14:00 starts exactly at break end → should exist
    const slotStartingAtBreak = slots.find(s => s.startTime === '13:00');
    expect(slotStartingAtBreak).toBeDefined();
  });

  it('ignores break if breakStart is undefined', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 90, 10, undefined, '13:00');
    // No break → same as no break
    expect(slots.length).toBeGreaterThanOrEqual(1);
  });

  it('ignores break if breakEnd is undefined', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 90, 10, '12:10', undefined);
    expect(slots.length).toBeGreaterThanOrEqual(1);
  });
});
