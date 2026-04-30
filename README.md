﻿# MatheManager

**[🌐 Live Demo](https://mathe-manager.netlify.app/)**

Next.js App zur Verwaltung von Mathe-Nachhilfe mit Tailwind CSS. Verwalten Sie Familien, Schüler, Termine und Preise – alles in einer übersichtlichen Oberfläche.

## 🎯 Features

### Dashboard
- **Tagesübersicht** mit automatischen Terminvorschlägen basierend auf Schüler-Rhythmus (wöchentlich / zweiwöchentlich) - **Sortierung nach Uhrzeit**: Termine werden chronologisch nach Startzeit angezeigt - **Einheitliche Konfliktlogik**: Nutzt `getAppointmentStatus` aus `lib/scheduling` (identisch zur Termine-Seite) – erkennt Konflikte (Überlappungen) und knappe Pausen (≤5 Min)
- Status-Bediener für jeden Termin: Stattgefunden, Ausfall bezahlt, Ausfall frei
- **Gruppenunterricht**: Bis zu 2 Schüler pro Termin
- **Korrekte Uhrzeitanzeige**: Start- und Endzeit pro Termin (z.B. `14:00 – 15:30`)

### Termine
- **Wochenansicht** mit allen 7 Tagen (Mo–So)
- **Platzhalter-Slots** für freie Zeitfenster (grün gestrichelte Karten, klickbar)
  - Bevorzugt 90-Min-Slots, füllt Restlücken ab 30 Min
  - 10-Min-Pause zwischen aufeinanderfolgenden Platzhaltern
  - Keine Pause vor/nach Pausenblockern (Blocker trennt schon)
- **Mittagspause-Blocker** (graue Karten mit ☕-Icon)
  - Standard: Mo–Fr 12:10–13:00, Sa–So keine Pause
  - Nicht persistent – wird aus ScheduleSettings abgeleitet
  - Slots können direkt an die Pause grenzen (kein extra Abstand)
- **Popup-Dialog** zum Erstellen/Bearbeiten von Terminen (universelles Modal)
- Klickbare Termin-Karten zum Bearbeiten
- Lösch-Button mit Konfliktvermeidung
- Auto-Planung ignoriert Platzhalter, Pausenblocker und **inaktive Schüler**

### Abrechnung
- **Automatische Honorarberechnung** basierend auf Preis-Einträgen und gültigen Zeiträumen
- Filterbare Übersichten nach Zeitraum und Schüler/Familie
- Aufteilung in Einzelstunden vs. Gruppenstunden
- Stundensatz-Spalte für detaillierte Übersicht

### Rechnungen
- Professionelle Druckvorlage mit Firmenkopfzeile
- Auswahl der Familie und Wunschzeitraum
- Automatische Rechnungsnummer Generierung (`YYYY/NNNNN`)
- Drucken per `window.print()` – optimiert für A4 Ausgabe
- **Terminvorschau**-Button: Zeigt geplante Termine (status=planned) mit Preisberechnung
  - Tabelle mit Datum+Uhrzeit, Schüler, Typ (Einzel/Gruppe), Dauer, Preis, Gesamtsumme
  - Filter nach Schüler und Zeitraum wird berücksichtigt
  - Blaues Farbschema zur Unterscheidung von Rechnungen
  - Druck-/PDF-fähig via `AppointmentPreviewTemplate` mit `@media print` CSS
- **Einstellungen** um eigene Firmendaten einzugeben (Name, Adresse, Steuernummer)

### Preise
- **Standardpreise** für Einzel- und Gruppenstunden (gilt für alle ohne eigenen Eintrag)
- Flexible Preiseinträge mit Start-/Enddatum
- Individuelle Preisgestaltung pro Schüler/Familie
- Name-Feld für Preisregelungen

### Schüler
- Verwaltung aller Schüler
- Zuordnung zu Familien
- Individuelle Preisregelungen möglich
- **Aktiv/Inaktiv-Flag**: Inaktive Schüler werden bei Auto-Planung übersprungen
- Inaktive Schüler werden ausgegraut dargestellt (durchgestrichener Name, „Inaktiv"-Badge)
- Toggle-Button zum Aktivieren/Deaktivieren pro Schüler
- **Bevorzugte Termine**: Wochentag, Uhrzeit und Rhythmus pro Schüler konfigurierbar
- **Gruppentermine**: Bevorzugte Termine können als Gruppentermine markiert werden
  - Checkbox „Gruppentermin“ zum Markieren
  - Filterbares Dropdown zur Auswahl des Partner-Schülers (nach Name oder Familie)
  - Gruppentermine werden lila gekennzeichnet mit Partner-Name
  - Bei der Auto-Planung werden Gruppentermine mit beiden Schülern erstellt
  - Vermeidung von Duplikaten: Kein neuer Termin, wenn Gruppentermin bereits vorhanden

### Familien
- Verwaltung von Familien
- Zentrale Verwaltung für mehrere Schüler

### Einstellungen
- Firmeninformationen für Rechnungen
- Rechnungsnummer-Verwaltung
- **Zeitfenster-Konfiguration**: Mo–Fr und Sa–So getrennt (Start/Ende)
- **Slot-Dauer** und **Pausenminuten** zwischen Terminen
- **Mittagspause**: Start/Ende für Mo–Fr und Sa–So (leer = keine Pause)

## 🚀 Installation & Start

```bash
# Projekt installieren
npm install

# Entwicklungsserver starten
npm run dev

# Tests ausführen
npm test

# Tests mit Coverage
npm run test:coverage
```

Das App-Interface ist in deutscher Sprache optimiert und nutzt Tailwind CSS für das gesamte Styling.

## 🧪 Testing

Das Projekt nutzt **Jest** + **ts-jest** + **React Testing Library** für automatisierte Tests.

| Phase | Bereich | Tests | Was getestet wird |
|-------|---------|-------|-------------------|
| **P0** | `lib/billing`, `lib/storage`, `types/dashboardTypes` | 50 | Honorarberechnung, localStorage, Rhythmus-Woche |
| **P1** | `lib/scheduling`, `lib/dateFilters`, `lib/invoiceUtils` | 56 | Termin-Logik, Slot-Generierung, Pausenblocker, Datumsfilter, Rechnungsutils, Gruppentermine |
| **P3** | `components/*` | 70 | UI-Rendering: InvoiceTemplate, AppointmentCard (Zeitanzeige), DayView, Navigation |
| | **Gesamt** | **176** | |

```bash
npm test              # Alle Tests
npm run test:watch    # Watch-Modus
npm run test:coverage # Mit Coverage-Report
```

### Test-Architektur
- **Business-Logik** ist in `src/lib/` Module extrahiert → reine Funktionen, keine React-Mocks nötig
- **UI-Tests** nutzen `@testing-library/react` mit jsdom-Umgebung
- **Datum-Handling** verwendet immer lokale Zeitzone (`new Date(y,m,d)`) um UTC-Offset-Bugs zu vermeiden
- **Scheduling-Tests** decken ab: Slot-Generierung, Pausenlogik, Mittagsblocker, Auto-Planung, Inaktiv-Überspringung, Zeit-Konvertierung, Gruppentermine
- **Gruppentermin-Tests** decken ab: Erstellung von Gruppenterminen, Vermeidung von Duplikaten, Verwendung der längeren Dauer, Erkennung von Partner-Schülern, Biweekly-Rhythmus, Inaktive Partner, Mehrere bevorzugte Termine pro Schüler, Existierende individuelle Termine

## Technische Details

### Gruppentermin-Implementierung

Die Gruppentermin-Funktionalität ist in folgenden Dateien implementiert:

- **`src/types/index.ts`**: Erweitert `PreferredSchedule` mit `isGroupAppointment` und `groupWithStudentId`
- **`src/lib/scheduling.ts`**: Aktualisiert `autoPlanStudents` Funktion zur Erstellung von Gruppenterminen
- **`src/app/students/page.tsx`**: UI-Komponenten für Gruppentermin-Einrichtung und Filterung

### API-Referenz

#### PreferredSchedule

```typescript
interface PreferredSchedule {
  dayOfWeek: number;           // 1 = Montag, 7 = Sonntag
  time: string;                // Format: "HH:MM"
  rhythm: 'weekly' | 'biweekly';
  isGroupAppointment?: boolean;      // true = Gruppentermin
  groupWithStudentId?: string;       // ID des Partner-Schülers
}
```

#### Appointment

```typescript
interface Appointment {
  id: string;
  studentIds: string[];       // Array von Schüler-IDs (1 oder 2)
  date: string;               // Format: "YYYY-MM-DD"
  time: string;               // Format: "HH:MM"
  duration: number;           // Dauer in Minuten
  status: 'planned' | 'attended' | 'canceled' | 'missed';
}
```

### Logik-Fluss

1. **Auto-Planung**: Für jeden Schüler wird geprüft, ob bevorzugte Termine existieren
2. **Gruppentermin-Erkennung**: Wenn `isGroupAppointment` true ist, wird nach einem Partner-Schüler gesucht
3. **Partner-Prüfung**: Es wird geprüft, ob der Partner-Schüler denselben bevorzugten Termin hat
4. **Termin-Erstellung**: Wenn beide Schüler übereinstimmen, wird ein Gruppentermin erstellt
5. **Duplikat-Vermeidung**: Es wird geprüft, ob bereits ein Termin für beide Schüler existiert
6. **Fallback**: Wenn kein Matching gefunden wird, wird ein individueller Termin erstellt

### Bekannte Einschränkungen

- Gruppentermine sind aktuell auf **2 Schüler** beschränkt
- Die Checkbox „Gruppentermin“ muss nur bei einem der beiden Schüler aktiviert werden
- Der Partner-Schüler muss im Dropdown ausgewählt werden (keine freie Eingabe)
- Gruppentermine werden nur bei der Auto-Planung erstellt, nicht bei manueller Termin-Erstellung

### Zukünftige Verbesserungen

- [ ] Unterstützung für mehr als 2 Schüler pro Gruppentermin
- [ ] Manuelle Erstellung von Gruppenterminen
- [ ] Visuelle Darstellung von Gruppenterminen im Kalender
- [ ] Konflikt-Erkennung für Gruppentermine
- [ ] Automatische Partner-Vorschläge basierend auf ähnlichen Zeitplänen

## Test-Abdeckung

| Phase | Bereich | Tests | Was getestet wird |
|-------|---------|-------|-------------------|
| **P0** | `lib/billing`, `lib/storage`, `types/dashboardTypes` | 50 | Honorarberechnung, localStorage, Rhythmus-Woche |
| **P1** | `lib/scheduling`, `lib/dateFilters`, `lib/invoiceUtils` | 92 | Termin-Logik, Slot-Generierung, Pausenblocker, Datumsfilter, Rechnungsutils, Gruppentermine |
| **P3** | `components/*` | 70 | UI-Rendering: InvoiceTemplate, AppointmentCard (Zeitanzeige), DayView, Navigation |
| | **Gesamt** | **212** | |

## 🛠️ Technologie-Stack

| Technologie | Beschreibung |
|-------------|-------------|
| **Next.js 15** | React Framework mit App Router |
| **React 19** | UI-Bibliothek |
| **TypeScript** | Typsichere Entwicklung |
| **Tailwind CSS** | Utility-first CSS Framework |
| **Jest + ts-jest** | Test-Framework |
| **React Testing Library** | Component-Tests |
| **lucide-react** | Moderne Icon-Bibliothek |
| **@heroicons/react** | Zusätzliche Icon-Bibliothek |

## 📁 Projektstruktur

```
MatheManager/
├── src/
│   ├── app/                    # Next.js App Router Pages
│   │   ├── page.tsx            # Startseite
│   │   ├── dashboard/          # Dashboard mit Terminübersicht
│   │   ├── appointments/       # Terminverwaltung (Wochenansicht + Platzhalter + Pausenblocker)
│   │   ├── billing/            # Abrechnungs-Übersicht & Honorarberechnung
│   │   ├── invoices/           # Rechnungsgenerator + Terminvorschau
│   │   ├── prices/             # Preisverwaltung
│   │   ├── students/           # Schülerverwaltung
│   │   ├── families/           # Familienverwaltung
│   │   ├── settings/           # Firmeninformationen + Zeitfenster + Pausenkonfiguration
│   │   ├── layout.tsx          # App-Layout mit Navigation
│   │   └── globals.css         # Globale Styles
│   ├── components/             # Reusable UI-Komponenten
│   │   ├── AppointmentCard.tsx # Termin-Karte mit Uhrzeit (Start–Ende) und Status-Controls
│   │   ├── DashboardHeader.tsx # Header mit Wochen-Navigation
│   │   ├── DayView.tsx         # Tagesansicht (sortiert, Konfliktlogik via scheduling.ts)
│   │   ├── WeekView.tsx        # Wochenansicht mit Vorschlägen
│   │   ├── InvoiceTemplate.tsx # Professionelle Druckvorlage
│   │   ├── Navigation.tsx      # Navigationsleiste
│   │   └── __tests__/          # Component-Tests
│   ├── lib/                    # Utility-Module (Business-Logik)
│   │   ├── billing.ts          # Preisberechnung & Honorare
│   │   ├── scheduling.ts       # Termin-Logik, Slot-Generierung, Pausenblocker, Auto-Planung
│   │   ├── dateFilters.ts      # Datumsbasierte Filterung
│   │   ├── invoiceUtils.ts     # Rechnungsnummer, Fälligkeit, Summen
│   │   ├── storage.ts          # SSR-sicherer localStorage-Access
│   │   ├── constants.ts        # Konstanten
│   │   └── __tests__/          # Lib-Tests
│   ├── types/                  # TypeScript Typdefinitionen
│   │   ├── index.ts            # Haupt-Typen inkl. ScheduleSettings, TimeSlot, BreakBlock
│   │   ├── dashboardTypes.ts   # Dashboard-spezifische Typen
│   │   └── __tests__/          # Typ-Tests
│   ├── global.d.ts             # Globale Typdefinitionen
│   └── next-env.d.ts           # Next.js Typen
├── jest.config.ts              # Jest-Konfiguration
├── tsconfig.jest.json          # TypeScript-Config für Tests
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## 📋 Wichtige Regeln

## Gruppentermine

### Was sind Gruppentermine?

Gruppentermine erlauben es, zwei Schüler für denselben Termin zu planen. Dies ist nützlich für:

- Partnerarbeit oder gemeinsame Lernsessions
- Kleingruppen-Unterricht
- Spezielle Förderprogramme

### Einrichtung

1. Gehe zur Schüler-Verwaltung
2. Wähle einen Schüler aus oder erstelle einen neuen
3. Scrolle zu „Bevorzugte Termine“
4. Klicke auf „Bevorzugten Termin hinzufügen“
5. Wähle Wochentag, Uhrzeit und Rhythmus
6. **Aktiviere die Checkbox „Gruppentermin“**
7. Wähle im Dropdown den Partner-Schüler aus
8. Klicke auf „Speichern“

### Funktionsweise

- **Automatische Planung**: Bei der Auto-Planung werden Gruppentermine automatisch erstellt, wenn beide Schüler denselben bevorzugten Termin haben
- **Dauer**: Die Dauer des Gruppentermins entspricht der längeren Dauer der beiden Schüler
- **Duplikat-Vermeidung**: Es wird kein neuer Termin erstellt, wenn bereits ein Gruppentermin für beide Schüler existiert
- **Inaktive Schüler**: Wenn der Partner-Schüler inaktiv ist, wird stattdessen ein individueller Termin erstellt
- **Kein Matching**: Wenn der Partner-Schüler keinen passenden bevorzugten Termin hat, wird ein individueller Termin erstellt

### UI-Kennzeichnung

- Gruppentermine werden **lila** gekennzeichnet
- Der Name des Partner-Schülers wird angezeigt
- In der Terminübersicht werden beide Schüler angezeigt

### Beispiele

#### Beispiel 1: Einfacher Gruppentermin

- Schüler A: Bevorzugter Termin Montag 14:00, Gruppentermin mit Schüler B
- Schüler B: Bevorzugter Termin Montag 14:00
- Ergebnis: Ein Gruppentermin mit beiden Schülern wird erstellt

#### Beispiel 2: Kein Matching

- Schüler A: Bevorzugter Termin Montag 14:00, Gruppentermin mit Schüler B
- Schüler B: Bevorzugter Termin Dienstag 14:00
- Ergebnis: Ein individueller Termin für Schüler A wird erstellt

#### Beispiel 3: Inaktiver Partner

- Schüler A: Bevorzugter Termin Montag 14:00, Gruppentermin mit Schüler B
- Schüler B: Inaktiv, Bevorzugter Termin Montag 14:00
- Ergebnis: Ein individueller Termin für Schüler A wird erstellt

#### Beispiel 4: Verschiedene Dauer

- Schüler A: Bevorzugter Termin Montag 14:00, Dauer 60 Minuten, Gruppentermin mit Schüler B
- Schüler B: Bevorzugter Termin Montag 14:00, Dauer 90 Minuten
- Ergebnis: Ein Gruppentermin mit 90 Minuten Dauer wird erstellt

### Wichtige Hinweise

- Gruppentermine werden nur erstellt, wenn **beide** Schüler denselben bevorzugten Termin haben (gleicher Wochentag und Uhrzeit)
- Die Checkbox „Gruppentermin“ muss nur bei einem der beiden Schüler aktiviert werden
- Der Partner-Schüler muss im Dropdown ausgewählt werden
- Das Dropdown ist filterbar – du kannst nach Name oder Familie suchen
- Bei der Abrechnung zahlen beide Schüler den Gruppenpreis (siehe Projekt-Regeln)

## Gruppenstunden
- Bei Gruppenstunden muss jeder Schüler den Gruppenpreis bezahlen (gilt immer für dieses Projekt)
- **Gruppentermine bei bevorzugten Terminen**:
  - Bevorzugte Termine können als Gruppentermine markiert werden
  - Partner-Schüler wird über filterbares Dropdown ausgewählt
  - Bei der Auto-Planung werden Gruppentermine mit beiden Schülern erstellt
  - Vermeidung von Duplikaten: Kein neuer Termin, wenn Gruppentermin bereits vorhanden
  - Dauer: Die längere Dauer der beiden Schüler wird verwendet

### Platzhalter-Slots (generateTimeSlots)
- **Zwischen Platzhaltern**: 10-Min-Pause (breakMinutes)
- **Letzter Slot vorm Blocker**: Keine Pause – Blocker trennt schon
- **Um echte Termine**: 10-Min-Padding (breakMinutes um belegte Blöcke)
- **Um Pausenblocker**: Kein extra Padding – Slots können direkt an die Pause grenzen
- **Mindest-Slot**: 30 Minuten

### Datenhaltung
- Alle Daten werden lokal im Browser gespeichert (localStorage)
- Export/Import-Funktionalität für Datensicherung verfügbar
- Pausenblocker werden nicht persistent gespeichert – aus ScheduleSettings abgeleitet

### Datum-Handling
- Immer lokale Zeitzone verwenden: `new Date(year, month, day)` statt `new Date('YYYY-MM-DD')`
- Vermeidet UTC-Offset-Bugs bei Sommer-/Winterzeit
- Sonntag = `day: 7` (ISO-8601), nicht `day: 0` (JS getDay())
