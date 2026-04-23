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
  // Skip conflict detection for canceled appointments
  if (appointment.status.startsWith('canceled')) {
    return 'ok';
  }
  if (!appointment.time) return 'ok';

  // Get all non-canceled appointments on the same day
  const sameDayAppointments = allAppointments.filter(
    app =>
      app.date === appointment.date &&
      app.time &&
      !app.status.startsWith('canceled')
  );

  // Sort by time
  sameDayAppointments.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  // Find the index of the current appointment
  const currentIndex = sameDayAppointments.findIndex(app => app.id === appointment.id);

  // If it's the first appointment, no conflict
  if (currentIndex <= 0) return 'ok';

  // Get the previous appointment
  const previousAppointment = sameDayAppointments[currentIndex - 1];
  if (!previousAppointment.time) return 'ok';

  // Calculate end time of previous appointment
  const prevEndTime = addMinutes(previousAppointment.time, previousAppointment.duration);

  // Check for conflict
  if (appointment.time < prevEndTime) {
    return 'conflict';
  }

  // Check for tight schedule (no pause or less than 5 minutes)
  const prevEndTimePlus5 = addMinutes(prevEndTime, 5);
  if (appointment.time <= prevEndTimePlus5) {
    return 'tight';
  }

  return 'ok';
}

/**
 * Auto-plan: Generate planned appointments for students based on preferred schedules.
 * Returns new appointments (does NOT modify data directly).
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
      // Use all preferred schedules
      preferredSchedules.forEach(schedule => {
        for (let week = 0; week < weeks; week++) {
          const appointmentDate = new Date(startDate);
          appointmentDate.setDate(startDate.getDate() + week * 7);

          // Adjust to the preferred weekday
          const currentDay = appointmentDate.getDay() || 7;
          const dayDiff = schedule.dayOfWeek - currentDay;
          appointmentDate.setDate(appointmentDate.getDate() + dayDiff);

          // Check biweekly rhythm
          const rhythm = schedule.rhythm || student.rhythm;
          if (rhythm === 'biweekly') {
            const weekNumber = getWeekNumber(appointmentDate);
            if (weekNumber % 2 !== 0) continue;
          }

          // Check if appointment already exists
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
      // Find the student's usual weekday from existing appointments
      let usualWeekday = 1;
      let usualTime = '09:00';
      const studentAppts = existingAppointments.filter(a =>
        a.studentIds.includes(student.id)
      );

      if (studentAppts.length > 0) {
        const weekdayCount: Record<number, number> = {};
        studentAppts.forEach(appt => {
          const d = new Date(appt.date);
          const wd = d.getDay() || 7;
          weekdayCount[wd] = (weekdayCount[wd] || 0) + 1;
        });

        let best = 1,
          bestCount = 0;
        Object.entries(weekdayCount).forEach(([wd, count]) => {
          if (count > bestCount) {
            bestCount = count;
            best = parseInt(wd);
          }
        });
        usualWeekday = best;
      }

      // Generate appointments for the specified number of weeks
      for (let week = 0; week < weeks; week++) {
        const appointmentDate = new Date(startDate);
        appointmentDate.setDate(startDate.getDate() + week * 7);

        const currentDay = appointmentDate.getDay() || 7;
        const dayDiff = usualWeekday - currentDay;
        appointmentDate.setDate(appointmentDate.getDate() + dayDiff);

        // Check biweekly rhythm
        if (student.rhythm === 'biweekly') {
          const weekNumber = getWeekNumber(appointmentDate);
          if (weekNumber % 2 !== 0) continue;
        }

        // Check if appointment already exists
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
