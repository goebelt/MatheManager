/**
 * WeekView - Displays appointments for the selected week with auto-suggestions
 */

'use client';

import { useMemo } from 'react';
import { Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import type { Student, Appointment } from '@/types';
import { AppointmentCard } from './AppointmentCard';

interface WeekViewProps {
  students: Student[];
  existingAppointments: Appointment[];
  priceEntries?: any[];
  onStatusUpdate?: (appointmentId: string, status: 'attended' | 'canceled_paid' | 'canceled_free') => void;
  onAddStudent?: (appointmentId: string, additionalStudentId: string) => void;
  currentDate?: Date;
}

export function WeekView({
  students,
  existingAppointments,
  priceEntries = [],
  onStatusUpdate,
  onAddStudent,
  currentDate = new Date(),
}: WeekViewProps) {

  // Calculate the week's start (Monday) from currentDate
  const weekStart = useMemo(() => {
    const date = new Date(currentDate);
    const day = date.getDay(); // 0 = Sunday
    const diff = day === 0 ? -6 : 1 - day; // Adjust so Monday = start
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [currentDate]);

  // Build array of 7 days for this week (Mon-Sun)
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  }, [weekStart]);

  // Get ISO date string (YYYY-MM-DD) for a date
  const toDateString = (date: Date): string => date.toISOString().split('T')[0];

  // Map existing appointments by date string
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    existingAppointments
      .filter(a => !a.status.startsWith('canceled'))
      .forEach(appointment => {
        const dateStr = toDateString(new Date(appointment.date));
        if (!grouped[dateStr]) grouped[dateStr] = [];
        grouped[dateStr].push(appointment);
      });
    return grouped;
  }, [existingAppointments]);

  // Figure out the default weekday for each student (what day they normally come)
  const studentDefaultWeekday = useMemo(() => {
    const map: Record<string, number> = {}; // studentId -> weekday (1=Mon ... 7=Sun)
    students.forEach(student => {
      const studentAppts = existingAppointments.filter(a => a.studentIds.includes(student.id));
      if (studentAppts.length > 0) {
        const weekdayCount: Record<number, number> = {};
        studentAppts.forEach(appt => {
          const d = new Date(appt.date);
          const wd = d.getDay() || 7; // Sunday = 7
          weekdayCount[wd] = (weekdayCount[wd] || 0) + 1;
        });
        let best = 1, bestCount = 0;
        Object.entries(weekdayCount).forEach(([wd, count]) => {
          if (count > bestCount) { bestCount = count; best = parseInt(wd); }
        });
        map[student.id] = best;
      } else {
        map[student.id] = 1;
      }
    });
    return map;
  }, [students, existingAppointments]);

  // Check if a student should have a suggested appointment on a given day
  const shouldSuggestForDay = (student: Student, day: Date): boolean => {
    const todayStr = toDateString(day);
    const wd = day.getDay() || 7; // 1=Mon ... 7=Sun

    // Check if there's already an appointment on this day
    const existingOnDay = appointmentsByDate[todayStr] || [];
    const hasExistingForStudent = existingOnDay.some(a => a.studentIds.includes(student.id));
    if (hasExistingForStudent) return false;

    // Check if this is the student's usual day
    const usualDay = studentDefaultWeekday[student.id] || 1;
    if (wd !== usualDay) return false;

    if (student.rhythm === 'weekly') {
      return true;
    } else if (student.rhythm === 'biweekly') {
      const startOfYear = new Date(day.getFullYear(), 0, 1);
      const days = Math.floor((day.getTime() - startOfYear.getTime()) / 86400000);
      const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      return weekNumber % 2 === 0;
    }
    return false;
  };

  // Generate suggestions for the current week
  const suggestions = useMemo(() => {
    const suggested: Array<{
      id: string; studentIds: string[]; date: string; time: string; duration: number; isSuggestion: true;
    }> = [];
    students.forEach(student => {
      weekDays.forEach(day => {
        if (shouldSuggestForDay(student, day)) {
          suggested.push({
            id: `suggest-${student.id}-${toDateString(day)}`,
            studentIds: [student.id],
            date: toDateString(day),
            time: '09:00',
            duration: student.defaultDuration || 60,
            isSuggestion: true,
          });
        }
      });
    });
    return suggested;
  }, [students, weekDays, appointmentsByDate, studentDefaultWeekday]);

  // Combine existing appointments and suggestions
  const allAppointments = useMemo(() => {
    const result: Array<Appointment & { isSuggestion?: boolean }> = [];
    Object.values(appointmentsByDate).forEach(dayAppts => {
      dayAppts.forEach(appt => result.push({ ...appt, isSuggestion: false }));
    });
    suggestions.forEach(s => result.push(s as any));
    result.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.time || '').localeCompare(b.time || '');
    });
    return result;
  }, [appointmentsByDate, suggestions]);

  // Group by week day
  const appointmentsByWeekday = useMemo(() => {
    const grouped: Record<string, typeof allAppointments> = {};
    weekDays.forEach(day => {
      const key = toDateString(day);
      grouped[key] = allAppointments.filter(a => toDateString(new Date(a.date)) === key);
    });
    return grouped;
  }, [allAppointments, weekDays]);

  // Week number
  const currentKW = useMemo(() => {
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const days = Math.floor((currentDate.getTime() - startOfYear.getTime()) / 86400000);
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }, [currentDate]);

  return (
    <div className="space-y-4">
      {/* Suggestion banner */}
      {suggestions.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
            <Sparkles size={16} />
            <span>{suggestions.length} vorgeschlagene(r) Termin(e) fur diese Woche</span>
          </div>
          <span className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1">
            <CalendarIcon size={12} />
            KW {currentKW}
          </span>
        </div>
      )}

      {/* Day column headers (desktop) */}
      <div className="hidden sm:flex justify-between text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide px-1">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, i) => (
          <div key={day} className="flex flex-col items-center gap-1 min-w-[3rem]">
            <span>{day}</span>
            <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>

      {/* Appointments */}
      {allAppointments.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <CalendarIcon size={32} className="mx-auto mb-3 opacity-30" />
          <p>Keine Termine fur diese Woche</p>
          {suggestions.length > 0 && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Aber {suggestions.length} Vorschlage verfugbar!
            </p>
          )}
        </div>
      ) : (
        weekDays.map((day, dayIndex) => {
          const dayKey = toDateString(day);
          const dayAppts = appointmentsByWeekday[dayKey] || [];
          if (dayAppts.length === 0) return null;
          return (
            <div key={dayKey}>
              {/* Day header */}
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-1">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][dayIndex]}&nbsp;
                {day.getDate()}.{String(day.getMonth() + 1).padStart(2, '0')}
              </div>
              {dayAppts.map((appointment) => {
                const studentIds = appointment.studentIds || [];
                const displayStudents = studentIds
                  .map(id => students.find(s => s.id === id))
                  .filter((s): s is Student => !!s);
                if (!displayStudents.length) return null;
                const primaryStudent = displayStudents[0];
                return (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment as Appointment}
                    student={primaryStudent}
                    allStudents={students}
                    onStatusChange={onStatusUpdate}
                    onAddStudent={onAddStudent}
                  />
                );
              })}
            </div>
          );
        })
      )}

      {/* Mobile day labels */}
      {allAppointments.length > 0 && (
        <div className="sm:hidden flex justify-between text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide px-1 py-2">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, i) => (
            <div key={day} className="flex flex-col items-center gap-1 min-w-[3rem]">
              <span>{day}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}