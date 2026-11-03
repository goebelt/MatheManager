import { describe, expect, it } from '@jest/globals';
import type { DataContainer } from '@/types';
import { applyCreditForAppointment, calculateAppointmentTotalPrice, filterFamiliesWithRemainingCredit } from '../credits';

const baseData = (): DataContainer => ({
  appointments: [{
    id: 'group-1', studentIds: ['student-a', 'student-b'], date: '2026-10-20', time: '14:00',
    duration: 90, status: 'attended', isPaid: false,
  }],
  students: [
    { id: 'student-a', familyId: 'family-a', firstName: 'Anna', defaultDuration: 90, rhythm: 'weekly' },
    { id: 'student-b', familyId: 'family-b', firstName: 'Ben', defaultDuration: 90, rhythm: 'weekly' },
  ],
  families: [
    { id: 'family-a', name: 'Familie A', credits: [{ id: 'a0', familyId: 'family-a', amount: 100, date: '2026-10-01' }] },
    { id: 'family-b', name: 'Familie B', credits: [{ id: 'b0', familyId: 'family-b', amount: 100, date: '2026-10-01' }] },
  ],
  priceEntries: [{
    id: 'default', type: 'standard', studentIds: [], validFrom: '2026-01-01', validTo: null,
    group60: 40, group90: 60, individual60: 50, individual90: 75,
  }],
});

describe('family remaining-credit filter', () => {
  it('keeps only families with a positive net credit balance', () => {
    const families = [
      { id: 'positive', credits: [{ amount: 30 }, { amount: -10 }] },
      { id: 'zero', credits: [{ amount: 15 }, { amount: -15 }] },
      { id: 'negative', credits: [{ amount: 10 }, { amount: -20 }] },
      { id: 'empty' },
    ];
    expect(filterFamiliesWithRemainingCredit(families).map(family => family.id)).toEqual(['positive']);
  });
});

describe('group appointment credit payment', () => {
  it('prices a group appointment once per student', () => {
    const data = baseData();
    expect(calculateAppointmentTotalPrice(data.appointments[0], data)).toBe(120);
  });

  it('debits each participant family and marks both participants paid', () => {
    const result = applyCreditForAppointment('group-1', baseData());
    expect(result).not.toBeNull();
    expect(result?.families.find(f => f.id === 'family-a')?.credits?.at(-1)?.amount).toBe(-60);
    expect(result?.families.find(f => f.id === 'family-b')?.credits?.at(-1)?.amount).toBe(-60);
    expect(result?.appointments[0].isPaid).toBe(true);
    expect(result?.appointments[0].paidStudentIds).toEqual(['student-a', 'student-b']);
  });

  it('does not charge a participant who was already manually marked paid', () => {
    const data = baseData();
    data.appointments[0].paidStudentIds = ['student-a'];
    const result = applyCreditForAppointment('group-1', data);
    expect(result).not.toBeNull();
    expect(result?.families.find(f => f.id === 'family-a')?.credits).toHaveLength(1);
    expect(result?.families.find(f => f.id === 'family-b')?.credits?.at(-1)?.amount).toBe(-60);
    expect(result?.appointments[0].paidStudentIds).toEqual(['student-a', 'student-b']);
  });

  it('does not apply any credit when one participant family lacks enough balance', () => {
    const data = baseData();
    data.families[1].credits = [{ id: 'b0', familyId: 'family-b', amount: 10, date: '2026-10-01' }];
    expect(applyCreditForAppointment('group-1', data)).toBeNull();
    expect(data.families[0].credits).toHaveLength(1);
    expect(data.appointments[0].isPaid).toBe(false);
  });
});
