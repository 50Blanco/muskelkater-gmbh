# MUSKELKATER GMBH — AI Handoff

## Wichtig für neue Claude-Sessions

Immer zuerst diese Datei lesen.
Nicht den alten Chat-Kontext brauchen.
Nicht alles neu erklären lassen.
Nur relevante Dateien öffnen.
Kurze Reports liefern.

---

## Aktueller technischer Stand

* **Branch:** `master`
* **Letzter Commit:** `ebdd546` — `merge: Phase 8 — Social dashboard MVP`
* **Working tree:** clean
* **Gemergte Phasen:** 1 · 2 · 3 · 4 · 5 · 6 · 7A · 7C · 7B/7B1 · 8

---

## Gemergte Phasen

### Phase 1 — Foundation / Auth / DB / RLS

* Next.js App Router, TypeScript, Tailwind, Supabase Auth + Postgres
* Drizzle Schema und Migrationen
* RLS aktiv auf allen Tabellen
* App-Shell, Navigation

### Phase 2 — Onboarding + Plan-/Nutrition-Ziele + Safety

* 7-Step-Onboarding
* Nutzerprofil, Fitnessziel, Körperdaten, Nutrition-Target
* Initialer Trainingsplan, Workout-Days, Workout-Day-Exercises
* Habits, Daily-Missions, Safety-Modul
* Heute-Dashboard mit echten Daten

### Phase 3 — Trainingsplan-Ansicht

* `/training` — echte Plan-Detailseite
* Trainingstage, Übungen, Sets/Reps/Pausen, Technik-Hinweise
* Next-Workout-Logik

### Phase 4 — Workout-Session + Satztracking + eigene Übungen

* Workout starten: `/training/session/[dayId]`
* Satztracking, Gewicht/Reps speichern, Workout abschließen
* `workout_session`, `workout_set`, Übungsfeedback
* Eigene Übungen (Custom Exercises)
* Daily-Mission „Workout done"

### Phase 5 — Ernährung + Habits

* `/ernaehrung` — Nutrition-Ziele, Protein-Tageswert, Wasser Quick-Add
* Mahlzeiten abhaken, Ernährung-Mini-Card auf `/heute`
* Habits auf `/heute` abhaken
* Nutrition-Mission done, Habit-Mission done
* Berlin-Datum Helper, atomarer Wasser-Increment, partieller Upsert
* `npm run dev:clean` für Turbopack-Cache-Probleme

### Phase 6 — Branding MUSKELKATER GMBH

* Überall exakt `MUSKELKATER GMBH`
* Onboarding Schritt 7 Zusatzoption: `Ich bin Rachid` / `Training? - Was?`

### Phase 7A — Übungsbibliothek

* Alle Übungen kategorisiert nach Muskelgruppe/Gym/Zuhause/Equipment/Level
* Suche und Filter
* Custom Exercises sauber angebunden

### Phase 7C — Trainingstagebuch

* Sichtbares Workout-History-Tagebuch
* Vergangene Sessions, Sätze, Gewichte einsehbar

### Phase 7B / 7B1 — Plan-Editor MVP

* Übungen zu Trainingstagen hinzufügen (`52e0110`, Merge `943143a`)
* Übungen entfernen, ersetzen, Sets/Reps/Pausen anpassen (`08cfb63`, Merge `821f9fa`)
* Zod-Schemas, Ownership-Assertions, Server Actions
* ExerciseSearchPicker, ExerciseActions, ExerciseRow refactored
* Smoke-Script: `scripts/qa-phase7b-editor-smoke.ts` — 33 Tests

### Phase 8 — Social Dashboard MVP

* `social_group`, `social_group_member`, `social_reaction` + RLS (Migration `0003_silly_bushwacker.sql`)
* Server Actions: `createSocialGroup`, `joinSocialGroupByCode`, `reactToSocialEvent`
* Loader: `src/lib/social/get-social-dashboard.ts` (server-only)
* UI: `social-dashboard-card`, `create-group-form`, `join-group-form`, `social-feed`, `social-reaction-buttons`, `group-members`
* Fix `f816a04`: `groupId` aus try-Block korrekt zurückgegeben
* Smoke-Script: `scripts/qa-phase8-social-smoke.ts` — 34 Tests
* Merge-Commit: `ebdd546`

---

## Wichtige Commits

| Commit | Beschreibung |
|--------|-------------|
| `ebdd546` | merge: Phase 8 — Social dashboard MVP |
| `f816a04` | fix: finalize social group creation return |
| `ce7865b` | feat: add social dashboard MVP |
| `821f9fa` | merge: Phase 7B — Plan editor MVP |
| `08cfb63` | feat: add workout day exercise editing |
| `943143a` | merge: Phase 7B1 — Add exercises to workout days |
| `067a7c9` | merge: Phase 7C — Workout history in master |
| `0284e4e` | merge: Phase 7A — Exercise library in master |
| `5c56c28` | merge: Phase 5 — Nutrition and Habit Tracking |
| `01c3aff` | merge: Phase 4 — Workout-Session-Tracking |
| `cb8f85f` | feat: add training plan overview (Phase 3) |
| `332bb55` | feat: Phase 2 — Onboarding |
| `2533eb3` | feat: Phase 1 — Fundament |

---

## Was aktuell funktioniert

* Onboarding (7 Schritte, Safety, Plan-Generierung)
* Heute-Dashboard (Missions, Habits, Ernährung, Mini-Cards)
* Training: Trainingsplan ansehen, Workout starten/abschließen
* Trainingstagebuch: vergangene Sessions einsehen
* Übungsbibliothek: suchen, filtern, hinzufügen
* Eigene Übungen erstellen
* Übungen zu Trainingstag hinzufügen / entfernen / ersetzen / Sets-Reps anpassen
* Ernährung Basis: Protein, Wasser, Mahlzeiten
* Habits abhaken
* Social-Gruppe erstellen (Invite-Code wird generiert)
* Gruppe per Invite-Code beitreten
* Social Feed (letzte 7 Tage / 30 Events)
* Reaktionen (stark / weiter so / respekt) — Toggle

---

## Aktuelle Produktentscheidung

**Sehr wichtig — bitte für alle Planungen berücksichtigen.**

Die App soll **nicht nur** eine Trainings-App sein.

### Neue Produktthese

**MUSKELKATER GMBH wird primär eine soziale Accountability-App für kleine Gruppen / Familie / Freunde.**

* Social ist der **tägliche Rückkehrgrund**.
* Training, Ernährung und Habits liefern die **Signale**.
* Heute-Dashboard soll **Team-Status + eigenen Tag** zeigen.
* Fortschritt soll **persönliche und Team-Entwicklung** zeigen.
* Coach soll **persönliche und soziale nächste Schritte** empfehlen.
* Food-Photo-AI bleibt langfristig wichtig, aber noch **nicht jetzt**.

---

## Beobachtungen aus manuellem Test

* Fortschritt-Seite (`/fortschritt`) ist aktuell **Placeholder**
* Coach-Seite (`/coach`) ist aktuell **Placeholder**
* Social-Bereich funktioniert, ist aber **zu feed-lastig**
* Gruppenheader / Invite-Code nimmt **zu viel Raum** ein
* Es fehlt eine echte **Team-Mitglieder-Übersicht**
* Mitglieder sollten **klickbar** werden
* Pro Mitglied sollen **Tagesstatus und Wochenfortschritt** sichtbar werden
* Gewünschte Signale pro Mitglied:
  * Training heute ja/nein
  * Schritte (grob)
  * Ernährung grob
  * Habits / Missions
  * Motivation / Reaktionen
  * Wochenfortschritt

---

## Wichtige Produktregeln für Social

Diese Regeln gelten für alle zukünftigen Social-Features:

* Kein toxischer Vergleich
* Keine harten Leaderboards (zumindest nicht zuerst)
* Keine öffentlichen Profile
* Kein Chat (zumindest nicht zuerst)
* Keine sensiblen Körperdaten im Feed
* Kein Gewicht, Bauchumfang, Armumfang im Social-Default
* Keine Kalorien- / Protein-Details standardmäßig teilen
* **Privacy by default**
* Social soll **motivieren**, nicht beschämen

---

## Geplante nächste Themen — nur Planung, noch nicht bauen

### 1. Social Dashboard V2

* Kompakter Gruppenheader (Name + Invite-Code zusammengeklappt)
* Mitglieder-Statuskarten (Training heute, Habit, Mood)
* Feed nach unten verschieben (nicht mehr der erste Block)
* Support-Hinweise / Motivations-Nudges

### 2. Member Detail

* Klickbares Mitglied → eigene Seite / Drawer
* Wochenansicht: Trainingstage, Schritte, Ernährung grob, Streak/Momentum
* Reaktionen / Motivationsnachrichten an Mitglieder

### 3. Fortschritt-Seite

* Tab „Ich": eigene Konsistenz, Wochenverlauf, Trainingsverlauf
* Tab „Team": Team-Konsistenz, kein Körperdaten-Vergleich
* Keine sensiblen Team-Körperdaten sichtbar

### 4. Coach

* Persönlicher Coach: nächste Schritte für den Nutzer
* Sozialer Coach: Team-Hinweise, Motivation
* Wochen-Coach: Rückblick und Ausblick
* Erstmal regelbasiert — kein KI-Chat

### 5. Später

* Schritte: erst manuell, dann Wearable-Anbindung prüfen
* Ernährung sozial verbessern
* Food-Photo-AI vorbereiten
* Food-Photo-AI bauen

---

## Was ausdrücklich NICHT als nächstes gebaut werden soll

* Kein kompletter Chat
* Keine Community / öffentliche Profile
* Keine Leaderboards / Rankings
* Kein Food-AI sofort
* Kein generischer KI-Coach-Chat
* Kein Dashboard-Komplettumbau ohne Plan
* **Keine weitere Implementierung ohne vorherige Produktplanung und Nutzerfreigabe**

---

## Architekturregeln (unveränderlich)

* DB-Zugriffe ausschließlich serverseitig (`import "server-only"`)
* Mutationen über Server Actions (`"use server"`)
* Zod-Validierung für alle Eingaben
* `user_id` immer aus `auth.getUser()`, nie vom Client
* RLS aktiv auf allen Tabellen
* Service Role niemals im Client
* `.env.local` nie committen / ausgeben
* Keine `@/db`-Imports in Client-Komponenten
* Keine `.claude-plugin`-Dateien ändern
* Keine ECC-Konfiguration ändern
* Keine Secrets ausgeben

---

## Arbeitsweise (für Implementierungsphasen)

1. Neuen Branch erstellen
2. Kleinen Scope definieren
3. Keine späteren Features bauen
4. `npm run build`, `npm run lint`, `npx tsc --noEmit` ausführen
5. Alle relevanten Smoke-Scripts ausführen
6. QA-Report erstellen
7. Erst nach Nutzerfreigabe mergen

---

## Aktuelle Smoke-Scripts

```bash
npx tsx scripts/qa-phase2-smoke.ts
npx tsx scripts/qa-phase3-smoke.ts
npx tsx scripts/qa-phase4-smoke.ts
npx tsx scripts/qa-phase5-smoke.ts
npx tsx scripts/qa-phase7b1-smoke.ts
npx tsx scripts/qa-phase7b-editor-smoke.ts
npx tsx scripts/qa-phase8-social-smoke.ts
```

---

## Bekannte technische Schulden

* Turbopack Cache-Probleme: `npm run dev:clean`
* Workout-Session: kein Autosave, Sätze erst beim Abschluss
* Schritte noch nicht getrackt
* Fortschritt-Seite: Placeholder
* Coach-Seite: Placeholder
* Social V2: Mitglieder-Statuskarten fehlen noch

---

## Nächste Session soll so starten

**Die nächste Claude-Session soll zuerst `docs/AI_HANDOFF.md` lesen und danach im Planungsmodus arbeiten.**

Ziel der nächsten Session:
**Informationsarchitektur und Produktplan** für:

* `/heute` (Social Dashboard V2 + eigener Tag)
* Social Dashboard V2 (Mitglieder-Statuskarten)
* Member Detail (klickbare Mitglieder)
* `/fortschritt` (Ich-Tab + Team-Tab)
* `/coach` (regelbasiert, kein KI-Chat)

**Erst nach expliziter Freigabe durch den Nutzer darf wieder Code gebaut werden.**
