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

describe('addMinutes', () => {
  it('adds within hour', () => { expect(addMinutes('10:00', 30)).toBe('10:30'); });
  it('crosses hour', () => { expect(addMinutes('10:45', 30)).toBe('11:15'); });
  it('zero', () => { expect(addMinutes('09:00', 0)).toBe('09:00'); });
  it('60 min', () => { expect(addMinutes('10:00', 60)).toBe('11:00'); });
  it('90 min', () => { expect(addMinutes('10:00', 90)).toBe('11:30'); });
  it('day overflow', () => { expect(addMinutes('23:30', 60)).toBe('00:30'); });
});

describe('getWeekNumber', () => {
  it('Jan 1 2026', () => { expect(getWeekNumber(new Date(2026, 0, 1))).toBe(1); });
  it('Jan 5 2026', () => { expect(getWeekNumber(new Date(2026, 0, 5))).toBe(2); });
  it('mid-year', () => { expect(getWeekNumber(new Date(2026, 5, 15))).toBe(25); });
});

describe('formatDateLocal', () => {
  it('formats correctly', () => { expect(formatDateLocal(new Date(2026, 2, 16))).toBe('2026-03-16'); });
  it('pads', () => { expect(formatDateLocal(new Date(2026, 0, 5))).toBe('2026-01-05'); });
});

describe('getAppointmentStatus', () => {
  const base: Appointment = { id: 'a2', studentIds: ['s1'], date: '2026-03-16', time: '10:00', duration: 60, status: 'attended' };
  it('ok for single', () => { expect(getAppointmentStatus(base, [base])).toBe('ok'); });
  it('ok with gap', () => {
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
});

describe('autoPlanStudents', () => {
  it('generates from preferred schedule', () => {
    const s = [{ id: 's1', familyId: 'f1', firstName: 'Max', defaultDuration: 60, rhythm: 'weekly' as const, preferredSchedule: [{ dayOfWeek: 1, time: '14:00', rhythm: 'weekly' as const }] }];
    expect(autoPlanStudents(s, [], new Date(2026, 0, 5), 2).length).toBe(2);
  });
  it('empty for no students', () => { expect(autoPlanStudents([], [], new Date(), 4)).toEqual([]); });
});

describe('timeToMinutes', () => {
  it('00:00', () => { expect(timeToMinutes('00:00')).toBe(0); });
  it('08:00', () => { expect(timeToMinutes('08:00')).toBe(480); });
  it('14:30', () => { expect(timeToMinutes('14:30')).toBe(870); });
});

describe('minutesToTime', () => {
  it('0', () => { expect(minutesToTime(0)).toBe('00:00'); });
  it('480', () => { expect(minutesToTime(480)).toBe('08:00'); });
  it('870', () => { expect(minutesToTime(870)).toBe('14:30'); });
});

describe('isWeekend', () => {
  it('Saturday', () => { expect(isWeekend('2026-04-25')).toBe(true); });
  it('Sunday', () => { expect(isWeekend('2026-04-26')).toBe(true); });
  it('Monday', () => { expect(isWeekend('2026-04-20')).toBe(false); });
});

describe('getDefaultScheduleSettings', () => {
  it('weekdayBreakStart', () => { expect(getDefaultScheduleSettings().weekdayBreakStart).toBe('12:10'); });
  it('weekdayBreakEnd', () => { expect(getDefaultScheduleSettings().weekdayBreakEnd).toBe('13:00'); });
  it('weekendBreakStart empty', () => { expect(getDefaultScheduleSettings().weekendBreakStart).toBe(''); });
  it('slotDuration', () => { expect(getDefaultScheduleSettings().slotDuration).toBe(90); });
  it('breakMinutes', () => { expect(getDefaultScheduleSettings().breakMinutes).toBe(10); });
});

describe('getBreakBlocks', () => {
  const s = getDefaultScheduleSettings();
  it('weekday with break', () => { expect(getBreakBlocks('2026-04-20', s).length).toBe(1); });
  it('weekend no break', () => { expect(getBreakBlocks('2026-04-25', s)).toEqual([]); });
  it('empty start', () => { expect(getBreakBlocks('2026-04-20', { ...s, weekdayBreakStart: '' })).toEqual([]); });
  it('end before start', () => { expect(getBreakBlocks('2026-04-20', { ...s, weekdayBreakStart: '13:00', weekdayBreakEnd: '12:10' })).toEqual([]); });
});

// ── generateTimeSlots ──
// Key rules:
// - breakMinutes between consecutive placeholder slots
// - NO break after the last slot in a gap (blocker provides separation)
// - breakMinutes padding around real appointments only
// - No padding around break blocks

describe('generateTimeSlots', () => {

  it('fills window with 90-min slots and 10-min breaks between', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '20:00', 90, 10);
    // 08:00-20:00 = 720 min
    // Slot 1: 08:00-09:30 (90), break 10, pos=580→09:40
    // Slot 2: 09:40-11:10 (90), break 10, pos=700→11:20
    // Slot 3: 11:20-12:50 (90), break 10, pos=830→13:00
    // Slot 4: 13:00-14:30 (90), break 10, pos=950→14:40
    // Slot 5: 14:40-16:10 (90), break 10, pos=1070→16:20
    // Slot 6: 16:20-17:50 (90), break 10, pos=1190→18:00
    // Slot 7: 18:00-19:30 (90), remaining=120-90=30 → last slot? No, 30 is exactly the min
    // wouldBeLast: 30 < 90+10+30=130 → yes → last slot, dur=90
    // pos += 90 → 19:30, remaining=30 → wouldBeLast, dur=30
    // Slot 8: 19:30-20:00 (30)
    expect(slots.length).toBe(8);
    expect(slots[0]).toMatchObject({ startTime: '08:00', endTime: '09:30', duration: 90 });
    expect(slots[1].startTime).toBe('09:40'); // 10-min break after slot 1
    expect(slots[2].startTime).toBe('11:20'); // 10-min break after slot 2
  });

  it('places 10-min break between consecutive placeholders', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 60, 10);
    // 08:00-12:00 = 240 min
    // Slot 1: 08:00-09:00 (60), break → pos=550→09:10
    // Slot 2: 09:10-10:10 (60), break → pos=670→10:20
    // Slot 3: 10:20-11:20 (60), break → pos=790→11:30
    // Slot 4: 11:30-12:00 (30), last slot (remaining=30 < 60+10+30=100)
    expect(slots.length).toBe(4);
    expect(slots[0]).toMatchObject({ startTime: '08:00', endTime: '09:00' });
    expect(slots[1]).toMatchObject({ startTime: '09:10', endTime: '10:10' }); // 10-min break
    expect(slots[2]).toMatchObject({ startTime: '10:20', endTime: '11:20' }); // 10-min break
    expect(slots[3]).toMatchObject({ startTime: '11:30', endTime: '12:00', duration: 30 }); // last, no break after
  });

  it('last slot before break blocker fills full gap (no extra break)', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '17:00', 90, 10, '12:10', '13:00');
    // Morning gap: 08:00-12:10 = 250 min
    // Slot 1: 08:00-09:30 (90), break → pos=580→09:40
    // Slot 2: 09:40-11:10 (90), break → pos=700→11:20
    // Slot 3: 11:20 → remaining = 730-680 = 50 min
    //   wouldBeLast: 50 < 90+10+30=130 → yes → last slot, dur=50
    //   NO break after (blocker at 12:10 provides separation)
    const morningSlots = slots.filter(s => s.endTime <= '12:10');
    expect(morningSlots.length).toBe(3);
    expect(morningSlots[0]).toMatchObject({ startTime: '08:00', endTime: '09:30', duration: 90 });
    expect(morningSlots[1]).toMatchObject({ startTime: '09:40', endTime: '11:10', duration: 90 });
    expect(morningSlots[2]).toMatchObject({ startTime: '11:20', endTime: '12:10', duration: 50 });
  });

  it('first slot after break blocker starts at break end', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '17:00', 90, 10, '12:10', '13:00');
    const afternoonSlots = slots.filter(s => s.startTime >= '13:00');
    expect(afternoonSlots.length).toBeGreaterThanOrEqual(1);
    expect(afternoonSlots[0].startTime).toBe('13:00');
  });

  it('excludes lunch break area from slots', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '20:00', 90, 10, '12:10', '13:00');
    const overlapping = slots.find(s => s.startTime < '13:00' && s.endTime > '12:10');
    expect(overlapping).toBeUndefined();
  });

  it('leaves gaps around real appointments (breakMinutes padding)', () => {
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

  it('ignores appointments on different days', () => {
    const appointments: Appointment[] = [
      { id: 'a1', studentIds: ['s1'], date: '2026-04-21', time: '10:00', duration: 60, status: 'attended' },
    ];
    const slots = generateTimeSlots('2026-04-20', appointments, '08:00', '20:00', 90, 10);
    expect(slots.length).toBe(8); // Same as no appointments
  });

  it('returns empty for very short window', () => {
    expect(generateTimeSlots('2026-04-20', [], '08:00', '08:20', 90, 10)).toEqual([]);
  });

  it('marks all slots as isPlaceholder: true', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 90, 10);
    slots.forEach(s => expect(s.isPlaceholder).toBe(true));
  });

  it('handles lunch overlapping with appointment', () => {
    const appointments: Appointment[] = [{
      id: 'a1', studentIds: ['s1'], date: '2026-04-20', time: '11:30', duration: 120, status: 'attended',
    }];
    const slots = generateTimeSlots('2026-04-20', appointments, '08:00', '17:00', 90, 10, '12:10', '13:00');
    const overlapping = slots.find(s => s.startTime < '13:40' && s.endTime > '11:20');
    expect(overlapping).toBeUndefined();
  });

  it('works without break parameters', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '12:00', 90, 10);
    expect(slots.length).toBeGreaterThanOrEqual(1);
  });

  it('slot can touch break block directly', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '17:00', 90, 10, '12:10', '13:00');
    // Last morning slot should end at 12:10 (= break start)
    const lastMorning = slots.filter(s => s.endTime <= '12:10').pop();
    expect(lastMorning?.endTime).toBe('12:10');
    // First afternoon slot should start at 13:00 (= break end)
    const firstAfternoon = slots.find(s => s.startTime >= '13:00');
    expect(firstAfternoon?.startTime).toBe('13:00');
  });

  it('uses full remaining gap for last slot in gap', () => {
    const slots = generateTimeSlots('2026-04-20', [], '08:00', '09:40', 90, 10);
    // 08:00-09:40 = 100 min
    // Slot 1: wouldBeLast? 100 < 90+10+30=130 → yes → dur=90? No, remaining=100 >= 90 → dur=90
    // But wouldBeLast=true → pos += 90 → 09:30, remaining=10 → too short
    // So only one 90-min slot
    expect(slots.length).toBe(1);
    expect(slots[0].duration).toBe(90);
  });
});
