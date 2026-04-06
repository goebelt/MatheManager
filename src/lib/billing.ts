/**
 * Pricing Engine - Berechnet Honorare basierend auf Preis-Einträgen und Termin-Daten
 */

import type { Appointment, PriceEntry } from '@/types';

/**
 * Typ für berechneten Termin mit Honorar
 */
export interface CalculatedAppointment extends Appointment {
  calculatedFee: number;
  priceEntry?: PriceEntry; // Der verwendete Preis-Eintrag (falls gefunden)
}

/**
 * Bestimmt den Geschlechtstyp basierend auf der Anzahl der Schüler
 * @param studentIds Array von Student-IDs
 * @returns 'einzel' für Einzeltermine, 'gruppe' für Gruppentermine
 */
function determineAppointmentType(studentIds: string[]): 'einzel' | 'gruppe' {
  if (studentIds.length === 1) return 'einzel';
  // Bei 2 Schülern ist es ein Gruppenkurs
  if (studentIds.length === 2) return 'gruppe';
  // Bei mehr als 2 Schülern ebenfalls Gruppe (aber max 2 pro Termin laut Anforderung)
  return 'gruppe';
}

/**
 * Sucht einen gültigen Preis-Eintrag für eine gegebene Kombination von Datum und Typ
 * @param appointmentId ID des Termins zur Bestimmung des Typs
 * @param appointmentDate Datum des Termins (ISO String)
 * @param priceEntries Array verfügbarer Preiseinträge
 * @returns Findeter PriceEntry oder undefined wenn keiner passt
 */
function findMatchingPriceEntry(
  appointmentId: string,
  appointmentDate: string,
  priceEntries: PriceEntry[]
): PriceEntry | undefined {
  const appointmentType = determineAppointmentType([appointmentId]);

  // Preis-Einträge nach validFrom sortieren (für effiziente Suche)
  const sortedEntries = [...priceEntries].sort((a, b) => 
    new Date(a.validFrom).getTime() - new Date(b.validFrom).getTime()
  );

  for (const entry of sortedEntries) {
    // Prüfen ob Typ stimmt
    if (entry.type !== appointmentType) continue;

    // Prüfen ob Datum im Gültigkeitsbereich liegt
    const validFrom = new Date(entry.validFrom);
    const validTo = entry.validTo ? new Date(entry.validTo) : null;

    const appointmentTime = new Date(appointmentDate).getTime();
    const fromTime = validFrom.getTime();
    const toTime = validTo ? validTo.getTime() : Infinity; // Wenn kein Enddatum, gilt bis heute

    if (appointmentTime >= fromTime && appointmentTime <= toTime) {
      return entry;
    }
  }

  return undefined;
}

/**
 * Berechnet das Honorar für einen Termin basierend auf Preis-Einträgen
 * 
 * Logik:
 * - Bestimmt Typ (einzel/gruppe) basierend auf Schüler-Anzahl
 * - Sucht passenden Preis-Eintrag für Datum und Typ
 * - Formel: Betrag × (Dauer / 60)
 * 
 * @param appointment Der Termin zu berechnen
 * @param priceEntries Verfügbare Preis-Einträge
 * @returns Objekt mit calculatedFee und dem verwendeten PriceEntry
 */
export function calculateAppointmentFee(
  appointment: Appointment,
  priceEntries: PriceEntry[] = []
): { fee: number; priceEntry?: PriceEntry } {
  // Status-Logik: ausfall_frei wird mit 0 gewertet
  if (appointment.status === 'canceled_free') {
    return { fee: 0 };
  }

  // Alle anderen Status (stattgefunden, canceled_paid) werden berechnet
  
  const priceEntry = findMatchingPriceEntry(appointment.id, appointment.date, priceEntries);

  let fee = 0;

  if (priceEntry) {
    // Honorar berechnen: Betrag × (Dauer / 60)
    fee = (priceEntry.amount * appointment.duration) / 60;
  } else {
    // Kein Preis-Eintrag gefunden - Hinweis geben, aber 0 zurückgeben
    console.warn(`[Billing] Kein Preis-Eintrag gefunden für Termin ${appointment.id} am ${appointment.date}`);
    fee = 0;
  }

  return { fee, priceEntry };
}

/**
 * Berechnet alle Honorare für eine Liste von Terminen
 * @param appointments Array von Terminen (wird um calculatedFee erweitert)
 * @param priceEntries Verfügbare Preis-Einträge
 * @returns Array mit berechneten Terminen und Gesamtsumme
 */
export function calculateAllFees(
  appointments: Appointment[],
  priceEntries: PriceEntry[] = []
): { appointments: CalculatedAppointment[]; totalFee: number } => {
  const calculatedAppointments = appointments.map(appointment => ({
    ...appointment,
    calculatedFee: calculateAppointmentFee(appointment, priceEntries).fee,
    priceEntry: calculateAppointmentFee(appointment, priceEntries).priceEntry,
  })) as CalculatedAppointment[];

  // Nach Datum sortieren
  calculatedAppointments.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const totalFee = calculatedAppointments.reduce((sum, appt) => sum + appt.calculatedFee, 0);

  return { appointments: calculatedAppointments, totalFee };
}