import { describe, expect, it } from '@jest/globals';
import type { Appointment } from '@/types';
import {
  filterPaymentRows,
  getStudentPaymentStatus,
  setAppointmentPaymentStatus,
  setStudentPaymentStatus,
  sumPaymentRows,
} from '../paymentStatus';

const groupAppointment: Appointment = {
  id: 'group-1',
  studentIds: ['student-a', 'student-b'],
  date: '2026-10-20',
  time: '14:00',
  duration: 90,
  status: 'attended',
  isPaid: false,
};

describe('participant payment status', () => {
  it('treats legacy appointment-level paid status as applying to every participant', () => {
    const legacyPaid = { ...groupAppointment, isPaid: true };
    expect(getStudentPaymentStatus(legacyPaid, 'student-a')).toBe(true);
    expect(getStudentPaymentStatus(legacyPaid, 'student-b')).toBe(true);
  });

  it('records one group participant as paid without marking the other paid', () => {
    const partiallyPaid = setStudentPaymentStatus(groupAppointment, 'student-a', true);
    expect(getStudentPaymentStatus(partiallyPaid, 'student-a')).toBe(true);
    expect(getStudentPaymentStatus(partiallyPaid, 'student-b')).toBe(false);
    expect(partiallyPaid.isPaid).toBe(false);
    expect(partiallyPaid.paidStudentIds).toEqual(['student-a']);
  });

  it('marks the group paid only after every participant is paid', () => {
    const onePaid = setStudentPaymentStatus(groupAppointment, 'student-a', true);
    const allPaid = setStudentPaymentStatus(onePaid, 'student-b', true);
    expect(allPaid.isPaid).toBe(true);
    expect(getStudentPaymentStatus(allPaid, 'student-a')).toBe(true);
    expect(getStudentPaymentStatus(allPaid, 'student-b')).toBe(true);
  });

  it('can clear one participant from a legacy fully-paid group', () => {
    const legacyPaid = { ...groupAppointment, isPaid: true };
    const changed = setStudentPaymentStatus(legacyPaid, 'student-b', false);
    expect(changed.isPaid).toBe(false);
    expect(getStudentPaymentStatus(changed, 'student-a')).toBe(true);
    expect(getStudentPaymentStatus(changed, 'student-b')).toBe(false);
  });

  it('can set or clear every participant for the dashboard-level toggle', () => {
    const paid = setAppointmentPaymentStatus(groupAppointment, true);
    expect(paid.paidStudentIds).toEqual(['student-a', 'student-b']);
    const unpaid = setAppointmentPaymentStatus(paid, false);
    expect(unpaid.paidStudentIds).toEqual([]);
    expect(unpaid.isPaid).toBe(false);
  });
});

describe('payment filters and totals', () => {
  const rows = [
    { isPaid: true, amount: 40 },
    { isPaid: false, amount: 45 },
    { isPaid: true, amount: 20 },
  ];

  it('filters paid, unpaid, and all rows', () => {
    expect(filterPaymentRows(rows, 'paid')).toHaveLength(2);
    expect(filterPaymentRows(rows, 'unpaid')).toHaveLength(1);
    expect(filterPaymentRows(rows, 'all')).toHaveLength(3);
  });

  it('calculates totals using only the selected payment status', () => {
    expect(sumPaymentRows(rows, 'paid', row => row.amount)).toBe(60);
    expect(sumPaymentRows(rows, 'unpaid', row => row.amount)).toBe(45);
    expect(sumPaymentRows(rows, 'all', row => row.amount)).toBe(105);
  });
});
