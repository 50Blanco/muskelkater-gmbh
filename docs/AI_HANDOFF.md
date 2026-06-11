# AI Handoff — MUSKELKATER GMBH

## Projekt

MUSKELKATER GMBH ist eine Fitness-Web-App mit Fokus auf:

* geführtes Training
* einfache Ernährung
* Gewohnheiten
* Alltagstauglichkeit
* mobile-first Dark-Premium-UI
* sichere Supabase/RLS-Architektur

## Aktueller Stand

master enthält Phase 1–5.

### Phase 1 — Fundament

* Next.js App Router
* TypeScript
* Tailwind
* Supabase Auth
* Supabase Postgres
* Drizzle Schema/Migrationen
* RLS
* App-Shell
* Navigation

### Phase 2 — Onboarding

* 7-Step-Onboarding
* Nutzerprofil
* Fitnessziel
* Körperdaten
* Nutrition-Target
* initialer Trainingsplan
* Workout-Days
* Workout-Day-Exercises
* Habits
* Daily-Missions
* Safety-Modul
* Heute-Dashboard mit echten Daten

### Phase 3 — Trainingsplan

* `/training`
* echte Plan-Detailseite
* Trainingstage
* Übungen
* Sets/Reps/Pausen
* Technik-Hinweise
* Next-Workout-Logik

### Phase 4 — Workout-Session

* Workout starten
* `/training/session/[dayId]`
* Satztracking
* Gewicht/Reps speichern
* Workout abschließen
* `workout_session`
* `workout_set`
* Übungsfeedback
* eigene Übungen
* Custom Exercise Support
* Daily-Mission Workout done

### Phase 5 — Ernährung & Habits

* `/ernaehrung`
* Nutrition-Ziele anzeigen
* Protein Tageswert speichern
* Wasser Quick-Add
* Mahlzeiten abhaken
* Ernährung-Mini-Card auf `/heute`
* Habits auf `/heute` abhaken
* Nutrition-Mission done
* Habit-Mission done
* Berlin-Datum Helper
* atomarer Wasser-Increment
* partieller Upsert
* `npm run dev:clean` für Turbopack-Cache-Probleme

## Aktuelle wichtige Commits

Stand: master nach Phase-5-Merge (`git log --oneline -10`).

```
5c56c28 merge: Phase 5 — Nutrition and Habit Tracking in master
d688e2e fix: stabilize workout session route
7fd9b25 feat: add nutrition and habit tracking
01c3aff merge: Phase 4 — Workout-Session-Tracking in master
7194a9b fix: harden workout session completion
7d8fbe3 feat: add workout session tracking
cb8f85f feat: add training plan overview
332bb55 feat: Phase 2 — Onboarding-Wizard und initiale Plan-/Ernährungsgenerierung
abbf553 feat: add onboarding and initial plan generation
2533eb3 feat: Phase 1 — Fundament (Auth, Shell, DB-Schema, RLS)
```

Schlüssel-Commits:

* Phase 5 Merge-Commit: `5c56c28`
* Phase 5 Stabilisierung: `d688e2e`
* Phase 5 Feature: `7fd9b25`
* Phase 4 Merge-Commit: `01c3aff`
* Phase 3 (Trainingsplan): `cb8f85f`
* Phase 2 (Onboarding): `332bb55`

## Architekturregeln

* DB-Zugriffe serverseitig
* Mutationen über Server Actions
* Zod-Validierung client-/serverseitig
* user_id immer aus Auth, nie vom Client
* RLS bleibt aktiv
* `.env.local` nie committen
* keine Service Role im Client
* keine DATABASE_URL im Client
* keine Secrets ausgeben
* keine `.claude-plugin`-Dateien ändern
* keine ECC-Konfiguration ändern

## Arbeitsweise

Jede neue Phase:

1. neuen Branch erstellen
2. kleinen Scope definieren
3. keine späteren Features bauen
4. Build/Lint/TSC ausführen
5. alle Smoke-Scripts ausführen
6. QA-Report erstellen
7. erst nach Freigabe mergen

## Aktuelle Smoke-Scripts

* `npx tsx scripts/qa-phase2-smoke.ts`
* `npx tsx scripts/qa-phase3-smoke.ts`
* `npx tsx scripts/qa-phase4-smoke.ts`
* `npx tsx scripts/qa-phase5-smoke.ts`

## Aktuelle bekannte technische Schulden

* Turbopack kann bei großen Änderungen Cache-Probleme machen → `npm run dev:clean`
* Workout-Session speichert Sätze erst beim Abschluss, kein Autosave
* Schritte werden noch nicht automatisch getrackt
* Social/Freunde/Gruppen noch nicht gebaut
* Übungsanimationen/Muskelgrafiken noch nicht gebaut
* Tresor noch nicht gebaut
* Fortschrittscharts noch nicht gebaut

## Nächste geplante Themen

Noch nicht bauen, erst planen:

1. Cleanup/Branding

* überall exakt `MUSKELKATER GMBH`
* Onboarding Schritt 7 Zusatzoption:

  * Label: `Ich bin Rachid`
  * Untertitel: `Training? - Was?`

2. Training-Ausbau

* Übungsbibliothek
* alle Übungen kategorisiert nach Muskelgruppe/Gym/Zuhause/Equipment/Level
* Übungen zu Trainingstagen hinzufügen
* Übungen aus Trainingstagen löschen
* Übungen ersetzen
* Custom Exercises sauber an Trainingstage anbinden
* sichtbares Trainingstagebuch
* Muskelgruppen-Anzeige pro Übung

3. Workout-Session UX

* animierte Übungsdetails
* Muskelgrafik
* Satz-Fortschritt besser sichtbar
* vergangene Gewichte/Reps anzeigen
* keine fremden GIFs/Bilder ohne Rechteklärung

4. Dashboard-Redesign

* `/heute` übersichtlicher machen
* klare Tagesstruktur
* Training, Ernährung, Habits, Fortschritt getrennt
* weniger chaotische Karten

5. Social/Gruppen

* Freunde/Familie
* Gruppen
* Einladungen
* wer hat heute trainiert
* Fortschritt teilen
* Datenschutz und RLS sehr streng planen

6. Schritte/Activity

* MVP: manuelle Schritteingabe
* später Wearables/Apple Health/Google Fit prüfen

7. Food Upload

* Mahlzeitenfoto hochladen
* Supabase Storage
* privat oder gruppensichtbar
* keine KI-Auswertung am Anfang

8. Tresor

* Menüpunkt `Tresor`
* Übungen
* Lebensmittel
* Supplements
* Wissen/Guides
* Kategorien
* Suche
* Filter

## Wichtig für neue Claude-Chats

Immer zuerst diese Datei lesen.
Nicht den alten Chat-Kontext brauchen.
Nicht alles neu erklären lassen.
Nur relevante Dateien öffnen.
Kurze Reports liefern.
