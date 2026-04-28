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
| **P1** | `lib/scheduling`, `lib/dateFilters`, `lib/invoiceUtils` | 49 | Termin-Logik, Slot-Generierung, Pausenblocker, Datumsfilter, Rechnungsutils |
| **P3** | `components/*` | 70 | UI-Rendering: InvoiceTemplate, AppointmentCard (Zeitanzeige), DayView, Navigation |
| | **Gesamt** | **169** | |

```bash
npm test              # Alle Tests
npm run test:watch    # Watch-Modus
npm run test:coverage # Mit Coverage-Report
```

### Test-Architektur
- **Business-Logik** ist in `src/lib/` Module extrahiert → reine Funktionen, keine React-Mocks nötig
- **UI-Tests** nutzen `@testing-library/react` mit jsdom-Umgebung
- **Datum-Handling** verwendet immer lokale Zeitzone (`new Date(y,m,d)`) um UTC-Offset-Bugs zu vermeiden
- **Scheduling-Tests** decken ab: Slot-Generierung, Pausenlogik, Mittagsblocker, Auto-Planung, Inaktiv-Überspringung, Zeit-Konvertierung

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

### Gruppenstunden
- Bei Gruppenstunden muss jeder Schüler den Gruppenpreis bezahlen (gilt immer für dieses Projekt)

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
