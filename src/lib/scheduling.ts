/**
 * Scheduling utilities – extracted from appointments page for testability
 */
import type { Appointment, Student, DataContainer } from '@/types';

/**
 * Add minutes to a time string (HH:MM format).
 * Handles day overflow (e.g. 23:30 + 60 → 00:30).
 */
export function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

/**
 * Get ISO-8601 calendar week number for a date.
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Calculate conflict status for an appointment.
 * - 'conflict' = start time overlaps with previous appointment's end time
 * - 'tight' = less than 5 minutes gap to previous appointment
 * - 'ok' = enough gap
 *
 * Canceled appointments are ignored for conflict detection and always return 'ok'.
 */
export function getAppointmentStatus(
  appointment: Appointment,
  allAppointments: Appointment[]
): 'ok' | 'conflict' | 'tight' {
  if (appointment.status.startsWith('canceled')) {
    return 'ok';
  }
  if (!appointment.time) return 'ok';

  const sameDayAppointments = allAppointments.filter(
    app => app.date === appointment.date && app.time && !app.status.startsWith('canceled')
  );
  sameDayAppointments.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const currentIndex = sameDayAppointments.findIndex(app => app.id === appointment.id);
  if (currentIndex <= 0) return 'ok';

  const previousAppointment = sameDayAppointments[currentIndex - 1];
  if (!previousAppointment.time) return 'ok';

  const prevEndTime = addMinutes(previousAppointment.time, previousAppointment.duration);

  if (appointment.time < prevEndTime) {
    return 'conflict';
  }
  const prevEndTimePlus5 = addMinutes(prevEndTime, 5);
  if (appointment.time <= prevEndTimePlus5) {
    return 'tight';
  }
  return 'ok';
}

/**
 * Auto-plan: Generate planned appointments for students based on preferred schedules.
 * Returns new appointments (does NOT modify data directly).
 * Lunch breaks are intentionally ignored – auto-plan only avoids existing appointments.
 */
export function autoPlanStudents(
  students: Student[],
  existingAppointments: Appointment[],
  startDate: Date,
  weeks: number
): Appointment[] {
  const newAppointments: Appointment[] = [];

  students.forEach(student => {
    const preferredSchedules = student.preferredSchedule || [];

    if (preferredSchedules.length > 0) {
      preferredSchedules.forEach(schedule => {
        for (let week = 0; week < weeks; week++) {
          const appointmentDate = new Date(startDate);
          appointmentDate.setDate(startDate.getDate() + week * 7);
          const currentDay = appointmentDate.getDay() || 7;
          const dayDiff = schedule.dayOfWeek - currentDay;
          appointmentDate.setDate(appointmentDate.getDate() + dayDiff);

          const rhythm = schedule.rhythm || student.rhythm;
          if (rhythm === 'biweekly') {
            const weekNumber = getWeekNumber(appointmentDate);
            if (weekNumber % 2 !== 0) continue;
          }

          const dateStr = formatDateLocal(appointmentDate);
          const existing = existingAppointments.find(
            a => a.date === dateStr && a.studentIds.includes(student.id)
          );
          if (existing) continue;

          newAppointments.push({
            id: `auto-${Date.now()}-${week}-${student.id}-${schedule.dayOfWeek}`,
            studentIds: [student.id],
            date: dateStr,
            time: schedule.time,
            duration: student.defaultDuration,
            status: 'planned',
          });
        }
      });
    } else {
      let usualWeekday = 1;
      let usualTime = '09:00';
      const studentAppts = existingAppointments.filter(a => a.studentIds.includes(student.id));
      if (studentAppts.length > 0) {
        const weekdayCount: Record<number, number> = {};
        studentAppts.forEach(appt => {
          const d = new Date(appt.date);
          const wd = d.getDay() || 7;
          weekdayCount[wd] = (weekdayCount[wd] || 0) + 1;
        });
        let best = 1, bestCount = 0;
        Object.entries(weekdayCount).forEach(([wd, count]) => {
          if (count > bestCount) { bestCount = count; best = parseInt(wd); }
        });
        usualWeekday = best;
      }

      for (let week = 0; week < weeks; week++) {
        const appointmentDate = new Date(startDate);
        appointmentDate.setDate(startDate.getDate() + week * 7);
        const currentDay = appointmentDate.getDay() || 7;
        const dayDiff = usualWeekday - currentDay;
        appointmentDate.setDate(appointmentDate.getDate() + dayDiff);

        if (student.rhythm === 'biweekly') {
          const weekNumber = getWeekNumber(appointmentDate);
          if (weekNumber % 2 !== 0) continue;
        }

        const dateStr = formatDateLocal(appointmentDate);
        const existing = existingAppointments.find(
          a => a.date === dateStr && a.studentIds.includes(student.id)
        );
        if (existing) continue;

        newAppointments.push({
          id: `auto-${Date.now()}-${week}-${student.id}`,
          studentIds: [student.id],
          date: dateStr,
          time: usualTime,
          duration: student.defaultDuration,
          status: 'planned',
        });
      }
    }
  });

  return newAppointments;
}

/**
 * Format a Date as YYYY-MM-DD in local timezone (avoids UTC offset issues).
 */
export function formatDateLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Represents a free time slot placeholder (not a real appointment).
 */
export interface TimeSlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  duration: number; // minutes
  isPlaceholder: true;
}

/**
 * Represents a break/blocker (e.g. lunch break) – rendered as a grey card.
 * Not stored in data; derived from ScheduleSettings.
 */
export interface BreakBlock {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  duration: number; // minutes
  label: string; // e.g. "Mittagspause"
}

/**
 * Generate free time slot placeholders for a single day.
 *
 * Rules:
 * - Fills the time window (start..end) with slots, preferring `slotDuration` minutes
 * - Leaves `breakMinutes` pause between slots AND existing appointments
 * - Existing appointments create "occupied" blocks; gaps around them are filled
 * - Break blocks (e.g. lunch) are treated as occupied time – no slots overlap them
 * - If a gap is too small for slotDuration, tries 60 min, then the remaining gap
 * - Skips gaps shorter than 30 minutes
 */
export function generateTimeSlots(
  dateStr: string,
  existingAppointments: Appointment[],
  dayStart: string,
  dayEnd: string,
  slotDuration: number = 90,
  breakMinutes: number = 10,
  breakStart?: string, // e.g. "12:10" – lunch break start
  breakEnd?: string,   // e.g. "13:00" – lunch break end
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  // Build occupied blocks from existing appointments (sorted by time)
  const dayAppts = existingAppointments
    .filter(a => a.date === dateStr && a.time)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  type Block = { start: number; end: number }; // minutes since 00:00
  const blocks: Block[] = [];

  for (const appt of dayAppts) {
    const start = timeToMinutes(appt.time!);
    const end = start + appt.duration;
    blocks.push({ start, end });
  }

  // Add lunch break as an occupied block (if configured)
  if (breakStart && breakEnd) {
    const bs = timeToMinutes(breakStart);
    const be = timeToMinutes(breakEnd);
    if (be > bs) {
      blocks.push({ start: bs, end: be });
    }
  }

  // Merge overlapping blocks
  blocks.sort((a, b) => a.start - b.start);
  const merged: Block[] = [];
  for (const block of blocks) {
    if (merged.length > 0 && block.start <= merged[merged.length - 1].end) {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, block.end);
    } else {
      merged.push({ ...block });
    }
  }

  // Expand blocks by breakMinutes on each side (don't overlap with slots)
  // BUT: don't expand break blocks (lunch) – they already have clear boundaries
  const occupied: Block[] = [];

  // Re-check: we need to know which blocks are break blocks vs appointment blocks
  // Easiest approach: expand appointment blocks, add break blocks as-is,
  // then merge everything
  const apptBlocks: Block[] = [];
  for (const appt of dayAppts) {
    const start = timeToMinutes(appt.time!);
    const end = start + appt.duration;
    apptBlocks.push({ start, end });
  }
  // Sort and merge appointment blocks
  apptBlocks.sort((a, b) => a.start - b.start);
  const mergedApptBlocks: Block[] = [];
  for (const block of apptBlocks) {
    if (mergedApptBlocks.length > 0 && block.start <= mergedApptBlocks[mergedApptBlocks.length - 1].end) {
      mergedApptBlocks[mergedApptBlocks.length - 1].end = Math.max(mergedApptBlocks[mergedApptBlocks.length - 1].end, block.end);
    } else {
      mergedApptBlocks.push({ ...block });
    }
  }
  // Expand appointment blocks by breakMinutes
  const expandedApptBlocks: Block[] = mergedApptBlocks.map(b => ({
    start: Math.max(0, b.start - breakMinutes),
    end: b.end + breakMinutes,
  }));

  // Add break block (lunch) as-is – no extra breakMinutes padding
  if (breakStart && breakEnd) {
    const bs = timeToMinutes(breakStart);
    const be = timeToMinutes(breakEnd);
    if (be > bs) {
      expandedApptBlocks.push({ start: bs, end: be });
    }
  }

  // Merge everything together
  expandedApptBlocks.sort((a, b) => a.start - b.start);
  const mergedOccupied: Block[] = [];
  for (const block of expandedApptBlocks) {
    if (mergedOccupied.length > 0 && block.start <= mergedOccupied[mergedOccupied.length - 1].end) {
      mergedOccupied[mergedOccupied.length - 1].end = Math.max(mergedOccupied[mergedOccupied.length - 1].end, block.end);
    } else {
      mergedOccupied.push({ ...block });
    }
  }

  // Find free gaps between dayStart and dayEnd
  const windowStart = timeToMinutes(dayStart);
  const windowEnd = timeToMinutes(dayEnd);
  const gaps: Block[] = [];
  let cursor = windowStart;

  for (const block of mergedOccupied) {
    if (block.start > cursor) {
      gaps.push({ start: cursor, end: Math.min(block.start, windowEnd) });
    }
    cursor = Math.max(cursor, block.end);
  }
  if (cursor < windowEnd) {
    gaps.push({ start: cursor, end: windowEnd });
  }

  // Fill gaps with slots
  let slotIndex = 0;
  for (const gap of gaps) {
    let pos = gap.start;
    while (pos + 30 <= gap.end) { // minimum 30 min to be useful
      let dur = slotDuration;
      const remaining = gap.end - pos;
      const availableWithBreak = remaining >= dur + breakMinutes ? dur : remaining - breakMinutes;
      if (availableWithBreak >= dur) {
        dur = slotDuration;
      } else if (remaining >= 60 + breakMinutes || (remaining >= 60 && pos + 60 <= gap.end)) {
        dur = 60;
      } else if (remaining >= 60) {
        dur = 60;
      } else {
        dur = remaining;
      }
      if (dur < 30) break; // too short
      const startTime = minutesToTime(pos);
      const endTime = minutesToTime(pos + dur);
      slots.push({
        id: `slot-${dateStr}-${slotIndex++}`,
        date: dateStr,
        startTime,
        endTime,
        duration: dur,
        isPlaceholder: true,
      });
      pos += dur + breakMinutes;
    }
  }
  return slots;
}

/**
 * Get break blocks for a given day based on ScheduleSettings.
 * Returns an empty array if no break is configured for that day type.
 */
export function getBreakBlocks(
  dateStr: string,
  scheduleSettings: import('@/types').ScheduleSettings,
): BreakBlock[] {
  const isWe = isWeekend(dateStr);
  const breakStart = isWe ? scheduleSettings.weekendBreakStart : scheduleSettings.weekdayBreakStart;
  const breakEnd = isWe ? scheduleSettings.weekendBreakEnd : scheduleSettings.weekdayBreakEnd;

  if (!breakStart || !breakEnd) return [];

  const bs = timeToMinutes(breakStart);
  const be = timeToMinutes(breakEnd);
  if (be <= bs) return [];

  return [{
    id: `break-${dateStr}`,
    date: dateStr,
    startTime: breakStart,
    endTime: breakEnd,
    duration: be - bs,
    label: 'Mittagspause',
  }];
}

/**
 * Convert "HH:MM" to minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convert minutes since midnight to "HH:MM".
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Get default schedule settings (including lunch break defaults).
 */
export function getDefaultScheduleSettings(): import('@/types').ScheduleSettings {
  return {
    weekdayStart: '08:00',
    weekdayEnd: '20:00',
    weekendStart: '09:00',
    weekendEnd: '14:00',
    slotDuration: 90,
    breakMinutes: 10,
    weekdayBreakStart: '12:10',
    weekdayBreakEnd: '13:00',
    weekendBreakStart: '',
    weekendBreakEnd: '',
  };
}

/**
 * Check if a date is a weekend day (Saturday=6 or Sunday=0 in JS).
 */
export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T12:00:00'); // midday to avoid UTC issues
  const day = d.getDay();
  return day === 0 || day === 6;
}
