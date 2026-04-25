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
  it('adds minutes within the same hour', () => { expect(addMinutes('10:00', 30)).toBe('10:30'); });
  it('adds minutes crossing an hour boundary', () => { expect(addMinutes('10:45', 30)).toBe('11:15'); });
  it('adds zero minutes', () => { expect(addMinutes('09:00', 0)).toBe('09:00'); });
  it('handles 60-minute addition', () => { expect(addMinutes('10:00', 60)).toBe('11:00'); });
  it('handles 90-minute addition', () => { expect(addMinutes('10:00', 90)).toBe('11:30'); });
  it('handles day overflow (23:30 + 60 → 00:30)', () => { expect(addMinutes('23:30', 60)).toBe('00:30'); });
  it('handles day overflow at midnight', () => { expect(addMinutes('23:59', 1)).toBe('00:00'); });
  it('handles large minute addition', () => { expect(addMinutes('08:00', 1000)).toBe('00:40'); });
});

// ── getWeekNumber ──

describe('getWeekNumber', () => {
  it('returns week 1 for Jan 1 2026', () => { expect(getWeekNumber(new Date(2026, 0, 1))).toBe(1); });
  it('returns week 2 for Jan 5 2026', () => { expect(getWeekNumber(new Date(2026, 0, 5))).toBe(2); });
  it('returns week 3 for Jan 12 2026', () => { expect(getWeekNumber(new Date(2026, 0, 12))).toBe(3); });
  it('returns correct week for mid-year date', () => { expect(getWeekNumber(new Date(2026, 5, 15))).toBe(25); });
  it('returns week 53 for Dec 28 2026', () => { expect(getWeekNumber(new Date(2026, 11, 28))).toBe(53); });
});

// ── formatDateLocal ──

describe('formatDateLocal', () => {
  it('formats a date as YYYY-MM-DD', () => { expect(formatDateLocal(new Date(2026, 2, 16))).toBe('2026-03-16'); });
  it('pads single-digit months and days', () => { expect(formatDateLocal(new Date(2026, 0, 5))).toBe('2026-01-05'); });
  it('formats end of year correctly', () => { expect(formatDateLocal(new Date(2026, 11, 31))).toBe('2026-12-31'); });
});

// ── getAppointmentStatus ──

describe('getAppointmentStatus', () => {
  const base: Appointment = { id: 'a2', studentIds: ['s1'], date: '2026-03-16', time: '10:00', duration: 60, status: 'attended' };

  it('returns ok for a single appointment', () => { expect(getAppointmentStatus(base, [base])).toBe('ok'); });
  it('returns ok when gap is enough', () => {
    const earlier: Appointment = { ...base, id: 'a1', time: '08:00', duration: 60 };
    const later: Appointment = { ...base, id: 'a2', time: '09:10' };
    expect(getAppointmentStatus(later, [earlier, later])).toBe('ok');
  });
  it('returns tight when gap is 5 minutes', () => {
    const earlier: Appointment = { ...base, id: 'a1', time: '08:00', duration: 60 };
    const later: Appointment = { ...base, id: 'a2', time: '09:05' };
    expect(getAppointmentStatus(later, [earlier, later])).toBe('tight');
  });
  it('returns conflict when overlapping', () => {
    const earlier: Appointment = { ...base, id: 'a1', time: '08:00', duration: 90 };
    const later: Appointment = { ...base, id: 'a2', time: '09:00' };
    expect(getAppointmentStatus(later, [earlier, later])).toBe('conflict');
  });
  it('ignores canceled appointments', () => {
    const canceled: Appointment = { ...base, id: 'a1', time: '08:00', duration: 60, status: 'canceled_paid' };
    const later: Appointment = { ...base, id: 'a2', time: '08:30' };
    expect(getAppointmentStatus(later, [canceled, later])).toBe('ok');
  });
  it('returns ok for appointments without time', () => {
    const noTime: Appointment = { ...base, time: undefined };
    expect(getAppointmentStatus(noTime, [noTime])).toBe('ok');
  });
});

// ── autoPlanStudents ──

describe('autoPlanStudents', () => {
  it('generates appointments from preferred schedule', () => {
    const students = [{ id: 's1', familyId: 'f1', firstName: 'Max', defaultDuration: 60, rhythm: 'weekly' as const, preferredSchedule: [{ dayOfWeek: 1, time: '14:00', rhythm: 'weekly' as const }] }];
    const result = autoPlanStudents(students, [], new Date(2026, 0, 5), 2);
    expect(result.length).toBe(2);
  });
  it('skips biweekly on odd weeks', () => {
    const students = [{ id: 's1', familyId: 'f1', firstName: 'Max', defaultDuration: 60, rhythm: 'biweekly' as const, preferredSchedule: [{ dayOfWeek: 1, time: '14:00', rhythm: 'biweekly' as const }] }];
    const result = autoPlanStudents(students, [], new Date(2026, 0, 5), 4);
    expect(result.length).toBe(2);
  });
  it('returns empty for no students', () => { expect(autoPlanStudents([], [], new Date(), 4)).toEqual([]); });
});

// ── timeToMinutes / minutesToTime ──

describe('timeToMinutes', () => {
  it('converts 00:00 to 0', () => { expect(timeToMinutes('00:00')).toBe(0); });
  it('converts 08:00 to 480', () => { expect(timeToMinutes('08:00')).toBe(480); });
  it('converts 14:30 to 870', () => { expect(timeToMinutes('14:30')).toBe(870); });
});

describe('minutesToTime', () => {
  it('converts 0 to 00:00', () => { expect(minutesToTime(0)).toBe('00:00'); });
  it('converts 480 to 08:00', () => { expect(minutesToTime(480)).toBe('08:00'); });
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
  it('defaults weekdayBreakStart to 12:10', () => { expect(getDefaultScheduleSettings().weekdayBreakStart).toBe('12:10'); });
  it('defaults weekdayBreakEnd to 13:00', () => { expect(getDefaultScheduleSettings().weekdayBreakEnd).toBe('13:00'); });
  it('defaults weekendBreakStart to empty', () => { expect(getDefaultScheduleSettings().weekendBreakStart).toBe(''); });
  it('defaults weekendBreakEnd to empty', () => { expect(getDefaultScheduleSettings().weekendBreakEnd).toBe(''); });
  it('defaults slotDuration to 90', () => { expect(getDefaultScheduleSettings().slotDuration).toBe(90); });
  it('defaults breakMinutes to 10', () => { expect(getDefaultScheduleSettings().breakMinutes).toBe(10); });
});

// ── getBreakBlocks ──

describe('getBreakBlocks', () => {
  const weekdaySettings = getDefaultScheduleSettings();

  it('returns break block for a weekday', () => {
    const blocks = getBreakBlocks('2026-04-20', weekdaySettings);
    expect(blocks.length).toBe(1);
    expect(blocks[0]).toMatchObject({ startTime: '12:10', endTime: '13:00', duration: 50, label: 'Mittagspause' });
  });
  it('returns empty for weekend with no break', () => {
    expect(getBreakBlocks('2026-04-25', weekdaySettings)).toEqual([]);
  });
  it('returns break for weekend when configured', () => {
    const s = { ...weekdaySettings, weekendBreakStart: '11:30', weekendBreakEnd: '12:00' };
    expect(getBreakBlocks('2026-04-25', s).length).toBe(1);
  });
  it('returns empty when break start is empty', () => {
    expect(getBreakBlocks('2026-04-20', { ...weekdaySettings, weekdayBreakStart: '' })).toEqual([]);
  });
  it('returns empty when break end is empty', () => {
    expect(getBreakBlocks('2026-04-20', { ...weekdaySettings, weekdayBreakEnd: '' })).toEqual([]);
  });
  it('returns empty when break end <= break start', () => {
    expect(getBreakBlocks('2026-04-20', { ...weekdaySettings, weekdayBreakStart: '13:00', weekdayBreakEnd: '12:10' })).toEqual([]);
  });
});

// ── generateTimeSlots ──
// Note: No break between consecutive placeholder slots

describe('generateTimeSlots', () => {
  it('fills window with 90-min slots (no break between placeholders)', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '20:00', 90, 10);
    // 08:00-20:00 = 720 min, 720/90 = 8 slots
    expect(slots.length).toBe(8);
    expect(slots[0]).toMatchObject({ startTime: '08:00', endTime: '09:30', duration: 90 });
    expect(slots[1].startTime).toBe('09:30'); // No 10-min break between placeholders
    expect(slots[7].startTime).toBe('18:30');
  });

  it('leaves gaps around existing appointments (breakMinutes padding)', () => {
    const appointments: Appointment[] = [{
      id: 'a1', studentIds: ['s1'], date: '2026-04-20', time: '10:00', duration: 60, status: 'attended',
    }];
    const slots = generateTimeSlots('2026-04-20', appointments, '08:00', '20:00', 90, 10);
    // Appointment 10:00-11:00, padded to 09:50-11:10
    const beforeSlot = slots.find(s => s.endTime <= '09:50');
    const afterSlot = slots.find(s => s.startTime >= '11:10');
    expect(beforeSlot).toBeDefined();
    expect(afterSlot).toBeDefined();
  });

  it('consecutive placeholders have no break between them', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 60, 10);
    // 08:00-12:00 = 240 min, 240/60 = 4 slots, no breaks between
    expect(slots.length).toBe(4);
    expect(slots[0]).toMatchObject({ startTime: '08:00', endTime: '09:00' });
    expect(slots[1]).toMatchObject({ startTime: '09:00', endTime: '10:00' }); // No 10-min gap
    expect(slots[2]).toMatchObject({ startTime: '10:00', endTime: '11:00' });
    expect(slots[3]).toMatchObject({ startTime: '11:00', endTime: '12:00' });
  });

  it('ignores appointments on different days', () => {
    const appointments: Appointment[] = [
      { id: 'a1', studentIds: ['s1'], date: '2026-04-21', time: '10:00', duration: 60, status: 'attended' },
    ];
    const slots = generateTimeSlots('2026-04-20', appointments, '08:00', '20:00', 90, 10);
    expect(slots.length).toBe(8);
  });

  it('returns empty array for very short window', () => {
    expect(generateTimeSlots('2026-04-20', [], '08:00', '08:20', 90, 10)).toEqual([]);
  });

  it('marks all slots as isPlaceholder: true', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 90, 10);
    slots.forEach(s => expect(s.isPlaceholder).toBe(true));
  });

  // ── Break block integration ──

  it('excludes lunch break area from slots', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '20:00', 90, 10, '12:10', '13:00');
    const overlapping = slots.find(s => s.startTime < '13:00' && s.endTime > '12:10');
    expect(overlapping).toBeUndefined();
  });

  it('fills morning with 90-min slots before lunch (no break between placeholders)', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '17:00', 90, 10, '12:10', '13:00');
    // Morning: 08:00-12:10 = 250 min
    // 08:00-09:30 (90), 09:30-11:00 (90), 11:00-12:10 (70) → 3 slots
    const morningSlots = slots.filter(s => s.endTime <= '12:10');
    expect(morningSlots.length).toBe(3);
    expect(morningSlots[0]).toMatchObject({ startTime: '08:00', endTime: '09:30', duration: 90 });
    expect(morningSlots[1]).toMatchObject({ startTime: '09:30', endTime: '11:00', duration: 90 });
    expect(morningSlots[2]).toMatchObject({ startTime: '11:00', endTime: '12:10', duration: 70 });

    // Afternoon: 13:00-17:00 = 240 min → 2x 90 + 1x 60
    const afternoonSlots = slots.filter(s => s.startTime >= '13:00');
    expect(afternoonSlots.length).toBe(3);
    expect(afternoonSlots[0]).toMatchObject({ startTime: '13:00', endTime: '14:30', duration: 90 });
  });

  it('slot can touch break block directly (no extra padding around lunch)', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '17:00', 90, 10, '12:10', '13:00');
    // Last morning slot ends at 12:10 = break start
    const lastMorning = slots.filter(s => s.endTime <= '12:10').pop();
    expect(lastMorning?.endTime).toBe('12:10');
    // First afternoon slot starts at 13:00 = break end
    const firstAfternoon = slots.find(s => s.startTime >= '13:00');
    expect(firstAfternoon?.startTime).toBe('13:00');
  });

  it('handles lunch break overlapping with appointment', () => {
    const appointments: Appointment[] = [{
      id: 'a1', studentIds: ['s1'], date: '2026-04-20', time: '11:30', duration: 120, status: 'attended',
    }];
    // Appointment 11:30-13:30, padded 11:20-13:40
    // Lunch 12:10-13:00 merged in → occupied 11:20-13:40
    const slots = generateTimeSlots('2026-04-20', appointments, '08:00', '17:00', 90, 10, '12:10', '13:00');
    const overlapping = slots.find(s => s.startTime < '13:40' && s.endTime > '11:20');
    expect(overlapping).toBeUndefined();
  });

  it('works without break parameters (no lunch)', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 90, 10);
    expect(slots.length).toBeGreaterThanOrEqual(1);
  });

  it('ignores break if breakStart is undefined', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 90, 10, undefined, '13:00');
    expect(slots.length).toBeGreaterThanOrEqual(1);
  });

  it('ignores break if breakEnd is undefined', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 90, 10, '12:10', undefined);
    expect(slots.length).toBeGreaterThanOrEqual(1);
  });

  it('uses remaining gap when between 30 and 89 min (no 60-min fallback)', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '09:45', 90, 10);
    // 08:00-09:45 = 105 min → one 90-min slot (08:00-09:30), remaining 15 min (too short)
    expect(slots.length).toBe(1);
    expect(slots[0].duration).toBe(90);
  });

  it('uses full remaining gap when less than 90 min', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '09:10', 90, 10);
    // 08:00-09:10 = 70 min → one 70-min slot
    expect(slots.length).toBe(1);
    expect(slots[0].duration).toBe(70);
    expect(slots[0].endTime).toBe('09:10');
  });
});
