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
  preferredSchedule?: PreferredSchedule[]; // Bevorzugte Wochentage und Zeiten
  inactive?: boolean; // Inaktive Schüler werden bei Auto-Plan übersprungen
}

export interface PreferredSchedule {
  dayOfWeek: number; // 1 = Montag, 2 = Dienstag, ..., 7 = Sonntag (ISO-8601)
  time: string; // Format: "HH:MM" z.B. "14:00"
  rhythm: 'weekly' | 'biweekly'; // Rhythmus für diesen bevorzugten Termin
  isGroupAppointment?: boolean; // Ob dieser Termin als Gruppentermin markiert ist
  groupWithStudentId?: string; // ID des Schülers, mit dem dieser Termin geteilt wird (wenn isGroupAppointment=true)
}

export interface PriceEntry {
  id: string;
  name?: string; // Name der Preisregelung
  studentIds: string[]; // Mehrere Schüler können zugeordnet werden (leeres Array = Standardpreis)
  type: 'standard' | 'block'; // Art der Preisregelung
  // Standard-Preise (nur für type='standard')
  individual60?: number; // Preis für 60 Minuten Einzelunterricht
  individual90?: number; // Preis für 90 Minuten Einzelunterricht
  group60?: number; // Preis für 60 Minuten Gruppenunterricht
  group90?: number; // Preis für 90 Minuten Gruppenunterricht
  // Block-Unterricht (nur für type='block')
  blockName?: string; // Name des Block-Unterrichts (z.B. "Abiturprogramm")
  blockPrice?: number; // Festpreis für den gesamten Block
  blockStartDate?: string; // Startdatum des Blocks (ISO Date)
  blockEndDate?: string; // Enddatum des Blocks (ISO Date)
  // Gültigkeitszeitraum
  validFrom: string; // ISO Date
  validTo?: string | null; // ISO Date, null = ongoing
  isDefault?: boolean; // Standardpreis für alle ohne eigenen Preiseintrag
}

export interface Appointment {
  id: string;
  studentIds: string[];
  date: string; // ISO Date
  time?: string;
  duration: number; // in Minuten (60 oder 90)
  status: 'attended' | 'canceled_paid' | 'canceled_free' | 'planned';
  isSuggestion?: boolean;
}

/**
 * Payment status for a specific student in an appointment
 */
export interface PaymentStatus {
  appointmentId: string;
  studentId: string;
  isPaid: boolean;
  paidDate?: string; // ISO Date when payment was recorded
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
 * Schedule display settings – configurable time windows and break blocks
 */
export interface ScheduleSettings {
  weekdayStart: string; // "HH:MM" e.g. "08:00"
  weekdayEnd: string; // "HH:MM" e.g. "20:00"
  weekendStart: string; // "HH:MM" e.g. "09:00"
  weekendEnd: string; // "HH:MM" e.g. "14:00"
  slotDuration: number; // preferred slot in minutes, default 90
  breakMinutes: number; // pause between slots, default 10
  weekdayBreakStart: string; // "HH:MM" e.g. "12:10" (empty = no break)
  weekdayBreakEnd: string; // "HH:MM" e.g. "13:00" (empty = no break)
  weekendBreakStart: string; // "HH:MM" e.g. "" (empty = no break on weekends)
  weekendBreakEnd: string; // "HH:MM" e.g. "" (empty = no break on weekends)
}

/**
 * Database-like data container with metadata
 */
export interface DataContainer {
  families: Family[];
  students: Student[];
  priceEntries: PriceEntry[];
  prices?: PriceEntry[];
  appointments: Appointment[];
  paymentStatuses?: PaymentStatus[]; // Bezahlstatus pro Schüler pro Termin
  invoiceSettings?: InvoiceSettings; // User's letterhead settings
  scheduleSettings?: ScheduleSettings; // Time window config for placeholders
  lastUpdated?: string; // ISO timestamp
}

// Aliases for backwards compatibility
export type PriceList = PriceEntry[];

/**
 * Invoice item for line items on an invoice
 */
export interface InvoiceItem {
  appointmentId: string;
  date: string;
  studentName: string;
  lessonType: 'individual' | 'group';
  status: 'attended' | 'canceled_paid' | 'canceled_free' | 'planned';
  hourlyRate: number;
  description: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  isPaid?: boolean; // Bezahlstatus
}

/**
 * User settings for invoice generation (letterhead, IBAN)
 */
export interface InvoiceSettings {
  businessName: string;
  street: string;
  zipCode: string;
  city: string;
  email?: string;
  phone?: string;
  vatId?: string; // Steuernummer / USt-IdNr.
  iban?: string;
  taxId?: string;
  bankName?: string;
  bankBic?: string;
  paymentTerms?: number;
  hourlyRate?: number;
  lessonType?: 'individual' | 'group';
  invoiceNumberStart?: number; // Startwert für Rechnungsnummer (z.B. 1 für 2026/00001)
}

/**
 * Invoice document
 */
export interface Invoice {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  issuedBy: {
    name: string;
    address: string;
    email?: string;
    phone?: string;
    vatId?: string;
  };
  billedTo: Family;
  items: InvoiceItem[];
  subtotal: number;
  taxRate?: number; // in %, e.g., 19 for 19% VAT
  taxAmount?: number;
  total: number;
}
