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
}

export interface PreferredSchedule {
  dayOfWeek: number; // 0 = Sonntag, 1 = Montag, ..., 6 = Samstag
  time: string; // Format: "HH:MM" z.B. "14:00"
}

export interface PriceEntry {
  id: string;
  name?: string; // Name der Preisregelung
  studentIds: string[]; // Mehrere Schüler können zugeordnet werden (leeres Array = Standardpreis)
  type: 'individual' | 'group';
  amount: number;
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
  prices?: PriceEntry[];
  appointments: Appointment[];
  invoiceSettings?: InvoiceSettings; // User's letterhead settings
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