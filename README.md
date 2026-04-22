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
- Automatische Rechnungsnummer Generierung (`YYYY-MM-ID`)
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

## 📸 Screenshots

| Funktion | Beschreibung |
|----------|-------------|
| **Dashboard** | Wochenübersicht mit Terminvorschlägen |
| **Termine** | Verwaltung aller Nachhilfestunden |
| **Abrechnung** | Honorarberechnung und Filterung |
| **Rechnungen** | Professioneller Druckausgabe |
| **Preise** | Flexible Preisverwaltung |
| **Schüler** | Schülerübersicht und -verwaltung |
| **Familien** | Familienverwaltung |
| **Einstellungen** | Firmendaten und Konfiguration |

## 🚀 Installation & Start

```bash
# Projekt installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Das App-Interface ist in deutscher Sprache optimiert und nutzt Tailwind CSS für das gesamte Styling.

## 🛠️ Technologie-Stack

| Technologie | Beschreibung |
|-------------|-------------|
| **Next.js 15** | React Framework mit App Router |
| **React 19** | UI-Bibliothek |
| **TypeScript** | Typsichere Entwicklung |
| **Tailwind CSS** | Utility-first CSS Framework |
| **lucide-react** | Moderne Icon-Bibliothek |
| **@heroicons/react** | Zusätzliche Icon-Bibliothek |

## 📁 Projektstruktur

```
MatheManager/
├── src/
│   ├── app/                  # Next.js App Router Pages
│   │   ├── page.tsx          # Startseite
│   │   ├── dashboard/        # Dashboard mit Terminübersicht
│   │   ├── appointments/     # Terminverwaltung
│   │   ├── billing/          # Abrechnungs-Übersicht & Honorarberechnung
│   │   ├── invoices/         # Rechnungsgenerator
│   │   ├── prices/           # Preisverwaltung
│   │   ├── students/         # Schülerverwaltung
│   │   ├── families/         # Familienverwaltung
│   │   ├── settings/         # Firmeninformationen für Rechnungen
│   │   ├── layout.tsx        # App-Layout mit Navigation
│   │   └── globals.css       # Globale Styles
│   ├── components/           # Reusable UI-Komponenten
│   │   ├── AppointmentCard.tsx    # Termin-Karte
│   │   ├── DashboardHeader.tsx    # Header mit Wochen-Navigation
│   │   ├── WeekView.tsx          # Woche-Ansicht mit Vorschlägen
│   │   ├── InvoiceTemplate.tsx   # Professionelle Druckvorlage
│   │   └── Navigation.tsx        # Navigationsleiste
│   ├── lib/                  # Utility-Module
│   │   ├── billing.ts            # Preisberechnung & Honorare
│   │   ├── storage.ts            # SSR-sicherer localStorage-Access
│   │   └── constants.ts          # Konstanten
│   ├── types/                 # TypeScript Typdefinitionen
│   │   ├── index.ts              # Haupt-Typen
│   │   ├── dashboardTypes.ts     # Dashboard-spezifische Typen
│   │   └── css.d.ts              # CSS Module Typen
│   ├── global.d.ts           # Globale Typdefinitionen
│   └── next-env.d.ts         # Next.js Typen
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