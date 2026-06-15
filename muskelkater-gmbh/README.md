# 🏋️ Muskelkater GmbH

Eine kleine, in sich geschlossene **Fitness-Tracker-Web-App** — gebaut als Lernprojekt mit [Claude Code](https://claude.com/claude-code).

> *Bist du Macher? Oder Schläfer?* 😴

## Funktionen

- 🎬 **Intro-Splash** mit Entscheidung: „Macher" rein, „Schläfer" raus
- ➕ **Pfeil-Steuerung** für Workouts (±1), Minuten (±30) und Kalorien (±100)
- 💾 **Speichern im Browser** (localStorage) — übersteht das Neuladen
- 📊 **Dashboard**: Heute- & Wochen-Zähler, Wochenziel mit Fortschrittsbalken
- 🎉 **Belohnungseffekt** (Konfetti) beim Erreichen des Wochenziels
- 🗑️ Einzelne Einträge löschen + ganzen Verlauf zurücksetzen
- ♿ **Barrierefrei**: echte Buttons, Aria-Labels, `prefers-reduced-motion`

## Technik

Eine einzige `index.html` — HTML, CSS und Vanilla-JavaScript in einer Datei, ganz ohne externe Abhängigkeiten. Das Logo ist als Data-URI eingebettet, die App läuft also überall durch einfaches Öffnen im Browser.

## Tests

Eine automatische Verifikation der App-Logik liegt unter `tests/`:

```bash
node tests/trace-verification.js
```

---

Gebaut mit 💪 von [@50Blanco](https://github.com/50Blanco)
