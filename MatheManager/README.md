# MatheManager 📚

**Ihre persönliche Nachhilfe-Verwaltung für Familien, Schüler und Termine.**

Eine statische Next.js Web-App zur Verwaltung Ihrer Mathe-Nachhilfe-Aktivitäten mit localStorage als Datenspeicher.

---

## ✨ Features

### 🏠 Startseite
- **Landing Page** - Übersichtliche Präsentation des Projekts
- **Navigation** - Schneller Zugriff auf alle Funktionen

### 👨‍👩‍👧‍👦 Familien & Schüler Management
- **Familien erstellen** - Mehrere Schüler pro Familie verwalten
- **Schüler hinzufügen** - Name, Vorname, Notizen, Standard-Dauer (60/90 Min), Rhythmus (wöchentlich/zweiwöchentlich)
- **Suche & Filter** - Schnelle Suche über Namen
- **Pagination** - Große Listen übersichtlich paginiert (10 pro Seite)
- **Bearbeiten** - Alle Daten editierbar
- **Löschen** - Familien und Schüler sicher entfernen

### 💰 Preishistorie & Abrechnung
- **Preise versionieren** - Preise über Zeiträume verwalten mit `validFrom` / `validTo`
- **Individuelle Preise** - Für Einzelunterricht
- **Gruppenpreise** - Max. 2 Schüler teilen sich einen Preis
- **Automatische Übergänge** - Beim Hinzufügen eines neuen Preises wird das alte automatisch abgelaufen markiert
- **Preis-Vorschau** - Aktuelle Preise live berechnen

### 📊 Übersichten
- **Statistik-Karten** - Anzahl Familien, Schüler, 90-Minuten-Termine
- **Farbliches Design** - Tailwind CSS mit grünen/blauen/lila Akzenten

---

## 🛠️ Tech Stack

| Technologie | Beschreibung |
|------------|-------------|
| **Next.js 15+** | App Router, Server Components |
| **React 19+** | UI-Framework |
| **TypeScript** | Typsicherheit |
| **Tailwind CSS** | Styling mit Lucide Icons |
| **localStorage** | SSR-sicherer Datenspeicher |

---

## 🚀 Installation & Start

### Dependencies installieren
```bash
npm install
```

### Entwicklungsserver starten
```bash
npm run dev
```

Öffnen Sie dann **http://localhost:3000** in Ihrem Browser.

> **Hinweis:** Da Next.js SSR (Server-Side Rendering) verwendet, muss localStorage im Browser verfügbar sein. F5 drücken, um Änderungen zu sehen.

---

## 📋 Datenmodell

### Family
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | string | Einzigartiger Identifier |
| `name` | string | Familienname |
| `address` | string? | Optional: Wohnadresse |
| `email` | string? | Optional: Kontakt-E-Mail |
| `phone` | string? | Optional: Telefonnummer |

### Student
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | string | Einzigartiger Identifier |
| `familyId` | string | Referenz zur Familie |
| `firstName` | string | Vorname des Schülers |
| `lastName` | string? | Nachname (optional) |
| `notes` | string? | Notizen zum Schüler |
| `defaultDuration` | number | 60 oder 90 Minuten |
| `rhythm` | 'weekly' \| 'biweekly' | Termin-Rhythmus |

### PriceEntry
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | string | Einzigartiger Identifier |
| `studentId` | string | Referenz zum Schüler |
| `type` | 'individual' \| 'group' | Preis-Typ |
| `amount` | number | Preis in Euro |
| `validFrom` | string (ISO) | Gültig ab diesem Datum/Zeit |
| `validTo` | string? (ISO) | Gültig bis, null = aktuell |

---

## 💡 Preishistorie-Logik

### Beispiel: Preisänderung über Zeit

**Schüler "Max" - Preisverlauf:**

```
Datum       | Preis  | Typ        | validFrom    | validTo     | Status
------------|--------|------------|--------------|-------------|---------
2026-04-01  | 25.00 €| individual | heute        | null        | ✅ Aktiv
2026-04-02  | 30.00 €| individual | morgen       | gestern     | ❌ Abgelaufen
```

### Regeln beim Hinzufügen eines Preises:

1. **Aktiver Preis existiert?** → `validTo` auf heute setzen
2. **Neuer Preis:** `validFrom = today`, `validTo = old_price.id`
3. **Kein aktiver Preis?** → Einfach hinzufügen, `validTo = null`

### Gruppenpreis (max. 2 Schüler):
- Preis ist pro Kurs, nicht pro Schüler
- Bei 2 Schülern teilen sie sich den Preis

---

## 🎨 Design & UX

- **Dark Mode Ready** - Automatisch an System-Einstellungen angepasst
- **Lucide Icons** - Moderne, konsistente Icon-Bibliothek
- **Responsive** - Funktioniert auf Desktop und Tablet
- **Shadcn/UI Stil** - Sauber, mathematisch-schlichtes Design

---

## 🔧 Konfiguration

### Tailwind Colors (tailwind.config.ts)
```typescript
colors: {
  primary: {
    50: '#f0fdf4',   // Helles Grün
    100: '#dcfce7',
    // ... bis zu 700+
  },
}
```

---

## 📦 Daten exportieren/importieren

Alle Änderungen werden automatisch im localStorage gespeichert. Für eine vollständige Backup-Funktion können `exportAsJSON()` und `importFromJSON()` aus `src/lib/storage.ts` genutzt werden.

---

## 🤝 Open Source

Dieses Projekt ist als **Open Source** auf GitHub verfügbar:
- **Repository:** https://github.com/goebelt/MatheManager
- **Forken & anpassen:** Frei für eigene Bedürfnisse modifizieren

---

## 📄 Lizenz

MIT License - fühlen Sie sich frei, diesen Code zu verwenden und anzupassen.

---

**Made with ❤️ using Next.js + Tailwind CSS + Lucide Icons**