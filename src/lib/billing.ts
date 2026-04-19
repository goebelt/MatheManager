/**
 * Pricing Engine - Calculates fees based on appointments and price entries
 */

import type { Appointment, PriceEntry } from '@/types';

/**
 * Calculate the fee for a single appointment based on price rules
 * 
 * Formula: Fee = Amount × (Duration / 60)
 * 
 * @param appointment - The appointment to calculate the fee for
 * @param studentId - ID of the primary student (first in array)
 * @param priceEntries - All available price entries
 * @returns The calculated fee, or 0 if no matching price entry is found
 */
export function calculateAppointmentFee(
  appointment: Appointment,
  studentId?: string,
  priceEntries?: PriceEntry[]
): number {
  try {
    // Determine appointment type based on number of students
    const studentIds = appointment.studentIds || [];
    const appointmentType: 'individual' | 'group' = studentIds.length === 1 ? 'individual' : 'group';

    // Planned appointments have no fee
    if (appointment.status === 'planned') {
      return 0;
    }

    // Find matching price entry:
    // - Type must match (individual vs group)
    // - Appointment date must be between validFrom and validTo (if present)
    // - Priority: Student-specific price first, then default price
    let matchedEntry: PriceEntry | undefined;
    
    // First, try to find a student-specific price entry
    if (studentId) {
      for (const entry of priceEntries || []) {
        if (entry.type === appointmentType && 
            new Date(appointment.date) >= new Date(entry.validFrom) &&
            entry.studentIds && entry.studentIds.includes(studentId)) {
          const validTo = entry.validTo ? new Date(entry.validTo) : null;
          
          // Check if date is within valid range (or no end date defined)
          if (!validTo || new Date(appointment.date) <= validTo) {
            matchedEntry = entry;
            break;
          }
        }
      }
    }
    
    // If no student-specific price found, try to find a default price
    if (!matchedEntry) {
      for (const entry of priceEntries || []) {
        if (entry.type === appointmentType && 
            new Date(appointment.date) >= new Date(entry.validFrom) &&
            (!entry.studentIds || entry.studentIds.length === 0)) {
          const validTo = entry.validTo ? new Date(entry.validTo) : null;
          
          // Check if date is within valid range (or no end date defined)
          if (!validTo || new Date(appointment.date) <= validTo) {
            matchedEntry = entry;
            break;
          }
        }
      }
    }

    // Get price from matched entry, default to 0
    const amount = matchedEntry ? matchedEntry.amount : 0;
    const duration = appointment.duration || 60;

    // Calculate: Fee = Amount × (Duration / 60)
    let fee = Math.round(amount * (duration / 60) * 100) / 100;
    
    // For canceled_paid, only charge 50%
    if (appointment.status === 'canceled_paid') {
      fee = fee * 0.5;
    }
    
    return fee;
  } catch (error) {
    console.warn(`[Billing] Error calculating fee for appointment ${appointment.id}:`, error);
    // Return 0 on error - safe default
    return 0;
  }
}

/**
 * Calculate total earnings from a list of appointments
 * 
 * @param appointments - Array of appointments to calculate fees for
 * @param priceEntries - All available price entries
 * @returns Total calculated fees
 */
export function calculateTotalEarnings(
  appointments: Appointment[],
  priceEntries?: PriceEntry[]
): number {
  return appointments
    .filter(appointment => appointment.status !== 'planned')
    .reduce((total, appointment) => {
      return total + calculateAppointmentFee(appointment, undefined, priceEntries);
    }, 0);
}

/**
 * Get earnings breakdown by appointment type (individual vs group)
 * 
 * @param appointments - Array of appointments to analyze
 * @param priceEntries - All available price entries
 * @returns Object with individual and group earnings
 */
export function getEarningsBreakdown(
  appointments: Appointment[],
  priceEntries?: PriceEntry[]
): { individual: number; group: number } {
  return appointments
    .filter(appointment => appointment.status !== 'planned')
    .reduce((breakdown, appointment) => {
      const fee = calculateAppointmentFee(appointment, undefined, priceEntries);
      
      if (appointment.studentIds?.length === 1) {
        breakdown.individual += fee;
      } else {
        breakdown.group += fee;
      }
      
      return breakdown;
    }, { individual: 0, group: 0 });
}

export function calculateTotalPrice(
  items: Array<{ quantity: number; unitPrice: number }>
): number {
  if (!items || items.length === 0) return 0;
  
  const total = items.reduce((sum, item) => 
    sum + (item.quantity * item.unitPrice), 0);
  return Math.round(total * 100) / 100;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}