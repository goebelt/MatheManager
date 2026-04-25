/**
 * AppointmentCard - Displays a single appointment with status management
 */
'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Users, User, AlertTriangle } from 'lucide-react';
import type { Appointment, Student } from '@/types';

interface AppointmentCardProps {
  appointment: Appointment;
  student: Student;
  allStudents?: Student[];
  priceEntries?: any[];
  onStatusChange?: (appointmentId: string, status: Appointment['status']) => void;
  onAddStudent?: (appointmentId: string, additionalStudentId: string) => void;
  conflictStatus?: 'conflict' | 'tight' | 'ok' | null;
}

export function AppointmentCard({
  appointment,
  student,
  allStudents = [],
  onStatusChange,
  onAddStudent,
  conflictStatus,
}: AppointmentCardProps) {
  const isGroupAppointment = appointment.studentIds.length > 1;

  // Resolve all student IDs to Student objects using allStudents prop
  const displayStudents = isGroupAppointment
    ? appointment.studentIds
        .map(id => allStudents.find(s => s.id === id))
        .filter((s): s is Student => !!s)
    : [student];

  const hasAdditionalStudents = appointment.studentIds.length > 2;
  const showStatusControls = !!onStatusChange;

  // Check if appointment is canceled
  const isCanceled = appointment.status.startsWith('canceled');

  const getDuration = (): number => {
    if (appointment.duration) return appointment.duration;
    // Fall back to student's default duration
    const primary = displayStudents[0];
    return primary?.defaultDuration || 60;
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'attended': return 'Stattgefunden';
      case 'canceled_paid': return 'Ausfall bezahlt';
      case 'canceled_free': return 'Ausfall frei';
      default: return 'Geplant';
    }
  };

  const getStatusStyle = (status: string): string => {
    switch (status) {
      case 'attended': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'canceled_paid': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'canceled_free': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  // Determine border color based on conflict status and cancellation
  const getBorderColor = (): string => {
    if (isCanceled) {
      return 'border-gray-300 dark:border-slate-600 opacity-60';
    }
    if (conflictStatus === 'conflict') {
      return 'border-red-500 dark:border-red-500';
    }
    if (conflictStatus === 'tight') {
      return 'border-yellow-500 dark:border-yellow-500';
    }
    return 'border-gray-200 dark:border-slate-700';
  };

  // Get conflict indicator
  const getConflictIndicator = (): React.ReactElement | null => {
    if (isCanceled) return null;
    if (conflictStatus === 'conflict') {
      return (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-medium">
          <AlertTriangle size={14} />
          <span>Konflikt</span>
        </div>
      );
    }
    if (conflictStatus === 'tight') {
      return (
        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
          <AlertTriangle size={14} />
          <span>Knapp</span>
        </div>
      );
    }
    return null;
  };

  // Format time display: use appointment.time directly (HH:MM format)
  const formatTimeDisplay = (): string => {
    if (appointment.time) {
      return appointment.time;
    }
    return '–';
  };

  // Calculate end time from start time + duration
  const formatEndTime = (): string => {
    if (!appointment.time) return '';
    const [h, m] = appointment.time.split(':').map(Number);
    const totalMin = h * 60 + m + getDuration();
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  const isAttended = appointment.status === 'attended';
  const duration = getDuration();
  const priceCount = appointment.studentIds.length;
  const timeDisplay = formatTimeDisplay();
  const endTimeDisplay = formatEndTime();

  return (
    <div className={`bg-white dark:bg-slate-800 border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${getBorderColor()}`}>
      {/* Header: Time, Date, Type */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className={`text-xs font-semibold uppercase tracking-wider ${isCanceled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
            {timeDisplay}{endTimeDisplay ? ` – ${endTimeDisplay}` : ''}
          </div>
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
            isGroupAppointment
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
          } ${isCanceled ? 'opacity-60' : ''}`}>
            {isGroupAppointment ? (
              <>
                <Users size={12} />
                Gruppenkurs • {duration} Min
              </>
            ) : (
              <>
                <User size={12} />
                Einzel • {duration} Min
              </>
            )}
          </div>
        </div>

        {/* Conflict Indicator */}
        {getConflictIndicator()}

        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusStyle(appointment.status)}`}>
          {getStatusLabel(appointment.status)}
        </span>
      </div>

      {/* Student Names */}
      <div className={`mb-4 ${isCanceled ? 'opacity-60' : ''}`}>
        <p className={`font-semibold ${isCanceled ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
          {displayStudents.map(s => s.firstName + (s.lastName ? ' ' + s.lastName : '')).join(', ')}
          {hasAdditionalStudents ? ` +${appointment.studentIds.length - 2} mehr` : ''}
        </p>
        {priceCount > 1 && (
          <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            {priceCount} Schüler × {duration} Min
          </div>
        )}
      </div>

      {/* Status Controls */}
      {showStatusControls && (
        <div className={`flex justify-between items-center ${isCanceled ? 'opacity-60' : ''}`}>
          {/* Quick status select */}
          <select
            defaultValue={appointment.status}
            onChange={(e) => onStatusChange?.(appointment.id, e.target.value as Appointment['status'])}
            disabled={isAttended}
            className={`px-2 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white dark:border-slate-600 ${
              isAttended ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-slate-800' : ''
            }`}
          >
            <option value="attended">Stattgefunden</option>
            <option value="canceled_paid">Ausfall bezahlt</option>
            <option value="canceled_free">Ausfall frei</option>
          </select>

          {/* Status action buttons */}
          <div className="flex justify-end gap-1">
            {(['attended', 'canceled_paid', 'canceled_free'] as const).map((status) => {
              const isActive = appointment.status === status;
              return (
                <button
                  key={status}
                  onClick={() => onStatusChange?.(appointment.id, status)}
                  disabled={isAttended || isActive}
                  className={`p-2 rounded-lg transition-colors ${
                    isActive ? 'ring-2 ring-offset-1 ring-green-500 dark:ring-offset-slate-900' : ''
                  } ${isAttended && status !== 'canceled_paid' && status !== 'canceled_free' ? 'opacity-30 cursor-not-allowed' : ''}`}
                  title={getStatusLabel(status)}
                >
                  {status === 'attended' && (
                    <CheckCircle className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`} />
                  )}
                  {status === 'canceled_paid' && (
                    <AlertCircle className={`w-5 h-5 ${isActive ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-600'}`} />
                  )}
                  {status === 'canceled_free' && (
                    <XCircle className={`w-5 h-5 ${isActive ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
