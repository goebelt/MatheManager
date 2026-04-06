# Buildchain für MatheManager

Diese Build-Struktur basiert auf dem Beispiel aus [ai-playground](https://github.com/goebelt/ai-playground) und ist für ein Next.js Projekt mit Tailwind CSS konfiguriert.

## 🏗️ Technologie Stack

| Kategorie | Technologie | Version |
|-----------|-------------|---------|
| **Framework** | Next.js | 14+ |
| **Styling** | Tailwind CSS | 3.x |
| **Build Tool** | Vite / Webpack (via Next.js) | - |
| **TypeScript** | TypeScript | 5.0+ |

## 📋 Voraussetzungen

- **Node.js 18+** ([Download](https://nodejs.org/))
- **npm 9+** (inklusive mit Node.js)
- Git CLI

## 🚀 Quick Start

### Installation & Setup

```bash
# In das Projektverzeichnis wechseln
cd MatheManager

# Abhängigkeiten installieren
npm install

# Optional: Linter und Entwicklungstools installieren
npm install -D eslint prettier @types/node typescript
```

### Development Server

```bash
# Entwicklungsserver starten mit Hot Reload
npm start
```

Dann öffne [http://localhost:3000](http://localhost:3000) in deinem Browser.

### Build für Production

```bash
# Produktionsbuild erstellen
npm run build
```

Output wird im `out/` oder `dist/MatheManager/` Verzeichnis generiert.

## 🧪 Laufende Tests (Optional)

Wenn du Unit-Tests möchtest, kannst du eine Test-Framework-Konfiguration hinzufügen:

```bash
# Beispiel: Jest für Node.js Tests
npm install -D jest @types/jest ts-jest
```

### Test ausführen

```bash
# Unit-Tests mit Jest
npm test
```

## 📁 Projektstruktur

```
MatheManager/
├── buildchain/                    # Build-Konfiguration und CI/CD
│   ├── README.md                  # Diese Datei
│   ├── package.json               # Dependencies und Scripts
│   ├── next.config.js             # Next.js Konfiguration
│   └── .github/workflows/         # GitHub Actions CI/CD Pipelines
│       └── deploy.yml            # Build-Verifikation & Netlify Deployment
├── src/                           # Quellcode
│   ├── app/                       # Next.js App Router oder Pages
│   │   ├── components/           # UI-Komponenten
│   │   ├── pages/                # Seiten (falls Pages Router)
│   │   └── styles/               # Globale Styles
│   └── types/                     # TypeScript Typen
├── tailwind.config.js             # Tailwind CSS Konfiguration
└── tsconfig.json                 # TypeScript Konfiguration
```

## 🛠️ Available Scripts

| Kommando | Beschreibung |
|----------|-------------|
| `npm start` | Start Development Server (Hot Reload) |
| `npm run build` | Build für Production |
| `npm run watch` | Änderungen überwachen und automatisch rebuilden |
| `npm test` | Unit-Tests ausführen (optional) |

## 🌐 Deployment

### Automatisiertes Deployment mit Netlify

Die Konfiguration unterstützt automatisches Deployment zu Netlify bei jedem Push zur `main` Branch:

1. **Build-Verifikation** (bei jedem Push)
   - Installiert Abhängigkeiten
   - Führt Produktionsbuild aus
   - Meldet Fehler sofort

2. **Deployment** (wenn Build erfolgreich ist)
   - Deployt den build-output zu Netlify
   - Aktualisiert live Website URL

### Manuelles Deployment

```bash
# Optional: Netlify CLI installieren
npm install -g netlify-cli

# Zu Netlify deployen
netlify deploy --prod --dir=out/
```

## 🔧 Konfigurationsdateien

| Datei | Zweck |
|-------|-------|
| `package.json` | Dependencies und npm-Skripte |
| `next.config.js` | Next.js Workspace-Konfiguration |
| `tailwind.config.js` | Tailwind CSS Styling-Konfiguration |
| `.github/workflows/deploy.yml` | Build-Verifikation GitHub Actions Workflow |

---

**Made with ❤️ basierend auf dem Beispiel von [ai-playground](https://github.com/goebelt/ai-playground)**

*Last Updated: 2026-04-01 | Next.js 14+ | TypeScript 5.2+ | Tailwind CSS 3.x*