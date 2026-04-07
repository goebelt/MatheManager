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
  onStatusChange?: (appointmentId: string, status: Appointment['status']) => void;
  onAddStudent?: (appointmentId: string, additionalStudentId: string) => void;
}

export function WeekView({ 
  students, 
  existingAppointments,
  onStatusChange,
  onAddStudent
}: WeekViewProps) {
  // Filter only non-canceled appointments for suggestions
  const pendingAppointments = useMemo(() =>
    existingAppointments.filter(
      a => !a.status.startsWith('canceled')
    ),
    [existingAppointments]
  );

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};

    pendingAppointments.forEach(appointment => {
      if (!grouped[appointment.date]) {
        grouped[appointment.date] = [];
      }
      grouped[appointment.date].push(appointment);
    });

    return grouped;
  }, [pendingAppointments]);

  // Get suggested appointments for the week
  const suggestedAppointments = useMemo(() => {
    const suggestions: Appointment[] = [];

    // Track which dates are already covered by existing appointments
    const coveredDates = new Set(pendingAppointments.map(a => a.date));

    students.forEach(student => {
      const rhythm = student.rhythm;
      const duration = student.defaultDuration;

      if (rhythm === 'weekly') {
        // Weekly: always attend every week
        suggestions.push({
          id: `suggest-${student.id}-week`,
          studentIds: [student.id],
          date: new Date().toISOString(),
          time: '09:00',
          duration,
        });
      } else if (rhythm === 'biweekly') {
        // Biweekly: check calendar week parity (even = attend, odd = skip)
        const now = new Date();
        const dayOfWeek = now.getDay();

        // Calculate current week number in the month (1-4)
        const weekInMonth = Math.floor((now.getDate() + dayOfWeek + 1) / 7);

        // If even week: attend. If odd week: skip
        if (weekInMonth % 2 === 0) {
          suggestions.push({
            id: `suggest-${student.id}-biweekly`,
            studentIds: [student.id],
            date: new Date().toISOString(),
            time: '14:00',
            duration,
          });
        }
      }
    });

    return suggestions.filter(s => !coveredDates.has(s.date));
  }, [students, pendingAppointments]);

  // Combine existing and suggested appointments
  const allAppointments = [...pendingAppointments, ...suggestedAppointments];

  return (
    <div className="space-y-4">
      {/* Suggestion indicator */}
      {suggestedAppointments.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
            <Sparkles size={16} />
            <span>
              {suggestedAppointments.length} Termin(e) basierend auf Schüler-Rhythmus:
              {students.some(s => s.rhythm === 'weekly') && ' '}
              <strong>{students.filter(s => s.rhythm === 'weekly').length}</strong> wöchentlich
            </span>
          </div>

          {/* Legend */}
          <div className="hidden sm:flex gap-3 text-xs text-blue-700 dark:text-blue-400">
            <span className="flex items-center gap-1">
              <CalendarIcon size={12} />
              Mo-So
            </span>
          </div>
        </div>
      )}

      {/* Week days display */}
      <div className="hidden sm:flex justify-between text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide px-1">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, i) => (
          <div key={day} className="flex flex-col items-center gap-1 min-w-[3rem]">
            <span>{day}</span>
            <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>

      {/* Appointments grid */}
      {allAppointments.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <CalendarIcon size={32} className="mx-auto mb-3 opacity-30" />
          <p>Keine Termine für diese Woche</p>
          {suggestedAppointments.length > 0 && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Aber {suggestedAppointments.length} Vorschläge verfügbar!
            </p>
          )}
        </div>
      ) : (
        allAppointments.map((appointment) => {
          const studentIds = appointment.studentIds || [];
          const displayStudents = studentIds.map(id =>
            students.find(s => s.id === id)
          ).filter(Boolean);

          if (!displayStudents.length) return null;

          // Find first student for display since they're in array order
          const primaryStudent = displayStudents[0];

          return (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              student={primaryStudent}
              onStatusChange={onStatusChange}
              onAddStudent={onAddStudent}
            />
          );
        })
      )}

      {/* Mobile day labels (shown below each card on mobile) */}
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