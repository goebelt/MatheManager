/**
 * AppointmentCard - Displays and manages a single appointment with status controls
 */

import { Calendar, Users, CheckCircle, XCircle, DollarSign } from 'lucide-react';

interface StudentDisplay {
  id: string;
  firstName: string;
  lastName?: string;
}

export interface AppointmentCardProps {
  appointmentId: string;
  date: string; // ISO Date string
  time: string;
  students: StudentDisplay[];
  duration: number;
  status: 'pending' | 'attended' | 'canceled_paid' | 'canceled_free';
  onUpdateStatus?: (newStatus: 'attended' | 'canceled_paid' | 'canceled_free') => void;
}

export function AppointmentCard({ 
  appointmentId,
  date,
  time,
  students,
  duration,
  status,
  onUpdateStatus
}: AppointmentCardProps) {
  
  const isGroup = students.length > 1;
  const formattedDate = new Date(date).toLocaleDateString('de-DE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Status icon mapping
  const statusConfig = {
    pending: { icon: Calendar, label: 'Ausstehend', color: 'text-gray-500' },
    attended: { icon: CheckCircle, label: 'Bestanden', color: 'text-green-600' },
    canceled_paid: { icon: XCircle, label: 'Ausfall (bezahlt)', color: 'text-yellow-600' },
    canceled_free: { icon: XCircle, label: 'Ausfall (frei)', color: 'text-red-600' }
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar size={16} />
          <span>{formattedDate}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>{time}</span>
        </div>

        {/* Status Buttons */}
        {onUpdateStatus && status === 'pending' && (
          <div className="flex gap-1" role="group" aria-label={`Set appointment ${appointmentId} to ${currentStatus.label}`}>
            <button
              type="button"
              onClick={() => onUpdateStatus('attended')}
              className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
              title="Setzt als bestanden"
            >
              <CheckCircle size={18} />
            </button>
            <button
              type="button"
              onClick={() => onUpdateStatus('canceled_paid')}
              className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
              title="Setzt als ausfall (bezahlt)"
            >
              <XCircle size={18} />
            </button>
            <button
              type="button"
              onClick={() => onUpdateStatus('canceled_free')}
              className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              title="Setzt als ausfall (frei)"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}

        {onUpdateStatus && status !== 'pending' && (
          <span className={`text-sm font-medium ${currentStatus.color}`}>
            {currentStatus.label}
          </span>
        )}
      </div>

      {/* Students */}
      <div className="flex items-center gap-2">
        {isGroup ? (
          <>
            <Users size={18} className="text-blue-600 dark:text-blue-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              {students.length} Schüler im Gruppenunterricht
            </span>
          </>
        ) : (
          <>
            {students.map((student, index) => (
              <div key={student.id} className="flex items-center gap-1.5 min-w-[80px]">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-xs font-medium text-white shrink-0">
                  {index + 1}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[80px]">
                  {student.firstName}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer - Duration & Price */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          {isGroup && <Users size={12} />}
          {duration} min
        </span>

        {/* Placeholder price display - could be calculated from PriceEntry */}
      </div>
    </div>
  );
}