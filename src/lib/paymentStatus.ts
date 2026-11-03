import type { Appointment } from '@/types';

export type PaymentStatusFilter = 'paid' | 'unpaid' | 'all';

export type AppointmentPaymentState = Pick<Appointment, 'studentIds' | 'isPaid' | 'paidStudentIds'>;

/**
 * Read participant-level state when present; otherwise preserve legacy semantics,
 * where the appointment's isPaid flag applies to all participants.
 */
export function getStudentPaymentStatus(
  appointment: AppointmentPaymentState,
  studentId: string,
): boolean {
  if (!appointment.studentIds.includes(studentId)) return false;
  if (appointment.paidStudentIds !== undefined) {
    return appointment.paidStudentIds.includes(studentId);
  }
  return appointment.isPaid ?? false;
}

/** Update one participant's payment without changing the other group members. */
export function setStudentPaymentStatus(
  appointment: Appointment,
  studentId: string,
  isPaid: boolean,
): Appointment {
  if (!appointment.studentIds.includes(studentId)) return appointment;

  const paidIds = new Set(
    appointment.paidStudentIds !== undefined
      ? appointment.paidStudentIds.filter(id => appointment.studentIds.includes(id))
      : appointment.isPaid
        ? appointment.studentIds
        : [],
  );

  if (isPaid) paidIds.add(studentId);
  else paidIds.delete(studentId);

  const paidStudentIds = appointment.studentIds.filter(id => paidIds.has(id));
  const allPaid = appointment.studentIds.length > 0 && paidStudentIds.length === appointment.studentIds.length;

  return {
    ...appointment,
    isPaid: allPaid,
    paidStudentIds: appointment.studentIds.length > 1 ? paidStudentIds : undefined,
  };
}

/** Set/clear every participant, for the dashboard's appointment-wide toggle. */
export function setAppointmentPaymentStatus(
  appointment: Appointment,
  isPaid: boolean,
): Appointment {
  return {
    ...appointment,
    isPaid,
    paidStudentIds: appointment.studentIds.length > 1
      ? (isPaid ? [...appointment.studentIds] : [])
      : undefined,
  };
}

export function filterPaymentRows<T extends { isPaid?: boolean }>(
  rows: T[],
  filter: PaymentStatusFilter,
): T[] {
  if (filter === 'all') return rows;
  return rows.filter(row => (row.isPaid ?? false) === (filter === 'paid'));
}

export function sumPaymentRows<T extends { isPaid?: boolean }>(
  rows: T[],
  filter: PaymentStatusFilter,
  getAmount: (row: T) => number,
): number {
  return filterPaymentRows(rows, filter).reduce((total, row) => total + getAmount(row), 0);
}
