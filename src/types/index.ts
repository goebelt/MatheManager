/**
 * Data Models for Math Tutor Management App
 */

export interface Family {
  id: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface Student {
  id: string;
  familyId: string;
  firstName: string;
  lastName?: string;
  notes?: string;
  defaultDuration: number; // 60 oder 90 Minuten
  rhythm: 'weekly' | 'biweekly';
}

export interface PriceEntry {
  id: string;
  studentId: string;
  type: 'individual' | 'group';
  amount: number;
  validFrom: string; // ISO Date
  validTo?: string | null; // ISO Date, null = ongoing
}

export interface Appointment {
  id: string;
  studentIds: string[];
  date: string; // ISO Date
  duration: number; // in Minuten (60 oder 90)
  status: 'attended' | 'canceled_paid' | 'canceled_free';
}

/**
 * Snapshot for price calculation over time periods
 */
export interface PricePeriod {
  studentId: string;
  type: 'individual' | 'group';
  amount: number;
  from: string; // ISO Date
  to?: string | null; // ISO Date, null = current/default
}

/**
 * Database-like data container with metadata
 */
export interface DataContainer {
  families: Family[];
  students: Student[];
  priceEntries: PriceEntry[];
  appointments: Appointment[];
  lastUpdated?: string; // ISO timestamp
}