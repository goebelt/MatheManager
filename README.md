# MatheManager

**[🌐 Live Demo](https://mathe-manager.netlify.app/)**

Next.js App zur Verwaltung von Mathe-Nachhilfe mit Tailwind CSS. Verwalten Sie Familien, Schüler, Termine und Preise – alles in einer übersichtlichen Oberfläche.

## 🎯 Features

### Dashboard
- **Wochenübersicht** mit automatischen Terminvorschlägen basierend auf Schüler-Rhythmus (wöchentlich / zweiwöchentlich)
- Status-Bediener für jeden Termin: Stattgefunden, Ausfall bezahlt, Ausfall frei
- **Gruppenunterricht**: Bis zu 2 Schüler pro Termin

### Abrechnung
- **Automatische Honorarberechnung** basierend auf Preis-Einträgen und gültigen Zeiträumen
- Filterbare Übersichten nach Zeitraum und Schüler/Familie
- Aufteilung in Einzelstunden vs. Gruppenstunden

### Rechnungen (Neu!)
- Professionelle Druckvorlage mit Firmenkopfzeile
- Auswahl der Familie und Wunschzeitraum
- Automatische Rechnungsnummer Generierung (`YYYY-MM-ID`)
- Drucken per `window.print()` – optimiert für A4 Ausgabe
- **Einstellungen** um eigene Firmendaten einzugeben (Name, Adresse, Steuernummer)

### Preissystem
- Flexible Preiseinträge mit Start-/Enddatum
- Individuelle Preisgestaltung pro Schüler/Familie

## 📸 Screenshots

| Funktion | Beschreibung |
|----------|-------------|
| **Dashboard** | Wochenübersicht mit Terminvorschlägen |
| **Abrechnung** | Honorarberechnung und Filterung |
| **Rechnungen** | Professioneller Druckausgabe |

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
| **Next.js 13+** | React Framework mit App Router |
| **TypeScript** | Typsichere Entwicklung |
| **Tailwind CSS** | Utility-first CSS Framework |
| **lucide-react** | Moderne Icon-Bibliothek |

## 📁 Projektstruktur

```
MatheManager/
├── src/
│   ├── app/                  # Next.js App Router Pages
│   │   ├── dashboard/        # Dashboard mit Terminübersicht
│   │   ├── billing/          # Abrechnungs-Übersicht & Honorarberechnung
│   │   ├── invoices/         # Rechnungsgenerator (Neu!)
│   │   ├── settings/         # Firmeninformationen für Rechnungen
│   │   ├── families/         # Familienverwaltung
│   │   └── layout.tsx        # App-Layout mit Navigation
│   ├── components/           # Reusable UI-Komponenten
│   │   ├── AppointmentCard.tsx    # Termin-Karte
│   │   ├── DashboardHeader.tsx    # Header mit Wochen-Navigation
│   │   ├── WeekView.tsx     # Woche-Ansicht mit Vorschlägen
│   │   └── InvoiceTemplate.tsx  # Professionelle Druckvorlage (Neu!)
│   ├── lib/                  # Utility-Module
│   │   ├── billing.ts       # Preisberechnung & Honorare
│   │   ├── storage.ts        # SSR-sicherer localStorage-Acces