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
* **GitHub Remote:** `https://github.com/50Blanco/muskelkater-gmbh.git`
* **Phase 9 Merge-Commit:** `95bf2a4` — `merge: Phase 9 — Team challenge MVP`
* **Letzter Hygiene-Commit:** `7d0d92f` — `chore: ignore local claude config`
* **Working tree:** clean
* **Gemergte Phasen:** 1 · 2 · 3 · 4 · 5 · 6 · 7A · 7B/7B1 · 7C · 8 · **9**

---

## Produktthese

**MUSKELKATER GMBH ist eine private Team-/Community-Challenge-App mit Trainingshilfe.**

Training, Ernährung, Wasser, Habits und Schritte sind Signale für:
- Teamstatus
- Punkte
- Motivation
- Challenge-Fortschritt

**Der Hauptgrund, die App täglich zu öffnen:**
Team sehen → Challenge verfolgen → Punkte holen → Mitglieder motivieren → dranbleiben.

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

### Phase 7B / 7B1 — Plan-Editor MVP

* Übungen zu Trainingstagen hinzufügen (`52e0110`, Merge `943143a`)
* Übungen entfernen, ersetzen, Sets/Reps/Pausen anpassen (`08cfb63`, Merge `821f9fa`)
* Zod-Schemas, Ownership-Assertions, Server Actions
* ExerciseSearchPicker, ExerciseActions, ExerciseRow refactored
* Smoke-Script: `scripts/qa-phase7b-editor-smoke.ts` — 33 Tests

### Phase 7C — Trainingstagebuch

* Sichtbares Workout-History-Tagebuch
* Vergangene Sessions, Sätze, Gewichte einsehbar

### Phase 8 — Social Dashboard MVP

* `social_group`, `social_group_member`, `social_reaction` + RLS (Migration `0003_silly_bushwacker.sql`)
* Server Actions: `createSocialGroup`, `joinSocialGroupByCode`, `reactToSocialEvent`
* Loader: `src/lib/social/get-social-dashboard.ts` (server-only)
* UI: `social-feed`, `social-reaction-buttons`, `create-group-form`, `join-group-form`
* Smoke-Script: `scripts/qa-phase8-social-smoke.ts` — 34 Tests
* Merge-Commit: `ebdd546`

### Phase 9 — Team Challenge MVP

* **Neue Produktthese** — UI-Begriff durchgängig **„Team"** (DB: `social_group`).
* **Migration** `drizzle/0004_phase9_team_challenge_steps.sql` (additiv, live angewendet):
  * `team_challenge` — Membership-basierte RLS (SELECT/INSERT/UPDATE nur für Gruppenmitglieder)
  * `daily_step_log` — Owner-RLS (Nutzer sieht und schreibt nur eigene Einträge)
  * Enum `challenge_status`
* **Neue Routen:**
  * `/team` — Team-Zentrale: Mitgliederübersicht, Rangliste (ab 2 Mitgliedern), Challenge-Karte, Support-Hints, kompakter Feed
  * `/team/[memberId]` — Sicherer Wochenstatus pro Mitglied (keine sensiblen Körperdaten, Privacy by default)
* **`/heute` Social V2:** Challenge-Zusammenfassung, eigene Platzierung, offene Signale, Team-Statuskarten, kompakter Feed (ersetzt `SocialDashboardCard`/`GroupMembers`)
* **Navigation:** 7 Tabs — Heute · **Team** · Training · Ernährung · Fortschritt · Coach · Profil
* **Punktesystem** (aus vorhandenen Signalen, keine neuen Inputs):
  * Workout +30 · Schritte (Ziel 8.000) +20 · Ernährung +15 · Wasser +10 · Habit +10 (Cap 3) · Reaktion +5 (Cap 3)
  * Keine Punkte aus Gewicht / Maßen / Kalorien / Protein
* **Soft Ranking** — Rangliste zeigt Wochenpunkte, nur motivierend gemeint, kein toxischer Vergleich
* **Challenge** — Titel, Laufzeit, optionaler Einsatz-Text (Spaß, kein echtes Geld/Payment/Gambling)
* **Manuelle Schritte** — `updateMyDailySteps` Server Action, Zod-validiert, `daily_step_log` mit Unique-Constraint
* **1-Mitglied-Hinweis** — Banner mit Invite-Code, wenn Team nur einen Nutzer hat
* **Member-Verlaufsdiagramm** — CSS-Balkendiagramm (7 Tage), kein neues npm-Paket
* **Pure Logik:** `src/lib/social/challenge-scoring.ts` — Scoring, Soft-Leaderboard, Support-Hinweise, Challenge-Label, Privacy-Mapper
* **Server:** `team-queries.ts`, `get-team-dashboard.ts`, `get-team-member-detail.ts`, `get-heute-social-summary.ts`
* **Smoke-Script:** `scripts/qa-phase9-team-challenge-smoke.ts` — 28 Tests (nach finaler Bereinigung)
* **Merge-Commit:** `95bf2a4`

---

## Wichtige Commits

| Commit | Beschreibung |
|--------|-------------|
| `7d0d92f` | chore: ignore local claude config |
| `95bf2a4` | merge: Phase 9 — Team challenge MVP |
| `eb2eeed` | fix: improve team member progress UX |
| `00541f8` | fix: improve team page community UX |
| `88fdfd9` | fix: improve today team dashboard UX |
| `0d2cd23` | feat: add team challenge MVP |
| `ebdd546` | merge: Phase 8 — Social dashboard MVP |
| `821f9fa` | merge: Phase 7B — Plan editor MVP |
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
* Heute-Dashboard mit Social V2 (Team-Status, Challenge, offene Signale, Feed)
* Training: Trainingsplan ansehen, Workout starten/abschließen
* Trainingstagebuch: vergangene Sessions einsehen
* Übungsbibliothek: suchen, filtern, hinzufügen
* Eigene Übungen erstellen
* Übungen zu Trainingstag hinzufügen / entfernen / ersetzen / Sets-Reps anpassen
* Ernährung Basis: Protein, Wasser, Mahlzeiten
* Habits abhaken
* Team erstellen (Invite-Code), beitreten
* `/team` — Mitgliederübersicht, Rangliste, Challenge-Karte, Support-Hints, Feed
* `/team/[memberId]` — sicherer Wochenstatus, Summary-Stats, Balkendiagramm, Signale
* Team-Challenge starten (Titel, Laufzeit, optionaler Einsatz-Text)
* Manuelle Schritte auf `/team/[memberId]` eintragen
* Reaktionen (stark / weiter so / respekt) — Toggle

---

## Produktregeln (unveränderlich)

* **UI-Begriff:** „Team" — keine öffentliche „Community"
* Keine toxischen Leaderboards (Soft Ranking nur motivierend)
* Keine sensiblen Körperdaten im Team-Bereich (kein Gewicht, Umfänge, Kalorien, Protein)
* Health- und Safety-Daten bleiben privat
* Keine echte Wett-/Geld-/Payment-Logik — nur Einsatz-Text als Spaß-Feature
* Team-Challenge statt Wette
* Food-AI: später, nicht jetzt
* Coach: später, nicht jetzt
* Fortschritt-Seite als Hauptfeature: später, nicht jetzt

---

## Bekannte offene Punkte

* Mehrere Teams pro Nutzer — UI noch nicht gelöst (aktives Team = erste Gruppe)
* Challenge-Historie fehlt
* Individuelle Challenge-Ziele fehlen
* Motivation / Push-Actions vorbereitet, aber noch keine echten Social-Actions pro Mitglied
* Fortschritt-Seite (`/fortschritt`) — Placeholder
* Coach-Seite (`/coach`) — Placeholder
* Nutrition — Basis funktioniert; keine Food-Photo-AI
* Privacy- und Sichtbarkeits-Settings — noch nicht gebaut
* Schritte: manuell trackbar; keine Wearable-Anbindung

---

## Empfohlene nächste Phase

### Phase 10 — Team Experience V1

**Ziel:** Das Team-Erlebnis stärken, ohne große neue Systeme.

Mögliche Inhalte:
* Motivation senden klarer gestalten (z.B. dedizierter Push-Button)
* Schritte schneller auf `/heute` eintragen (Quick-Add-CTA)
* Team-/Challenge-Status noch deutlicher kommunizieren
* Member-Detail weiter abrunden
* Privacy-Grundregeln sichtbar vorbereiten (z.B. Info-Text im Member-Detail)
* Challenge CTA verbessern (leerer State, Countdown)

Nicht in Phase 10:
* kein Food-AI
* kein Coach
* keine Fortschritt-Seite als Hauptfeature
* kein Chat
* keine Kommentare

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
* Kein Gewicht/Maße/Kalorien/Protein in Social-Payload

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
npx tsx scripts/qa-phase9-team-challenge-smoke.ts
```

---

## Testergebnisse Phase 9

| Check | Ergebnis |
|-------|----------|
| `npm run build` | PASS |
| `npm run lint` | PASS |
| `npx tsc --noEmit` | PASS |
| Phase 8 Social Smoke | PASS (34 Tests) |
| Phase 9 Challenge Smoke | PASS (28 Tests) |
| Manueller Test `/heute` | PASS |
| Manueller Test `/team` | PASS |
| Manueller Test `/team/[memberId]` | PASS |
| Mobile ~390px | PASS |

---

## Bekannte technische Schulden

* Turbopack Cache-Probleme: `npm run dev:clean`
* Workout-Session: kein Autosave, Sätze erst beim Abschluss
* Schritte: manuell über `daily_step_log`; keine Wearables
* Fortschritt-Seite: Placeholder
* Coach-Seite: Placeholder
* Aktives Team = erste Gruppe des Nutzers (Mehrfach-Teams-UI offen)
* Mahlzeiten-Detail im Member-Detail: Häkchen-Zähler (kein Beschreibungsfeld im Schema)

---

## Nächste Session

**Die nächste Claude-Session soll zuerst `docs/AI_HANDOFF.md` lesen und danach im Planungsmodus arbeiten.**

**Erst nach expliziter Freigabe durch den Nutzer darf wieder Code gebaut werden.**
