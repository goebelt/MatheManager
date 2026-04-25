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
} from '../scheduling';
import type { Appointment } from '@/types';

// ── addMinutes ──

describe('addMinutes', () => {
  it('adds within hour', () => { expect(addMinutes('10:00', 30)).toBe('10:30'); });
  it('crosses hour', () => { expect(addMinutes('10:45', 30)).toBe('11:15'); });
  it('zero', () => { expect(addMinutes('09:00', 0)).toBe('09:00'); });
  it('60 min', () => { expect(addMinutes('10:00', 60)).toBe('11:00'); });
  it('90 min', () => { expect(addMinutes('10:00', 90)).toBe('11:30'); });
  it('day overflow', () => { expect(addMinutes('23:30', 60)).toBe('00:30'); });
  it('midnight boundary', () => { expect(addMinutes('23:59', 1)).toBe('00:00'); });
  it('large addition', () => { expect(addMinutes('08:00', 1000)).toBe('00:40'); });
});

// ── getWeekNumber ──

describe('getWeekNumber', () => {
  it('Jan 1 2026', () => { expect(getWeekNumber(new Date(2026, 0, 1))).toBe(1); });
  it('Jan 5 2026', () => { expect(getWeekNumber(new Date(2026, 0, 5))).toBe(2); });
  it('mid-year', () => { expect(getWeekNumber(new Date(2026, 5, 15))).toBe(25); });
  it('Dec 28', () => { expect(getWeekNumber(new Date(2026, 11, 28))).toBe(53); });
});

// ── formatDateLocal ──

describe('formatDateLocal', () => {
  it('formats correctly', () => { expect(formatDateLocal(new Date(2026, 2, 16))).toBe('2026-03-16'); });
  it('pads month and day', () => { expect(formatDateLocal(new Date(2026, 0, 5))).toBe('2026-01-05'); });
  it('end of year', () => { expect(formatDateLocal(new Date(2026, 11, 31))).toBe('2026-12-31'); });
});

// ── getAppointmentStatus ──

describe('getAppointmentStatus', () => {
  const base: Appointment = { id: 'a2', studentIds: ['s1'], date: '2026-03-16', time: '10:00', duration: 60, status: 'attended' };
  it('ok for single', () => { expect(getAppointmentStatus(base, [base])).toBe('ok'); });
  it('ok with sufficient gap', () => {
    const earlier: Appointment = { ...base, id: 'a1', time: '08:00', duration: 60 };
    expect(getAppointmentStatus({ ...base, id: 'a2', time: '09:10' }, [earlier, { ...base, id: 'a2', time: '09:10' }])).toBe('ok');
  });
  it('tight with 5 min gap', () => {
    const earlier: Appointment = { ...base, id: 'a1', time: '08:00', duration: 60 };
    expect(getAppointmentStatus({ ...base, id: 'a2', time: '09:05' }, [earlier, { ...base, id: 'a2', time: '09:05' }])).toBe('tight');
  });
  it('conflict when overlapping', () => {
    const earlier: Appointment = { ...base, id: 'a1', time: '08:00', duration: 90 };
    expect(getAppointmentStatus({ ...base, id: 'a2', time: '09:00' }, [earlier, { ...base, id: 'a2', time: '09:00' }])).toBe('conflict');
  });
  it('ignores canceled', () => {
    const canceled: Appointment = { ...base, id: 'a1', time: '08:00', duration: 60, status: 'canceled_paid' };
    expect(getAppointmentStatus({ ...base, id: 'a2', time: '08:30' }, [canceled, { ...base, id: 'a2', time: '08:30' }])).toBe('ok');
  });
  it('ok without time', () => {
    const noTime: Appointment = { ...base, time: undefined };
    expect(getAppointmentStatus(noTime, [noTime])).toBe('ok');
  });
  it('ok as first appointment of day', () => {
    const later: Appointment = { ...base, id: 'a1', time: '14:00' };
    expect(getAppointmentStatus(later, [later])).toBe('ok');
  });
});

// ── autoPlanStudents ──

describe('autoPlanStudents', () => {
  it('generates from preferred schedule', () => {
    const s = [{ id: 's1', familyId: 'f1', firstName: 'Max', defaultDuration: 60, rhythm: 'weekly' as const, preferredSchedule: [{ dayOfWeek: 1, time: '14:00', rhythm: 'weekly' as const }] }];
    expect(autoPlanStudents(s, [], new Date(2026, 0, 5), 2).length).toBe(2);
  });
  it('skips biweekly on odd weeks', () => {
    const s = [{ id: 's1', familyId: 'f1', firstName: 'Max', defaultDuration: 60, rhythm: 'biweekly' as const, preferredSchedule: [{ dayOfWeek: 1, time: '14:00', rhythm: 'biweekly' as const }] }];
    const result = autoPlanStudents(s, [], new Date(2026, 0, 5), 4);
    expect(result.length).toBe(2);
  });
  it('empty for no students', () => { expect(autoPlanStudents([], [], new Date(), 4)).toEqual([]); });
  it('skips when appointment already exists', () => {
    const s = [{ id: 's1', familyId: 'f1', firstName: 'Max', defaultDuration: 60, rhythm: 'weekly' as const, preferredSchedule: [{ dayOfWeek: 1, time: '14:00', rhythm: 'weekly' as const }] }];
    const existing: Appointment[] = [{ id: 'a1', studentIds: ['s1'], date: '2026-01-05', time: '14:00', duration: 60, status: 'attended' }];
    const result = autoPlanStudents(s, existing, new Date(2026, 0, 5), 1);
    expect(result.length).toBe(0);
  });
  it('uses default 09:00 when no preferred schedule', () => {
    const s = [{ id: 's1', familyId: 'f1', firstName: 'Max', defaultDuration: 60, rhythm: 'weekly' as const }];
    const result = autoPlanStudents(s, [], new Date(2026, 0, 5), 1);
    expect(result[0]?.time).toBe('09:00');
  });
});

// ── timeToMinutes / minutesToTime ──

describe('timeToMinutes', () => {
  it('00:00 → 0', () => { expect(timeToMinutes('00:00')).toBe(0); });
  it('08:00 → 480', () => { expect(timeToMinutes('08:00')).toBe(480); });
  it('14:30 → 870', () => { expect(timeToMinutes('14:30')).toBe(870); });
  it('23:59 → 1439', () => { expect(timeToMinutes('23:59')).toBe(1439); });
});

describe('minutesToTime', () => {
  it('0 → 00:00', () => { expect(minutesToTime(0)).toBe('00:00'); });
  it('480 → 08:00', () => { expect(minutesToTime(480)).toBe('08:00'); });
  it('870 → 14:30', () => { expect(minutesToTime(870)).toBe('14:30'); });
  it('1439 → 23:59', () => { expect(minutesToTime(1439)).toBe('23:59'); });
});

// ── isWeekend ──

describe('isWeekend', () => {
  it('Saturday', () => { expect(isWeekend('2026-04-25')).toBe(true); });
  it('Sunday', () => { expect(isWeekend('2026-04-26')).toBe(true); });
  it('Monday', () => { expect(isWeekend('2026-04-20')).toBe(false); });
  it('Friday', () => { expect(isWeekend('2026-04-24')).toBe(false); });
});

// ── getDefaultScheduleSettings ──

describe('getDefaultScheduleSettings', () => {
  const defaults = getDefaultScheduleSettings();
  it('weekdayStart', () => { expect(defaults.weekdayStart).toBe('08:00'); });
  it('weekdayEnd', () => { expect(defaults.weekdayEnd).toBe('20:00'); });
  it('weekendStart', () => { expect(defaults.weekendStart).toBe('09:00'); });
  it('weekendEnd', () => { expect(defaults.weekendEnd).toBe('14:00'); });
  it('slotDuration', () => { expect(defaults.slotDuration).toBe(90); });
  it('breakMinutes', () => { expect(defaults.breakMinutes).toBe(10); });
  it('weekdayBreakStart', () => { expect(defaults.weekdayBreakStart).toBe('12:10'); });
  it('weekdayBreakEnd', () => { expect(defaults.weekdayBreakEnd).toBe('13:00'); });
  it('weekendBreakStart empty', () => { expect(defaults.weekendBreakStart).toBe(''); });
  it('weekendBreakEnd empty', () => { expect(defaults.weekendBreakEnd).toBe(''); });
});

// ── getBreakBlocks ──

describe('getBreakBlocks', () => {
  const s = getDefaultScheduleSettings();
  it('weekday with break', () => {
    const blocks = getBreakBlocks('2026-04-20', s);
    expect(blocks.length).toBe(1);
    expect(blocks[0]).toMatchObject({ startTime: '12:10', endTime: '13:00', duration: 50, label: 'Mittagspause' });
  });
  it('weekend no break', () => { expect(getBreakBlocks('2026-04-25', s)).toEqual([]); });
  it('weekend with configured break', () => {
    const ws = { ...s, weekendBreakStart: '11:30', weekendBreakEnd: '12:00' };
    expect(getBreakBlocks('2026-04-25', ws).length).toBe(1);
  });
  it('empty start', () => { expect(getBreakBlocks('2026-04-20', { ...s, weekdayBreakStart: '' })).toEqual([]); });
  it('empty end', () => { expect(getBreakBlocks('2026-04-20', { ...s, weekdayBreakEnd: '' })).toEqual([]); });
  it('end before start', () => { expect(getBreakBlocks('2026-04-20', { ...s, weekdayBreakStart: '13:00', weekdayBreakEnd: '12:10' })).toEqual([]); });
  it('end equals start', () => { expect(getBreakBlocks('2026-04-20', { ...s, weekdayBreakStart: '12:00', weekdayBreakEnd: '12:00' })).toEqual([]); });
});

// ── generateTimeSlots ──
// Key rules:
// - breakMinutes pause between consecutive placeholder slots
// - NO break after the last slot in a gap (blocker/appointment provides separation)
// - breakMinutes padding around real appointments only
// - No padding around break blocks

describe('generateTimeSlots', () => {

  it('fills window with 90-min slots and 10-min breaks between', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '20:00', 90, 10);
    // 720 min window
    expect(slots.length).toBe(8);
    expect(slots[0]).toMatchObject({ startTime: '08:00', endTime: '09:30', duration: 90 });
    expect(slots[1].startTime).toBe('09:40'); // 10-min break
    expect(slots[2].startTime).toBe('11:20'); // 10-min break
  });

  it('places 10-min break between consecutive placeholders (60-min slots)', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 60, 10);
    // 240 min → 3×60+breaks + last shorter slot
    expect(slots[0]).toMatchObject({ startTime: '08:00', endTime: '09:00' });
    expect(slots[1]).toMatchObject({ startTime: '09:10', endTime: '10:10' }); // 10-min break
    expect(slots[2]).toMatchObject({ startTime: '10:20', endTime: '11:20' }); // 10-min break
    expect(slots[3]).toMatchObject({ startTime: '11:30', endTime: '12:00', duration: 30 }); // last
  });

  it('last slot before break blocker fills full gap without extra break', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '17:00', 90, 10, '12:10', '13:00');
    // Morning gap: 08:00-12:10 = 250 min
    // Slot 1: 08:00-09:30 (90), break → 09:40
    // Slot 2: 09:40-11:10 (90), break → 11:20
    // Slot 3: 11:20-12:10 (50) → last slot, no break
    const morning = slots.filter(s => s.endTime <= '12:10');
    expect(morning.length).toBe(3);
    expect(morning[2]).toMatchObject({ startTime: '11:20', endTime: '12:10', duration: 50 });
  });

  it('first slot after break blocker starts at break end', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '17:00', 90, 10, '12:10', '13:00');
    const afternoon = slots.filter(s => s.startTime >= '13:00');
    expect(afternoon[0].startTime).toBe('13:00');
  });

  it('slot can touch break block directly (no extra padding)', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '17:00', 90, 10, '12:10', '13:00');
    const lastMorning = slots.filter(s => s.endTime <= '12:10').pop();
    expect(lastMorning?.endTime).toBe('12:10');
    const firstAfternoon = slots.find(s => s.startTime >= '13:00');
    expect(firstAfternoon?.startTime).toBe('13:00');
  });

  it('excludes lunch break area from slots', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '20:00', 90, 10, '12:10', '13:00');
    const overlapping = slots.find(s => s.startTime < '13:00' && s.endTime > '12:10');
    expect(overlapping).toBeUndefined();
  });

  it('leaves breakMinutes padding around real appointments', () => {
    const appts: Appointment[] = [{
      id: 'a1', studentIds: ['s1'], date: '2026-04-20', time: '10:00', duration: 60, status: 'attended',
    }];
    const slots = generateTimeSlots('2026-04-20', appts, '08:00', '20:00', 90, 10);
    // Appointment 10:00-11:00, padded 09:50-11:10
    const before = slots.find(s => s.endTime <= '09:50');
    const after = slots.find(s => s.startTime >= '11:10');
    expect(before).toBeDefined();
    expect(after).toBeDefined();
  });

  it('ignores appointments on different days', () => {
    const appts: Appointment[] = [
      { id: 'a1', studentIds: ['s1'], date: '2026-04-21', time: '10:00', duration: 60, status: 'attended' },
    ];
    const slots = generateTimeSlots('2026-04-20', appts, '08:00', '20:00', 90, 10);
    expect(slots.length).toBe(8);
  });

  it('returns empty for very short window', () => {
    expect(generateTimeSlots('2026-04-20', [], '08:00', '08:20', 90, 10)).toEqual([]);
  });

  it('marks all slots as isPlaceholder: true', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 90, 10);
    slots.forEach(s => expect(s.isPlaceholder).toBe(true));
  });

  it('handles lunch overlapping with appointment', () => {
    const appts: Appointment[] = [{
      id: 'a1', studentIds: ['s1'], date: '2026-04-20', time: '11:30', duration: 120, status: 'attended',
    }];
    // Appointment 11:30-13:30, padded 11:20-13:40
    // Lunch 12:10-13:00 merged → occupied 11:20-13:40
    const slots = generateTimeSlots('2026-04-20', appts, '08:00', '17:00', 90, 10, '12:10', '13:00');
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

  // ── Edge cases ──

  it('uses full remaining gap for last slot in gap', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '09:40', 90, 10);
    // 100 min → one 90-min slot (remaining 10 too short)
    expect(slots.length).toBe(1);
    expect(slots[0].duration).toBe(90);
  });

  it('fills exact 90-min window as single slot', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '09:30', 90, 10);
    expect(slots.length).toBe(1);
    expect(slots[0]).toMatchObject({ startTime: '08:00', endTime: '09:30', duration: 90 });
  });

  it('handles 30-min slot duration', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '10:00', 30, 5);
    // 120 min → 30+5=35 per cycle → 3×35=105, remaining 15 < 30+5+30=65 → last
    // Slot 1: 08:00-08:30, Slot 2: 08:35-09:05, Slot 3: 09:10-09:40, Slot 4: 09:45-10:00 (15 min, ≥30? No)
    // Actually: 15 < 30 → break. Let's compute:
    // pos=480, remaining=120, wouldBeLast? 120 < 30+5+30=65? No → dur=30, pos=480+30+5=515
    // pos=515, remaining=85, wouldBeLast? 85 < 65? No → dur=30, pos=515+30+5=550
    // pos=550, remaining=50, wouldBeLast? 50 < 65? Yes → dur=30? remaining=50≥30 → dur=30, pos=580
    // pos=580, remaining=20 → 20 < 30? Yes but wouldBeLast, dur=20? 20 < 30? No → break
    // Hmm, remaining=20 < 30 → break out of while loop (pos+30 > gap.end)
    expect(slots.length).toBeGreaterThanOrEqual(3);
  });

  it('handles breakMinutes=0 (no breaks between slots)', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 60, 0);
    // No breaks → 240/60 = 4 slots, all consecutive
    expect(slots.length).toBe(4);
    expect(slots[0].startTime).toBe('08:00');
    expect(slots[1].startTime).toBe('09:00');
    expect(slots[2].startTime).toBe('10:00');
    expect(slots[3].startTime).toBe('11:00');
  });

  it('handles appointment at day start', () => {
    const appts: Appointment[] = [{
      id: 'a1', studentIds: ['s1'], date: '2026-04-20', time: '08:00', duration: 60, status: 'attended',
    }];
    const slots = generateTimeSlots('2026-04-20', appts, '08:00', '20:00', 90, 10);
    // Padded: 07:50-09:10 → first slot starts at 09:10
    expect(slots[0].startTime).toBe('09:10');
  });

  it('handles appointment at day end', () => {
    const appts: Appointment[] = [{
      id: 'a1', studentIds: ['s1'], date: '2026-04-20', time: '19:00', duration: 60, status: 'attended',
    }];
    const slots = generateTimeSlots('2026-04-20', appts, '08:00', '20:00', 90, 10);
    // Padded: 18:50-20:10 (capped to window) → all slots before 18:50
    const lastSlot = slots[slots.length - 1];
    expect(lastSlot.endTime).toBe('18:50');
  });

  it('handles multiple appointments creating merged occupied block', () => {
    const appts: Appointment[] = [
      { id: 'a1', studentIds: ['s1'], date: '2026-04-20', time: '10:00', duration: 60, status: 'attended' },
      { id: 'a2', studentIds: ['s2'], date: '2026-04-20', time: '11:00', duration: 60, status: 'attended' },
    ];
    // a1: 10:00-11:00, padded 09:50-11:10
    // a2: 11:00-12:00, padded 10:50-12:10
    // Merged: 09:50-12:10
    const slots = generateTimeSlots('2026-04-20', appts, '08:00', '20:00', 90, 10);
    const overlapping = slots.find(s => s.startTime < '12:10' && s.endTime > '09:50');
    expect(overlapping).toBeUndefined();
  });

  it('generates slots with unique IDs including date', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 90, 10);
    slots.forEach(s => {
      expect(s.id).toContain('2026-04-20');
      expect(s.id).toMatch(/^slot-/);
    });
  });

  it('afternoon slots with lunch break have correct breaks between them', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '17:00', 90, 10, '12:10', '13:00');
    const afternoon = slots.filter(s => s.startTime >= '13:00');
    // Afternoon: 13:00-17:00 = 240 min
    // Slot: 13:00-14:30 (90), break, 14:40-16:10 (90), break?, 16:20-17:00 (40) → last
    expect(afternoon.length).toBe(3);
    expect(afternoon[0]).toMatchObject({ startTime: '13:00', endTime: '14:30', duration: 90 });
    expect(afternoon[1]).toMatchObject({ startTime: '14:40', endTime: '16:10', duration: 90 }); // 10-min break
    expect(afternoon[2]).toMatchObject({ startTime: '16:20', endTime: '17:00', duration: 40 }); // last, no break after
  });
});
