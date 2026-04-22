/**
 * DayView - Displays appointments for the selected day with auto-suggestions
 */

'use client';

import { useMemo } from 'react';
import { Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import type { Student, Appointment } from '@/types';
import { AppointmentCard } from './AppointmentCard';

interface DayViewProps {
  students: Student[];
  existingAppointments: Appointment[];
  priceEntries?: any[];
  onStatusUpdate?: (appointmentId: string, status: 'attended' | 'canceled_paid' | 'canceled_free' | 'planned') => void;
  onAddStudent?: (appointmentId: string, additionalStudentId: string) => void;
  currentDate?: Date;
}

export function DayView({
  students,
  existingAppointments,
  priceEntries = [],
  onStatusUpdate,
  onAddStudent,
  currentDate = new Date(),
}: DayViewProps) {

  // Filter only non-canceled appointments for suggestions and conflict detection
  const pendingAppointments = useMemo(() =>
    existingAppointments.filter(
      a => !a.status.startsWith('canceled')
    ),
    [existingAppointments]
  );

  // Get the date string for the current day
  const dateStr = useMemo(() => {
    return currentDate.toISOString().split('T')[0];
  }, [currentDate]);

  // Get appointments for the current day
  const dayAppointments = useMemo(() => {
    return existingAppointments.filter(apt => apt.date === dateStr);
  }, [dateStr, existingAppointments]);

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

  const isToday = new Date().toDateString() === currentDate.toDateString();

  return (
    <div className="space-y-6">
      {/* Day Header */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
        <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            <CalendarIcon size={18} className="inline mr-2 text-green-600" />
            {currentDate.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            {isToday && (
              <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                Heute
              </span>
            )}
          </h3>
        </div>

        {/* Appointments */}
        <div className="divide-y divide-gray-100 dark:divide-slate-700">
          {dayAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Keine Termine für diesen Tag
            </div>
          ) : (
            dayAppointments.map(appointment => {
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
            })
          )}
        </div>
      </div>
    </div>
  );
}
