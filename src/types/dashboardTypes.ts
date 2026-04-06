/**
 * Types for Dashboard Components
 */

import type { Appointment, Student } from './index';

export interface WeeklyData {
  currentWeek: number;
  days: DaySlot[];
  suggestedAppointments: SuggestedAppointment[];
}

export interface DaySlot {
  day: string; // 'Mo', 'Di', ... 'So'
  fullDate: Date;
  dateStr: string; // ISO format for comparison
  appointments: Appointment[];
}

export interface SuggestedAppointment {
  id: string;
  day: number; // 1 = Mo, 7 = So
  timeSlot: string; // '09:00', '14:00' etc.
  studentIds: string[];
  duration: number;
  type: 'individual' | 'group';
}

/**
 * Determines if a biweekly rhythm student should appear based on calendar week parity
 */
export function getRhythmWeekParity(calendarWeek: number, rhythm: 'weekly' | 'biweekly'): boolean {
  if (rhythm === 'weekly') return true;
  
  // Biweekly: Even weeks = appears, Odd weeks = doesn't appear (or vice versa)
  // Standard: Week 1,3,5,7... student appears on odd weeks
  // OR: Week 0,2,4,6... student appears on even weeks
  return calendarWeek % 2 === 0;
}