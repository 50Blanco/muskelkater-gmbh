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
* **Production URL:** `https://muskelkater-gmbh.vercel.app`
* **Phase 13 Merge-Commit:** `0ba5521` — `merge: Phase 13 — Privacy and profile settings`
* **Phase 12 Merge-Commit:** `91d4122` — `merge: Phase 12 — Challenge experience V2`
* **Phase 11 Merge-Commit:** `10e6263` — `merge: Phase 11 — Progress and weekly body check-in`
* **Phase 10 Merge-Commit:** `76b0f40` — `merge: Phase 10 — Team experience V1`
* **Phase 9 Merge-Commit:** `95bf2a4` — `merge: Phase 9 — Team challenge MVP`
* **Working tree:** clean (untracked `.vscode/`, `muskelkater-gmbh/` — werden nicht committed)
* **Gemergte Phasen:** 1 · 2 · 3 · 4 · 5 · 6 · 7A · 7B/7B1 · 7C · 8 · 9 · 10 · 11 · 12 · **13**
* **master auf GitHub:** aktuell (`git push` erledigt)

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

### Phase 10 — Team Experience V1

* **Schritte Quick-Add auf `/heute`** — `StepsInput` direkt im Social-V2-Block sichtbar; kein Umweg mehr über `/team/[memberId]`
  * `HeuteSocialSummary` um `todaySteps: number | null` + `todayDate: string` erweitert
  * `getHeuteSocialSummary` lädt `daily_step_log` parallel zur Team-Abfrage
* **ChallengeCard verbessert** (`/team`):
  * Leer-State: Icon + Headline + Beschreibung statt einzeiliger grauer Text
  * Aktiver State: prominenter Countdown-Pill + visueller Fortschrittsbalken (Tage vergangen / total)
* **Motivation Push-Button** (`/team/[memberId]`):
  * Echter `SocialReactionButtons`-Block statt Platzhalter-Link zum Team-Feed
  * Neuer DB-Enum-Wert `member_week` (additiv) — Reaktionen zählen im Scoring normal als `reactionsSent`
  * `MemberDetailData` um `groupId: string` + `motivationReactions: ReactionCounts` erweitert
* **Migration** `phase10_add_member_week_target_type` (`ALTER TYPE social_target_type ADD VALUE IF NOT EXISTS 'member_week'`) — live in Supabase Production angewendet; keine RLS-Änderungen
* **Drizzle-Schema + Zod-Validation** um `"member_week"` erweitert
* **`social-feed.tsx` + `get-social-dashboard.ts`** für `member_week` ergänzt (Icon: Heart, Text: „hat Motivation gesendet")
* **Smoke-Script:** `scripts/qa-phase10-ux-smoke.ts` — 17 Tests PASS
* **Merge-Commit:** `76b0f40`

### Phase 12 — Challenge Experience V2

* **Challenge-Detailseite** `/team/challenges/[challengeId]` — server-only, membership-gated (Defense-in-Depth: direkter DB-Membership-Check + RLS):
  * Status-Pill (Aktiv / Abgeschlossen), Countdown (verbleibende Tage), Datum-Range, optionaler Einsatz-Text
  * Eigene Punkte dieser Woche
  * Rangliste (`TeamLeaderboard`)
  * Gewinner-Banner für beendete Challenges — „Unentschieden" bei Gleichstand; keine toxische Sprache
  * „Heute noch Punkte holen"-Karte (nur bei aktiver Challenge) — offene Signale mit Punktewerten + Wochen-Check-in
* **Gewinner-Logik:** `determineChallengeWinner()` in `challenge-scoring.ts` — pure function, kein DB, unit-testbar
  * `WinnerResult`: `{ isTie: boolean, winner: { userId, displayName, score } | null }`
  * Gleichstand → `isTie: true`, kein Sieger — niemals „Verlierer"-Markierung
* **Challenge-Geschichte** auf `/team` — kompakte Liste vergangener (abgeschlossener/abgebrochener) Challenges mit Link zur Detailseite:
  * `getChallengeHistory()` in `team-queries.ts` via `ne(status, "active")`
  * `ChallengeHistory` + `ChallengeBadge` Komponenten
  * Parallel zu `getActiveChallenge` in `getTeamDashboard` geladen
* **„Challenge ansehen" CTA** auf `/team` Challenge-Card — direkter Link zur Detailseite
* **„ansehen →" Link** auf `/heute` Challenge-Block — inline, kein UI-Bruch
* **Challenge-Vorlagen** im Create-Formular — 5 statische Presets (kein DB-Aufwand):
  * „7 Tage Neustart", „30 Tage durchziehen", „Schritte-Woche", „Training & Check-in", „Team-Konstanz"
  * `applyTemplate()` füllt Titel + Enddatum + optionalen Einsatz-Text vor
* **Keine Migration** — alle benötigten Spalten (`id`, `groupId`, `title`, `stakeText`, `startsOn`, `endsOn`, `status`) waren bereits in `teamChallenge` vorhanden
* **Privacy:** kein `bodyMetrics`, kein `bodyMeasurement`, keine Körperwerte in einem Challenge-Payload; `checkinOpenThisWeek` ist boolean
* **Smoke-Script:** `scripts/qa-phase12-challenge-experience.ts` — 28 Tests PASS
* **Merge-Commit:** `91d4122`
* **Production live:** `https://muskelkater-gmbh.vercel.app`

### Phase 11 — Progress V1 + Weekly Body Check-in

* **Neue DB-Tabelle `weekly_body_checkin`** — speichert ausschließlich den Completion-Status (keine Messwerte):
  * `id`, `user_id`, `week_date` (ISO-Montag), `completed_at`
  * `UNIQUE(user_id, week_date)` — ein Check-in pro Nutzer pro Woche
  * RLS owner-only Policy `weekly_body_checkin_owner` — in Production verifiziert via Supabase MCP
* **Migration** `drizzle/0005_phase11_weekly_body_checkin.sql`:
  * Enthält auch `ALTER TYPE social_target_type ADD VALUE 'member_week'` (Phase 10 Enum, erstmals in Migrationsdatei festgehalten)
  * Journal-Eintrag `idx: 5` + Snapshot `0005_snapshot.json` — atomar via `drizzle-kit generate`
* **`/fortschritt` V1 — echte Seite statt Placeholder:**
  * Gewichtsverlauf (pure SVG Polyline, `WeightChart`)
  * Bauchumfang + Armumfang als Sparklines (`MeasurementSparkline`, pure SVG)
  * Workout-Streak als CSS-Balkendiagramm (`WorkoutBarChart`, Tailwind-Heights)
  * Loader: `src/lib/body/get-body-progress.ts` (server-only, RLS-geschützt)
* **Check-in-Card auf `/heute`** — immer sichtbar, Sonntag hervorgehoben:
  * Zeigt Status dieser Woche (erledigt / noch offen)
  * Inline-Formular: Gewicht (kg), Bauchumfang (cm), Armumfang (cm) — alle optional, mind. 1 Wert
  * Server Action `submitBodyCheckin()` in `src/app/(app)/heute/actions.ts`
  * Schreibt in `bodyMetrics` + `bodyMeasurement` + `weeklyBodyCheckin` atomar
* **Scoring:** `bodyCheckin: 50` als neuer `POINTS`-Key in `challenge-scoring.ts`
  * Bonus-only (+50 Punkte einmalig pro Woche) — kein Malus, kein Body-Shaming
  * `loadMemberWeeklySignals()` in `team-queries.ts` liest `weeklyBodyCheckin`; kein Zugriff auf `bodyMetrics`/`bodyMeasurement`
* **Team-Layer:** `weeklyCheckinDone: boolean` fließt durch:
  * `MemberWeeklySignals` → `TeamMemberCard` → `HeuteMemberStatus` → `MemberStatusPills`
  * Team sieht nur ✓ / ○ — niemals Messwerte
  * `getHeuteSocialSummary` lädt eigenen Check-in-Status parallel (`checkinDoneThisWeek: boolean`)
* **Privacy:** `bodyMetrics` + `bodyMeasurement` haben Owner-only-RLS; kein Import dieser Tabellen in Social/Team-Loader (verifiziert per `grep`)
* **Zod v4 Fix:** `invalid_type_error` aus `z.number()` Optionen entfernt (breaking change in Zod v4)
* **`getWeekMondayIso()`** in `src/lib/utils/date.ts` — UTC-stabiler ISO-Montag-Helper, Sunday-Edge-Case korrekt (`jsDay === 0 ? 6 : jsDay - 1`)
* **Smoke-Script:** `scripts/qa-phase11-body-checkin.ts` — 28 Tests PASS
* **Merge-Commit:** `10e6263`
* **Production live:** `https://muskelkater-gmbh.vercel.app`

### Phase 13 — Privacy & Profile Settings

* **Neue DB-Tabelle `user_privacy_settings`** — 7 feingranulare Toggle-Felder:
  * `show_training`, `show_steps`, `show_nutrition`, `show_water`, `show_habits`, `show_weekly_checkin_status`, `show_in_ranking`
  * Alle default `true` (opt-out statt opt-in)
  * `UNIQUE(user_id)` — ein Eintrag pro Nutzer
  * RLS owner-only Policy `user_privacy_settings_owner` — in Production verifiziert
* **Migration** `drizzle/0006_phase13_privacy_settings.sql`:
  * Erstellt Tabelle, aktiviert RLS, fügt FK-Constraint und Owner-Policy hinzu
  * Journal-Eintrag `idx: 6` + Snapshot `0006_snapshot.json` — via `drizzle-kit generate`
  * In Supabase Production angewendet via MCP (`apply_migration`)
* **Privacy-Designprinzipien (unveränderlich):**
  * Körperdaten (Gewicht, Bauchumfang, Armumfang, Body-Fat, Safety) immer privat — kein Toggle nötig/möglich
  * Scoring/Punkte immer aus vollen ungemaskten Signalen berechnet (intern, fair)
  * Masking nur auf Display-Layer (Team-Ansichten) angewendet — Scores bleiben korrekt
  * `show_in_ranking = false`: Nutzer erscheint als „Privat" in anderen; eigene Ansicht immer unmaskiert
  * Gewinner-Bestimmung immer aus `rawLeaderboard` (real, nicht maskiert)
  * Eigenes Profil (`isCurrentUser` / `isOwnProfile`) wird niemals maskiert
* **Neue Dateien:**
  * `src/lib/social/get-user-privacy.ts` — `getUserPrivacy(userId)` + `getManyUserPrivacy(userIds[])`, `DEFAULT_PRIVACY` (alle `true`), `server-only`
  * `src/lib/validation/profile.ts` — `updateDisplayNameSchema`, `updateFitnessGoalSchema`, `updatePrivacySettingsSchema`, `GOAL_TYPE_LABELS`
  * `src/app/(app)/profil/actions.ts` — Server Actions: `updateDisplayName`, `updateFitnessGoal`, `updatePrivacySettings` (upsert mit `onConflictDoUpdate`)
  * `src/app/(app)/profil/profile-form.tsx` — Client Component: Display Name + Fitnessziel (useActionState)
  * `src/app/(app)/profil/privacy-settings-form.tsx` — Client Component: 7 Toggle-Schalter mit `useOptimistic` + `useTransition`
* **Modifizierte Dateien:**
  * `src/db/schema.ts` — `userPrivacySettings` Tabelle nach `fitnessGoal`
  * `src/lib/social/challenge-scoring.ts` — `applyPrivacyMask()` + `applyRankingPrivacy()` + `TeamPrivacySettings` Interface
  * `src/lib/social/get-team-dashboard.ts` — lädt `privacyMap` parallel; maskiert Status und Check-in; Leaderboard via `applyRankingPrivacy`
  * `src/lib/social/get-team-member-detail.ts` — lädt `targetPrivacy`; maskiert per-Signal-Felder in `week[]` und `today`; `weeklyCheckinDone` gated
  * `src/lib/social/get-challenge-detail.ts` — lädt `privacyMap` parallel; `rawLeaderboard` für Gewinner; `leaderboard` gemaskiert
* **`/profil` neu:** 3 Cards — Konto (Email, Logout), Mein Profil (DisplayName-Editor, Fitnessziel-Picker), Datenschutz & Sichtbarkeit (7 Privacy-Toggles)
* **Zod v4:** Alle Schemas nutzen `.issues[0]?.message` (nicht `.errors`) — konsistent mit vorherigen Phasen
* **Smoke-Script:** `scripts/qa-phase13-privacy-profile.ts` — 35 Tests PASS
* **Merge-Commit:** `0ba5521`
* **Production live:** `https://muskelkater-gmbh.vercel.app`

---

## Wichtige Commits

| Commit | Beschreibung |
|--------|-------------|
| `0ba5521` | merge: Phase 13 — Privacy and profile settings |
| `af49e82` | feat: add phase 13 privacy and profile settings |
| `91d4122` | merge: Phase 12 — Challenge experience V2 |
| `3864f0d` | feat: add phase 12 challenge experience |
| `10e6263` | merge: Phase 11 — Progress and weekly body check-in |
| `fd5cd79` | chore: track phase 11 weekly checkin migration |
| `6f3a08a` | feat: Phase 11 — Progress V1 + Weekly Body Check-in |
| `76b0f40` | merge: Phase 10 — Team experience V1 |
| `dfca2ec` | docs: update handoff after phase 10 |
| `57ce31b` | feat: Phase 10 — Team Experience V1 |
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
* Wöchentlicher Body-Check-in auf `/heute` (Gewicht, Bauchumfang, Armumfang — privat)
* `/fortschritt` — echte Seite: Gewichtsverlauf, Umfangs-Sparklines, Workout-Balkendiagramm
* Training: Trainingsplan ansehen, Workout starten/abschließen
* Trainingstagebuch: vergangene Sessions einsehen
* Übungsbibliothek: suchen, filtern, hinzufügen
* Eigene Übungen erstellen
* Übungen zu Trainingstag hinzufügen / entfernen / ersetzen / Sets-Reps anpassen
* Ernährung Basis: Protein, Wasser, Mahlzeiten
* Habits abhaken
* Team erstellen (Invite-Code), beitreten
* `/team` — Mitgliederübersicht, Rangliste, Challenge-Karte, Support-Hints, Feed
* `/team/[memberId]` — sicherer Wochenstatus, Summary-Stats, Balkendiagramm, Signale, Check-in-Pill
* Team-Challenge starten (Titel, Laufzeit, optionaler Einsatz-Text)
* Manuelle Schritte auf `/heute` eintragen
* Reaktionen (stark / weiter so / respekt) — Toggle
* `/team/challenges/[challengeId]` — Challenge-Detailseite (Rangliste, Countdown, Gewinner, offene Signale)
* Challenge-Vorlagen im Create-Formular (5 statische Presets)
* Challenge-History auf `/team` (vergangene Challenges mit Link)
* „Challenge ansehen" CTA auf `/team` und `/heute`
* `/profil` — Display Name bearbeiten, Fitnessziel wählen, 7 Privacy-Toggles
* Privacy-Layer: Team sieht nur freigegebene Signale; Scoring intern immer vollständig; Ranking-Anonymisierung

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
* Body Check-in: Bonus-only (+50), kein Malus, kein Body-Shaming
* Privacy: Scoring-Fairness — Punkte immer aus vollen Signalen; Masking nur auf Display-Layer

---

## Bekannte offene Punkte

* Mehrere Teams pro Nutzer — UI noch nicht gelöst (aktives Team = erste Gruppe)
* Individuelle Challenge-Ziele fehlen
* Coach-Seite (`/coach`) — Placeholder
* Nutrition — Basis funktioniert; keine Food-Photo-AI
* Schritte: manuell trackbar; keine Wearable-Anbindung
* `/fortschritt` — Streak-Anzeige (Wochen in Folge) noch nicht gebaut

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
npx tsx scripts/qa-phase10-ux-smoke.ts
npx tsx scripts/qa-phase11-body-checkin.ts
npx tsx scripts/qa-phase12-challenge-experience.ts
npx tsx scripts/qa-phase13-privacy-profile.ts
```

---

## Testergebnisse Phase 13

| Check | Ergebnis |
|-------|----------|
| `npm run build` | PASS (20 Routen, inkl. `/profil` Dynamic) |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS (pre-existing Fehler in `muskelkater-gmbh/tests/trace-verification.js` unverändert) |
| Phase 13 Privacy/Profile Smoke | PASS (35 Tests) |
| Phase 12 Challenge Smoke | PASS (28 Tests) |
| Phase 11 Body Check-in Smoke | PASS (28 Tests) |
| Vercel Production Deploy | PASS (`dpl_7Gna9fKXHczgUk6Vi4oczoVfKCrv`) |
| Live-Check `/login` | PASS (Login-Seite lädt korrekt) |
| Live-Check `/heute` (Redirect) | PASS (Redirect zu Login für unauthentifizierte Nutzer) |
| Manueller Browser-Test | PASS (Privacy-Toggles, Display Name, Fitnessziel, Masking im Team) |

## Testergebnisse Phase 12

| Check | Ergebnis |
|-------|----------|
| `npm run build` | PASS (20 Routen, inkl. `/team/challenges/[challengeId]`) |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS (pre-existing Fehler in `muskelkater-gmbh/tests/trace-verification.js` unverändert) |
| Phase 12 Challenge Smoke | PASS (28 Tests) |
| Phase 11 Body Check-in Smoke | PASS (28 Tests) |
| Phase 10 UX Smoke | PASS (17 Tests) |
| Vercel Production Deploy | PASS (`dpl_27k3BLhdtUoYveF2L4YMn4uKpp1R`) |
| Live-Check `/login` | PASS (200) |
| Live-Check `/heute` (Redirect) | PASS (307) |
| Live-Check `/team` (Redirect) | PASS (307) |
| Manueller Browser-Test | PASS (Challenge-Detailseite, Historie, CTAs, Vorlagen, Mobile ~390px) |

## Testergebnisse Phase 11

| Check | Ergebnis |
|-------|----------|
| `npm run build` | PASS (19 Routen) |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| Phase 11 Body Check-in Smoke | PASS (28 Tests) |
| Phase 10 UX Smoke | PASS (17 Tests) |
| Vercel Production Deploy | PASS (`dpl_3dMThZJk9LK7adoy3yJ6SaG8c5WU`) |
| Live-Check `/login` | PASS |
| Live-Check `/heute` (Redirect) | PASS |
| Live-Check `/team` (Redirect) | PASS |

## Testergebnisse Phase 10

| Check | Ergebnis |
|-------|----------|
| `npm run build` | PASS |
| `npx tsc --noEmit` | PASS |
| Phase 10 UX Smoke | PASS (17 Tests) |
| Lint (pre-existing errors in legacy trace-verification.js) | unverändert |

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
* Coach-Seite: Placeholder
* Aktives Team = erste Gruppe des Nutzers (Mehrfach-Teams-UI offen)
* Mahlzeiten-Detail im Member-Detail: Häkchen-Zähler (kein Beschreibungsfeld im Schema)

---

## Nächste Session

**Die nächste Claude-Session soll zuerst `docs/AI_HANDOFF.md` lesen und danach im Planungsmodus arbeiten.**

**Erst nach expliziter Freigabe durch den Nutzer darf wieder Code gebaut werden.**

**Kandidaten für Phase 14:**
* Fortschritt-Streak (Wochen in Folge Check-in erledigt) — fehlte noch in Phase 11
* Mehrere Teams pro Nutzer — UI lösen
* Coach-Seite Basis
* Individuelle Challenge-Ziele (nur für den eigenen Nutzer sichtbar)
