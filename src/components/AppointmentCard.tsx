/**
 * AppointmentCard - Displays a single appointment with status management
 */
'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Users, User, Plus } from 'lucide-react';
import type { Appointment, Student } from '@/types';

interface AppointmentCardProps {
  appointment: Appointment;
  student: Student;
  onStatusChange?: (appointmentId: string, status: Appointment['status']) => void;
  onAddStudent?: (appointmentId: string, additionalStudentId: string) => void;
}

export function AppointmentCard({ 
  appointment, 
  student, 
  onStatusChange,
  onAddStudent 
}: AppointmentCardProps) {
  // Determine if this is a group appointment (multiple students)
  const isGroupAppointment = appointment.studentIds.length > 1;
  const displayedStudents = appointment.studentIds.slice(0, 2);
  
  // Check if there are more students than displayed (for "add another" feature)
  const hasAdditionalStudents = appointment.studentIds.length > displayedStudents.length;

  // Always show status buttons when onStatusChange is provided, regardless of current status
  const showStatusControls = !!onStatusChange;

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: Time, Date, Type */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {new Date(appointment.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
            isGroupAppointment 
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
          }`}>
            {isGroupAppointment ? (
              <>
                <Users size={12} />
                Gruppenkurs • 90 Min
              </>
            ) : (
              <>
                <User size={12} />
                Einzel • {appointment.duration} Min
              </>
            )}
          </div>
        </div>
        
        {/* Status Badge - read-only display */}
        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
          appointment.status === 'attended' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
          appointment.status === 'canceled_paid' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
          appointment.status === 'canceled_free' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
          'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300'
        }`}>
          {appointment.status === 'attended' ? 'Stattgefunden' :
           appointment.status === 'canceled_paid' ? 'Ausfall bezahlt' :
           appointment.status === 'canceled_free' ? 'Ausfall frei' :
           'Geplant'}
        </span>
      </div>

      {/* Student Name */}
      <div className="mb-4">
        <p className="font-semibold text-gray-900 dark:text-white">
          {displayedStudents.map(s => 
            s.firstName + (s.lastName ? ` ${s.lastName}` : '')
          ).join(', ')}{hasAdditionalStudents && !isGroupAppointment ? ` und ${appointment.studentIds.length - displayedStudents.length} mehr` : ''}
        </p>
        
        {/* Add more students button for group appointments with additional students */}
        {isGroupAppointment && hasAdditionalStudents && (
          <button
            onClick={() => onAddStudent?.(appointment.id, appointment.studentIds[2])}
            disabled={onAddStudent === undefined}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition-colors mt-1 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus size={12} />
            Schüler hinzufügen
          </button>
        )}
      </div>

      {/* Status Change Buttons - Only show when onStatusChange is provided */}
      {showStatusControls && (
        <div className="flex justify-between items-center">
          
          {/* Select Dropdown for quick status change */}
          <select
            defaultValue={appointment.status}
            onChange={(e) => onStatusChange?.(appointment.id, e.target.value as Appointment['status'])}
            disabled={appointment.status === 'attended'}
            className={`px-2 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${
              appointment.status === 'attended' ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
            }`}
          >
            <option value="attended">✅ Stattgefunden</option>
            <option value="canceled_paid">⚠️ Ausfall bezahlt</option>
            <option value="canceled_free">❌ Ausfall frei</option>
          </select>

          {/* Status Icons Row - Always show controls when onStatusChange is provided */}
          <div className="flex justify-end gap-1">
            {['attended', 'canceled_paid', 'canceled_free'].map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange?.(appointment.id, status)}
                disabled={appointment.status === 'attended' || status === appointment.status}
                className={`p-2 rounded-lg transition-colors ${
                  status === appointment.status 
                    ? 'ring-2 ring-offset-1 ring-green-500 dark:ring-offset-slate-900' 
                    : ''
                } ${appointment.status === 'attended' && !status.startsWith('canceled') ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                {status === 'attended' && <CheckCircle className={`w-5 h-5 ${status === appointment.status ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`} />}
                {status === 'canceled_paid' && <AlertCircle className={`w-5 h-5 ${status === appointment.status ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-600'}`} />}
                {status === 'canceled_free' && <XCircle className={`w-5 h-5 ${status === appointment.status ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}