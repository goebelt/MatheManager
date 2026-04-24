# MatheManager

**[🌐 Live Demo](https://mathe-manager.netlify.app/)**

Next.js App zur Verwaltung von Mathe-Nachhilfe mit Tailwind CSS. Verwalten Sie Familien, Schüler, Termine und Preise – alles in einer übersichtlichen Oberfläche.

## 🎯 Features

### Dashboard
- **Wochenübersicht** mit automatischen Terminvorschlägen basierend auf Schüler-Rhythmus (wöchentlich / zweiwöchentlich)
- Status-Bediener für jeden Termin: Stattgefunden, Ausfall bezahlt, Ausfall frei
- **Gruppenunterricht**: Bis zu 2 Schüler pro Termin

### Termine
- Verwaltung aller Nachhilfestunden
- Klickbare Termin-Karten zum Bearbeiten
- Lösch-Button mit Konfliktvermeidung

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

### Familien
- Verwaltung von Familien
- Zentrale Verwaltung für mehrere Schüler

### Einstellungen
- Firmeninformationen für Rechnungen
- Rechnungsnummer-Verwaltung

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
| **P1** | `lib/scheduling`, `lib/dateFilters`, `lib/invoiceUtils` | 56 | Termin-Logik, Datumsfilter, Rechnungsutils |
| **P3** | `components/*` | 47 | UI-Rendering: InvoiceTemplate, AppointmentCard, DayView, Navigation |
| | **Gesamt** | **153** | |

```bash
npm test              # Alle Tests
npm run test:watch    # Watch-Modus
npm run test:coverage # Mit Coverage-Report
```

### Test-Architektur

- **Business-Logik** ist in `src/lib/` Module extrahiert → reine Funktionen, keine React-Mocks nötig
- **UI-Tests** nutzen `@testing-library/react` mit jsdom-Umgebung
- **Datum-Handling** verwendet immer lokale Zeitzone (`new Date(y,m,d)`) um UTC-Offset-Bugs zu vermeiden

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
│   │   ├── appointments/       # Terminverwaltung
│   │   ├── billing/            # Abrechnungs-Übersicht & Honorarberechnung
│   │   ├── invoices/           # Rechnungsgenerator
│   │   ├── prices/             # Preisverwaltung
│   │   ├── students/           # Schülerverwaltung
│   │   ├── families/           # Familienverwaltung
│   │   ├── settings/           # Firmeninformationen für Rechnungen
│   │   ├── layout.tsx          # App-Layout mit Navigation
│   │   └── globals.css         # Globale Styles
│   ├── components/             # Reusable UI-Komponenten
│   │   ├── AppointmentCard.tsx # Termin-Karte mit Status-Controls
│   │   ├── DashboardHeader.tsx # Header mit Wochen-Navigation
│   │   ├── DayView.tsx         # Tagesansicht für Termine
│   │   ├── WeekView.tsx        # Wochenansicht mit Vorschlägen
│   │   ├── InvoiceTemplate.tsx # Professionelle Druckvorlage
│   │   ├── Navigation.tsx      # Navigationsleiste
│   │   └── __tests__/          # P3 Component-Tests (47)
│   ├── lib/                    # Utility-Module (Business-Logik)
│   │   ├── billing.ts          # Preisberechnung & Honorare
│   │   ├── scheduling.ts       # Termin-Logik & Auto-Planung
│   │   ├── dateFilters.ts      # Datumsbasierte Filterung
│   │   ├── invoiceUtils.ts     # Rechnungsnummer, Fälligkeit, Summen
│   │   ├── storage.ts          # SSR-sicherer localStorage-Access
│   │   ├── constants.ts        # Konstanten
│   │   └── __tests__/          # P0+P1 Lib-Tests (106)
│   ├── types/                  # TypeScript Typdefinitionen
│   │   ├── index.ts            # Haupt-Typen (Family, Student, Appointment, …)
│   │   ├── dashboardTypes.ts   # Dashboard-spezifische Typen
│   │   └── __tests__/          # Typ-Tests (4)
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

### Datenhaltung
- Alle Daten werden lokal im Browser gespeichert (localStorage)
- Export/Import-Funktionalität für Datensicherung verfügbar

### Datum-Handling
- Immer lokale Zeitzone verwenden: `new Date(year, month, day)` statt `new Date('YYYY-MM-DD')`
- Vermeidet UTC-Offset-Bugs bei Sommer-/Winterzeit
