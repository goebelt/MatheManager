/**
 * Credit management utilities for family credit balance and auto-payment
 */

import type { DataContainer, FamilyCredit, Appointment, Student, PriceEntry, Family } from '@/types';

/**
 * Calculate current credit balance for a family
 */
export function calculateFamilyCreditBalance(familyId: string, data: DataContainer): number {
  const family = data.families?.find(f => f.id === familyId);
  if (!family?.credits || family.credits.length === 0) return 0;
  return family.credits.reduce((sum, credit) => sum + credit.amount, 0);
}

/**
 * Get all credit entries for a family
 */
export function getFamilyCredits(familyId: string, data: DataContainer): FamilyCredit[] {
  const family = data.families?.find(f => f.id === familyId);
  return family?.credits || [];
}

/**
 * Find the applicable price for an appointment at its date
 */
export function getAppointmentPrice(
  appointment: Appointment,
  data: DataContainer
): number {
  const studentIds = appointment.studentIds;
  if (studentIds.length === 0) return 0;

  const appointmentDate = appointment.date;
  const isGroup = studentIds.length > 1;
  const duration = appointment.duration || 60;

  // Find matching price entry (most specific first)
  const priceEntries = data.priceEntries || [];
  const matchingEntries = priceEntries.filter(entry => {
    // Check date validity
    const validFrom = new Date(entry.validFrom);
    const validTo = entry.validTo ? new Date(entry.validTo) : null;
    const apptDate = new Date(appointmentDate);
    if (apptDate < validFrom) return false;
    if (validTo && apptDate > validTo) return false;

    // Check if entry applies to these students
    if (entry.studentIds.length > 0) {
      // Must match at least one student
      return studentIds.some(id => entry.studentIds.includes(id));
    }
    // Default entry (empty studentIds) applies to everyone
    return true;
  });

  if (matchingEntries.length === 0) return 0;

  // Use the first matching entry (most specific - has studentIds)
  const entry = matchingEntries.find(e => e.studentIds.length > 0) || matchingEntries[0];

  if (entry.type === 'block' && entry.blockPrice) {
    return entry.blockPrice;
  }

  // Standard pricing
  if (isGroup) {
    return duration === 90 ? (entry.group90 || 0) : (entry.group60 || 0);
  } else {
    return duration === 90 ? (entry.individual90 || 0) : (entry.individual60 || 0);
  }
}

/**
 * Calculate total price for an appointment (sum for all students if individual pricing)
 */
export function calculateAppointmentTotalPrice(
  appointment: Appointment,
  data: DataContainer
): number {
  const studentIds = appointment.studentIds;
  if (studentIds.length === 0) return 0;

  const isGroup = studentIds.length > 1;
  const appointmentDate = appointment.date;
  const duration = appointment.duration || 60;

  // For group appointments, one price for all
  if (isGroup) {
    return getAppointmentPrice(appointment, data);
  }

  // For individual appointments, sum up each student's price
  let total = 0;
  for (const studentId of studentIds) {
    const singleAppointment = { ...appointment, studentIds: [studentId] };
    total += getAppointmentPrice(singleAppointment, data);
  }
  return total;
}

/**
 * Apply credit for an appointment (auto-payment)
 * Returns updated DataContainer or null if insufficient credit
 */
export function applyCreditForAppointment(
  appointmentId: string,
  data: DataContainer
): DataContainer | null {
  const appointment = data.appointments?.find(a => a.id === appointmentId);
  if (!appointment) return null;

  // Only apply for attended or canceled_paid
  if (appointment.status !== 'attended' && appointment.status !== 'canceled_paid') {
    return data;
  }

  // Already paid? Skip
  if (appointment.isPaid) return data;

  // Get student's family
  const studentId = appointment.studentIds[0];
  if (!studentId) return null;

  const student = data.students?.find(s => s.id === studentId);
  if (!student) return null;

  const family = data.families?.find(f => f.id === student.familyId);
  if (!family) return null;

  // Calculate price
  const price = calculateAppointmentTotalPrice(appointment, data);
  if (price <= 0) {
    // Free appointment, mark as paid
    return {
      ...data,
      appointments: data.appointments.map(a =>
        a.id === appointmentId ? { ...a, isPaid: true } : a
      ),
      lastUpdated: new Date().toISOString() as string
    };
  }

  // Check credit balance
  const balance = calculateFamilyCreditBalance(family.id, data);
  if (balance < price) {
    // Insufficient credit
    return null;
  }

  // Sufficient credit - create negative credit entry (consumption)
  const newCredit: FamilyCredit = {
    id: `credit-${Date.now()}`,
    familyId: family.id,
    amount: -price,
    date: new Date().toISOString().split('T')[0],
    note: `Termin ${appointment.id} (${appointment.date} ${appointment.time || ''})`
  };

  // Update family credits
  const updatedFamilies = data.families.map(f =>
    f.id === family.id
      ? { ...f, credits: [...(f.credits || []), newCredit] }
      : f
  );

  // Update appointment as paid
  const updatedAppointments = data.appointments.map(a =>
    a.id === appointmentId ? { ...a, isPaid: true } : a
  );

  return {
    ...data,
    families: updatedFamilies,
    appointments: updatedAppointments,
    lastUpdated: new Date().toISOString() as string
  };
}

/**
 * React hook for live family credit balance
 */
import { useState, useEffect } from 'react';

export function useFamilyCredits(familyId: string, data: DataContainer | null) {
  const [balance, setBalance] = useState(0);
  const [credits, setCredits] = useState<FamilyCredit[]>([]);

  useEffect(() => {
    if (!data) {
      setBalance(0);
      setCredits([]);
      return;
    }
    setBalance(calculateFamilyCreditBalance(familyId, data));
    setCredits(getFamilyCredits(familyId, data));
  }, [data, familyId]);

  return { balance, credits };
}
