import { describe, expect, it } from '@jest/globals';
import type { Appointment } from '@/types';
import { migrateAppointmentPaymentStatuses } from '../paymentMigration';

const appointment: Appointment = {
  id: 'legacy-attended',
  studentIds: ['student-a', 'student-b'],
  status: 'attended',
  duration: 90,
  date: '2026-10-20',
  time: '14:00',
};

describe('payment-status migration for imported backups', () => {
  it('does not infer that legacy attended appointments were paid', () => {
    const [migrated] = migrateAppointmentPaymentStatuses([appointment]);
    expect(migrated.isPaid).toBe(false);
  });

  it('preserves explicit paid and unpaid values from a v1.4 export', () => {
    const [paid, unpaid] = migrateAppointmentPaymentStatuses([
      { ...appointment, isPaid: true },
      { ...appointment, id: 'explicit-unpaid', isPaid: false },
    ]);
    expect(paid.isPaid).toBe(true);
    expect(unpaid.isPaid).toBe(false);
  });

  it('uses participant entries as the source of truth over a conflicting aggregate flag', () => {
    const [partial] = migrateAppointmentPaymentStatuses([
      { ...appointment, isPaid: true, paidStudentIds: ['student-a'] },
    ]);
    expect(partial.isPaid).toBe(false);
  });

  it('keeps participant payment details and derives aggregate status when missing', () => {
    const [partial, allPaid] = migrateAppointmentPaymentStatuses([
      { ...appointment, paidStudentIds: ['student-a'] },
      { ...appointment, paidStudentIds: ['student-a', 'student-b'] },
    ]);
    expect(partial.paidStudentIds).toEqual(['student-a']);
    expect(partial.isPaid).toBe(false);
    expect(allPaid.isPaid).toBe(true);
  });
});
