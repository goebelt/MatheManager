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
  onStatusUpdate?: (appointmentId: string, status: 'attended' | 'canceled_paid' | 'canceled_free' | 'planned') => void;
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

  // Filter only non-canceled appointments for suggestions and conflict detection
  const pendingAppointments = useMemo(() =>
    existingAppointments.filter(
      a => !a.status.startsWith('canceled')
    ),
    [existingAppointments]
  );

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

  // Get appointments for each day
  const appointmentsByDay = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    weekDays.forEach(day => {
      const dateStr = day.toISOString().split('T')[0];
      grouped[dateStr] = existingAppointments.filter(apt => apt.date === dateStr);
    });
    return grouped;
  }, [weekDays, existingAppointments]);

  // Detect conflicts between appointments
  const getConflictStatus = (appointment: Appointment, allAppointments: Appointment[]): 'conflict' | 'tight' | 'ok' | null => {
    // Skip conflict detection for canceled appointments
    if (appointment.status.startsWith('canceled')) {
      return null;
    }

    // Get all non-canceled appointments on the same date
    const sameDateAppointments = allAppointments
      .filter(a => a.date === appointment.date && !a.status.startsWith('canceled'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Find the index of the current appointment
    const currentIndex = sameDateAppointments.findIndex(a => a.id === appointment.id);
    if (currentIndex <= 0) return null;

    // Check against previous appointment
    const prevAppointment = sameDateAppointments[currentIndex - 1];
    if (!prevAppointment) return null;

    // Parse times
    const prevEndTime = new Date(prevAppointment.date);
    prevEndTime.setMinutes(prevEndTime.getMinutes() + prevAppointment.duration);
    
    const currentStartTime = new Date(appointment.date);

    // Calculate time difference in minutes
    const timeDiff = (currentStartTime.getTime() - prevEndTime.getTime()) / (1000 * 60);

    // Conflict: start time is before or at the end time of previous appointment
    if (timeDiff <= 0) {
      return 'conflict';
    }

    // Tight: start time is within 5 minutes of end time
    if (timeDiff <= 5) {
      return 'tight';
    }

    // OK: sufficient gap
    return 'ok';
  };

  const handleStatusChange = (appointmentId: string, newStatus: 'attended' | 'canceled_paid' | 'canceled_free' | 'planned') => {
    if (onStatusUpdate) {
      onStatusUpdate(appointmentId, newStatus);
    }
  };

  const handleAddStudent = (appointmentId: string, studentId: string) => {
    if (onAddStudent) {
      onAddStudent(appointmentId, studentId);
    }
  };

  return (
    <div className="space-y-6">
      {weekDays.map((day, index) => {
        const dateStr = day.toISOString().split('T')[0];
        const dayAppointments = appointmentsByDay[dateStr] || [];
        
        if (dayAppointments.length === 0) return null;

        return (
          <div key={dateStr} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
            {/* Day Header */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                <CalendarIcon size={18} className="inline mr-2 text-green-600" />
                {day.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })}
              </h3>
            </div>

            {/* Appointments */}
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {dayAppointments.map(appointment => {
                // Get conflict status for this appointment
                const conflictStatus = getConflictStatus(appointment, dayAppointments);

                return (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    student={students.find(s => s.id === appointment.studentIds[0])!}
                    allStudents={students}
                    priceEntries={priceEntries}
                    onStatusChange={handleStatusChange}
                    onAddStudent={handleAddStudent}
                    conflictStatus={conflictStatus}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}