import type { Appointment } from '@/types';

/**
 * Normalize payment state for backups created before explicit payment tracking.
 * A lesson status is not proof of payment: only preserve explicit payment data.
 */
export function migrateAppointmentPaymentStatuses<T extends Appointment>(
  appointments: T[],
): Array<T & { isPaid: boolean }> {
  return appointments.map(appointment => {
    const participantIds = appointment.studentIds || [];
    const paidStudentIds = appointment.paidStudentIds;

    const isPaid = Array.isArray(paidStudentIds)
      ? participantIds.length > 0 && participantIds.every(studentId => paidStudentIds.includes(studentId))
      : typeof appointment.isPaid === 'boolean'
        ? appointment.isPaid
        : false;

    return { ...appointment, isPaid };
  });
}
