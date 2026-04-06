# Buildchain für MatheManager

Diese Build-Struktur basiert auf dem Beispiel aus [ai-playground](https://github.com/goebelt/ai-playground) und ist für ein Next.js Projekt mit Tailwind CSS konfiguriert.

## 🏗️ Technologie Stack

| Kategorie | Technologie | Version |
|-----------|-------------|---------|
| **Framework** | Next.js | 14+ |
| **Styling** | Tailwind CSS | 3.x |
| **Build Tool** | Webpack (via Next.js) | - |
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

Output wird im `out/` Verzeichnis generiert (für Netlify Deployment).

## 🌐 Website ansehen

### Lokalt entwickeln

Während des Development-Mode:
- **Dev Server:** [http://localhost:3000](http://localhost:3000)
- **Hot Reload** ist aktiv - Änderungen werden automatisch neu geladen

### Live auf Netlify (Production)

Nach Deployment erscheint die Website unter deiner Netlify Domain, z.B.:
- `https://[deine-site-name].netlify.app`

Die URL wird automatisch aktualisiert, sobald ein neuer Build erfolgreich deployed wurde.

## 🔧 Build-Prozess im Detail

### Manuelles Build ausführen

```bash
# Production Build mit Optimierung
npm run build

# Watch-Mode: Änderungen überwachen und automatisch rebuilden
npm run watch
```

### Build-Ausgaben

| Umgebung | Output-Pfad | Verwendung |
|----------|-------------|------------|
| Development | `src/` + `node_modules/` | Lokales Entwickeln |
| **Production** | `out/` (oder `dist/MatheManager/`) | Deployment zu Netlify |

### CI/CD Pipeline (GitHub Actions)

Der Workflow in `.github/workflows/deploy.yml` führt automatisch aus:

```
Push zur main Branch → Installieren → Build verifizieren → Deploy zu Netlify ✓
```

**Schritte:**
1. **Checkout Repository** - Code herunterladen
2. **Node.js Setup** - Node 18 + npm Caching
3. **Dependencies installieren** - `npm install`
4. **Build-Verifikation** - `npm run build` (Fehler melden)
5. **Netlify Deploy** - `netlify deploy --prod --dir=out/`

## 🧪 Laufende Tests (Optional)

Wenn du Unit-Tests möchtest, kannst du ein Test-Framework hinzufügen:

```bash
# Beispiel: Jest für Node.js Tests
npm install -D jest @types/jest ts-jest
```

### Tests ausführen

```bash
# Unit-Tests mit Jest
npm test
```

## 📁 Projektstruktur

```
MatheManager/
├── buildchain/                    # Build-Konfiguration und CI/CD
│   ├── README.md                  # Diese Dokumentation
│   ├── package.json               # Dependencies und Scripts
│   ├── next.config.js             # Next.js Konfiguration
│   ├── tailwind.config.js         # Tailwind CSS Setup
│   ├── tsconfig.json             # TypeScript Konfiguration
│   └── .github/workflows/
│       └── deploy.yml            # GitHub Actions CI/CD Pipeline
├── src/                           # Quellcode
│   ├── app/                       # Next.js App Router
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
   - Deployt den `out/` Inhalt zu Netlify
   - Aktualisiert live Website URL automatisch

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

*Last Updated: 2026-04-01 | Next.js 14+ | TypeScript 5.2+ | Tailwind CSS 3.x | Netlify Deployment | Last Build: TBD*