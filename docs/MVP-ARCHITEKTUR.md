# Muskelkater-GmbH — Fitness-App · Technischer MVP-Plan (Schritt 1)

> Status: Architektur & Entscheidungsgrundlage. **Noch kein App-Code.**
> Datum: 2026-06-11 · Plattform: Web-App zuerst · Login: ja · Coach: regelbasiert (ohne KI-API)

---

## 1. Empfohlener Tech-Stack

| Ebene | Wahl | Kurzbegründung |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React 19 + TypeScript** | Schneller MVP, Server Components, ein Stack für UI + API, beste DX |
| Styling | **Tailwind CSS v4 + shadcn/ui (radix)** | Schnell, konsistent, voll anpassbar — kein "Template-Look", Dark Mode nativ |
| Auth + DB | **Supabase (Postgres + Auth + Row Level Security)** | Login out-of-the-box, echte Postgres-Persistenz, Security per RLS, gratis Start |
| ORM / Query | **Supabase JS Client + Drizzle ORM (typisierte Schemas/Migrationen)** | Typsicheres Schema + saubere Migrationen, SQL bleibt transparent |
| Server-State | **TanStack Query** | Caching, Stale-while-revalidate, optimistische Updates (Sätze tracken) |
| Client-State | **Zustand** (nur für laufende Workout-Session) | Minimaler lokaler State, kein Overkill |
| Forms | **React Hook Form + Zod** | Performant, Validierung client + server geteilt |
| Validierung | **Zod** (eine Schema-Quelle) | Boundary-Validierung, geteilte Typen Front/Back |
| Charts | **Recharts** (Gewicht/Umfänge/Verlauf) | Leichtgewichtig, Dark-Mode-fähig |
| Hosting | **Vercel** (App) + **Supabase Cloud** (DB/Auth) | Null-Config-Deploy, Preview-URLs |
| Coach | **Eigenes TS-Modul `lib/coach` (pure Functions)** | Regelbasiert, testbar, später durch KI ersetzbar |

### Warum diese Kombination
- **Schneller MVP:** Next.js + Supabase + shadcn = Auth, DB und UI in Tagen statt Wochen.
- **Spätere Mobile-App:** Die Business-Logik (Coach-Engine, Zod-Schemas, Plan-Generator) liegt in **framework-unabhängigen TS-Modulen** → bei einer späteren **Expo / React-Native**-App wiederverwendbar; Supabase Auth/DB bleibt identisch.
- **Erweiterbarkeit:** Echte KI später = nur das Coach-Modul tauschen. Payment später = Supabase + Stripe-Webhook andocken.
- **Sicherheit:** RLS erzwingt auf DB-Ebene, dass jeder Nutzer nur eigene Daten sieht — selbst bei Bug im Frontend.

---

## 2. Architektur

### Frontend
- **App Router** mit Route-Groups: `(auth)`, `(onboarding)`, `(app)`.
- **Server Components** für Daten-Reads (schnell, weniger Client-JS), **Client Components** nur wo Interaktion nötig (Workout-Tracking, Forms, Charts).
- Geteiltes **App-Shell-Layout** mit Bottom-Tab-Navigation (mobile-first) + Top-Bar.

### Backend / API
- Primär **Server Actions** (mutations: Workout speichern, Mahlzeit abhaken, Onboarding) — typsicher, kein separates API-Boilerplate.
- **Route Handlers** (`app/api/*`) nur wo nötig (z. B. Coach-Tagesberechnung als Endpoint, später Webhooks).
- Datenzugriff gekapselt in `server/queries` (reads) und `server/actions` (writes) — nie direkt aus Komponenten.

### Auth
- **Supabase Auth** (E-Mail/Passwort im MVP, OAuth später trivial nachrüstbar).
- **Middleware** (`middleware.ts`) schützt `(app)`- und `(onboarding)`-Routen; nicht eingeloggt → `/login`.
- Onboarding-Gate: Profil unvollständig → Redirect nach `/onboarding`.

### Datenbank
- **PostgreSQL via Supabase.** Schema per Drizzle-Migrationen versioniert.
- **RLS auf jeder Tabelle:** `user_id = auth.uid()`.

### State-Management
| Concern | Tooling |
|---|---|
| Server-Daten | TanStack Query (+ Server Components) |
| Laufende Workout-Session | Zustand (lokal, persistiert in localStorage gegen Reload-Verlust) |
| URL-State | Tabs/Datum/Filter in Search-Params |
| Forms | React Hook Form |

### Validierung & Sicherheit
- **Zod-Schemas** in `lib/validation` — geteilt zwischen Form und Server Action.
- Server Action validiert **immer erneut** (nie Client-Input trauen).
- RLS + Auth-Check in jeder Action.
- Sicherheits-/Gesundheitslogik als eigenes Modul `lib/safety` (siehe §10).

### Ordnerstruktur → siehe §11

---

## 3. Datenmodelle (MVP-tauglich, nicht überkomplex)

> Konvention: `id uuid pk`, `user_id uuid fk → auth.users`, `created_at`, `updated_at`. Alle Tabellen mit RLS.

### User / Profil
- **user_profile** — `user_id`, `display_name`, `birth_date` (→ Alter), `sex`, `height_cm`, `experience_level` (`beginner|intermediate|advanced`), `training_location` (`gym|home|both`), `available_days` (int[] / jsonb), `minutes_per_session`, `onboarding_completed_at`
- **fitness_goal** — `user_id`, `goal_type` (`lose_fat|build_muscle|get_fit|strength|maintain`), `target_weight_kg?`, `weekly_sessions_target`, `notes?`, `active` (bool)

### Körperdaten
- **body_metrics** (Zeitreihe Gewicht) — `user_id`, `measured_on` (date), `weight_kg`, `body_fat_pct?`, `note?`
- **body_measurement** (Umfänge, flexibel) — `user_id`, `measured_on`, `type` (`waist|arm|chest|hip|thigh|...`), `value_cm`
  *(ein Typ-Feld statt vieler Spalten → "optional weitere Körpermaße" ohne Schema-Änderung)*

### Training
- **workout_plan** — `user_id`, `name`, `goal_type`, `days_per_week`, `location`, `active` (bool), `generated_by` (`rules`), `start_date`
- **workout_day** — `plan_id`, `day_index` (1..n), `title` (z. B. "Push", "Ganzkörper A"), `focus`, `est_minutes`
- **exercise** — *globaler Übungskatalog (seed)*: `name`, `muscle_group`, `equipment`, `location` (`gym|home|both`), `level`, `is_compound`, `instructions`, `media_url?`
- **workout_day_exercise** (Plan-Zuordnung) — `workout_day_id`, `exercise_id`, `order`, `target_sets`, `target_reps`, `target_rest_sec`
- **workout_session** — `user_id`, `workout_day_id?`, `started_at`, `completed_at?`, `status` (`active|completed|skipped`), `duration_min?`, `perceived_effort?` (RPE 1–10), `soreness?`, `mood?`
- **workout_set** — `session_id`, `exercise_id`, `set_number`, `weight_kg?`, `reps?`, `completed` (bool)

### Ernährung
- **nutrition_target** — `user_id`, `calories_kcal`, `protein_g`, `water_ml`, `active`, `calculated_from` (jsonb: Eingaben der Berechnung)
- **daily_nutrition_log** — `user_id`, `log_date` (date, unique mit user), `calories_kcal?`, `protein_g?`, `water_ml`, `meals_status` (jsonb: z. B. `{breakfast:true,lunch:false,...}`)

### Gewohnheiten
- **habit** — `user_id`, `name`, `icon`, `cadence` (`daily|weekly`), `target_per_period`, `active`
- **daily_habit_log** — `habit_id`, `user_id`, `log_date`, `completed` (bool)

### Coach / Tagesführung
- **daily_mission** — `user_id`, `mission_date`, `type` (`workout|nutrition|habit|recovery`), `title`, `description`, `status` (`open|done|skipped`), `source_ref?` (z. B. workout_day_id)
- **coach_recommendation** — `user_id`, `created_for_date`, `trigger` (enum, siehe §8), `severity` (`info|warning|critical`), `message`, `action_label?`, `action_ref?`, `dismissed` (bool)

**Beziehungen (Kurzform):**
`user → user_profile (1:1)`, `user → fitness_goal (1:n, 1 aktiv)`, `user → workout_plan (1:n) → workout_day (1:n) → workout_day_exercise (n:1 exercise)`, `user → workout_session → workout_set`, `user → nutrition_target / daily_nutrition_log`, `user → habit → daily_habit_log`, `user → daily_mission / coach_recommendation`.

---

## 4. Screen-Struktur (priorisiert)

| Screen | Bereich | MVP | Inhalt |
|---|---|---|---|
| Login / Registrieren | Auth | **P0** | E-Mail/Passwort |
| Onboarding (3–5 Steps) | Onboarding | **P0** | Ziel, Alter/Größe/Gewicht, Level, Ort, Tage, Zeit → erzeugt Plan + Ziele |
| **Heute / Dashboard** | Kern | **P0** | Heutige Mission, Workout-CTA, Ernährungs-Ringe, Coach-Hinweis, Habits |
| Training (Plan-Übersicht) | Training | **P0** | Wochenplan, Tage, "Workout starten" |
| Workout-Session | Training | **P0** | Übungen, Sätze tracken (Gewicht/Reps), Timer, abschließen |
| Ernährung | Ernährung | **P1** | Kalorien/Protein/Wasser, Mahlzeiten abhaken |
| Fortschritt | Fortschritt | **P1** | Gewichtskurve, Umfänge, abgeschl. Workouts, Streaks |
| Coach | Coach | **P1** | Liste der Empfehlungen, Tagescheck-Antworten (müde/Schmerz/Zeit) |
| Profil / Einstellungen | Profil | **P1** | Profil bearbeiten, Ziel ändern, Plan neu generieren, Logout |

→ **V1-Reihenfolge:** Auth → Onboarding → Heute → Training → Workout-Session, dann Ernährung/Habits, dann Fortschritt, dann Coach-Detailscreen.

---

## 5. User Journey (Kernablauf)

1. **Registrieren** → Account via Supabase Auth.
2. **Onboarding** (geführt, ein Schritt pro Frage): Ziel → Körperdaten → Level → Ort → Tage → Zeit.
3. **App generiert** regelbasiert: `workout_plan` (+ Tage/Übungen aus Katalog gefiltert nach Ort/Level/Tagen/Zeit) und `nutrition_target` (Kalorien/Protein/Wasser aus Mifflin-St Jeor + Aktivität + Zielanpassung in **sicheren Grenzen**, §10).
4. **Heute-Screen**: zeigt die eine sinnvolle Mission ("Heute: Push, ~45 Min") + Ernährungsringe + Coach-Hinweis.
5. **Workout starten**: Session läuft, Sätze werden getrackt (Gewicht/Reps, Häkchen), Rest-Timer.
6. **Workout abschließen**: optional RPE/Muskelkater/Stimmung → speichert `workout_session` + Sätze.
7. **Fortschritt**: nach Eintrag sieht Nutzer Kurven & erledigte Workouts; Streaks motivieren.
8. **Coach-Empfehlung**: Engine wertet die letzten Tage aus und liefert kurze, klare Hinweise (z. B. "2 Tage Muskelkater — heute leichter / Mobility").

---

## 6. Regelbasierter Coach (ohne KI-API)

**Prinzip:** Pure-Function-Engine. Input = aggregierter `CoachContext` (Sessions, Logs, Habits, Tagescheck-Antworten). Output = priorisierte Liste kurzer `CoachRecommendation`.

```
evaluateCoach(context) -> Recommendation[]   // sortiert nach severity/priority
```

| Trigger | Bedingung (Beispiel) | Empfehlung (kurz) | Severity |
|---|---|---|---|
| `low_time` | Tagescheck "wenig Zeit" | "Kurzversion: 3 Hauptübungen, ~20 Min." | info |
| `tired` | Tagescheck "müde" | "Heute leichter trainieren oder aktive Erholung." | info |
| `soreness` | letzte Session `soreness ≥ hoch` / Muskelkater gemeldet | "Muskelgruppe schonen, Mobility statt schwer." | info |
| `missed_workout` | geplanter Tag ohne Session | "Kein Stress — Plan flexibel angepasst, leg jetzt los." | info |
| `protein_low` | `protein_g < target` (mehrere Tage) | "Protein-Ziel knapp — +1 proteinreiche Mahlzeit." | info |
| `water_low` | `water_ml < target` | "Wasser dran denken — noch X ml heute." | info |
| `streak_win` | ≥3 Workouts in Woche / Streak | "Stark! 3 Workouts diese Woche durchgezogen." | info |
| `plateau` | Gewicht/Last über X Wochen unverändert (bei Ziel) | "Stagnation: kleine Progression oder Kalorien justieren." | info |
| `poor_recovery` | hohe RPE + Schlaf/Müdigkeit über Tage | "Erholung priorisieren — 1 Tag mehr Pause." | warning |
| `safety_symptom` | Schmerz/Schwindel/Brustschmerz/Atemnot im Tagescheck | "Training abbrechen. Bei anhaltenden Symptomen ärztl. abklären." | **critical** |

- Empfehlungen sind **kurz, klar, nicht bestrafend** (Adhärenz > Härte — passt zur WHO-/Adhärenz-Evidenz im Forschungsrahmen).
- `critical` überschreibt alles und blockiert ggf. den Workout-Start-CTA.

---

## 7. MVP-Priorisierung

**P0 — sofort**
- Auth (Login/Register) + Middleware-Schutz + RLS
- Onboarding → Profil + Ziel speichern
- Regelbasierter Plan-Generator + Übungskatalog (Seed)
- Heute-Dashboard
- Trainingsplan-Ansicht
- Workout-Session + Satz-Tracking + Speichern

**P1 — wichtig, nach Grundfunktion**
- Ernährung (Ziele + Mahlzeiten/Wasser abhaken)
- Gewohnheiten (Habit-Tracking)
- Fortschritt (Gewicht, Umfänge, Charts, Streaks)
- Coach-Detailscreen + Tagescheck + Empfehlungs-Engine
- Plan neu generieren / Ziel ändern

**P2 — später**
- OAuth-Login, Push/Reminder, Übungs-Videos, Plan-Adaption auf Basis der Historie, Export, Mehrsprachigkeit, echte KI im Coach

**Bewusst NICHT gebaut:** Payment, Premium-System, Community, Social Feed, Wearables, Barcode-Scanner, Marketplace, Live-Coaching, komplexe Challenges, Supplement-Shop.

---

## 8. Design-System

**Richtung:** Dark Luxury / sportlich-premium. Dark Mode = Standard. Rot **sparsam** und nur für Energie/primäre Aktionen — nie flächig.

### Farben (Tokens)
```css
:root {
  /* Flächen */
  --bg:            #0A0A0B;   /* Schwarz */
  --surface:       #141518;   /* Anthrazit */
  --surface-2:     #1C1E22;   /* erhöhte Karte */
  --border:        #2A2D33;

  /* Text / Silber */
  --text:          #F4F5F7;   /* primär */
  --text-muted:    #A7ACB5;   /* sekundär (Silber) */
  --text-dim:      #6E737C;

  /* Akzent Rot — energisch, nicht billig (kontrolliert, leicht entsättigt) */
  --accent:        #E0223A;   /* oklch(~58% 0.20 22) */
  --accent-hover:  #F23048;
  --accent-soft:   rgba(224, 34, 58, 0.12);

  /* Status */
  --success:       #34C759;
  --warning:       #FFB020;
  --danger:        #E0223A;

  --radius:        14px;
  --radius-sm:     10px;
}
```

### Typografie
- **Display/Headings:** „Geist" oder „Space Grotesk" — kräftig, leicht enges Tracking, sportlich.
- **Body/UI:** „Inter".
- Skala: `--text-hero clamp(2rem,1.2rem+3vw,3.25rem)`, klare Größenkontraste für Hierarchie.

### Komponenten
- **Buttons:** Primär = Rot (Verlauf erlaubt, dezent), Sekundär = Anthrazit-Outline, Ghost. Deutliche `hover/focus/active`-States.
- **Cards/Kacheln:** `--surface-2`, weiche Schatten, `--radius`, dünne `--border`. Bento-artige Dashboard-Kacheln (unterschiedliche Größen → Hierarchie).
- **Progress Bars / Ringe:** Ernährung als Ringe (Kalorien/Protein/Wasser), Rot/Silber-Akzent.
- **Badges:** Streaks, Level, "erledigt" — kompakt, Silber/Rot.
- **Navigation:** Mobile = Bottom-Tab (Heute/Training/Ernährung/Fortschritt/Profil). Desktop = schmale Sidebar.

### Anti-Template
Klare Scale-Kontraste, Bento-Dashboard, gezielte Tiefe (Layering/Schatten), Rot nur als Energie-Akzent → wirkt wie ein Produkt, nicht wie ein Gym-Template.

---

## 9. Sicherheitsregeln (Gesundheit) — `lib/safety`

- **Keine medizinischen Diagnosen.** App gibt keine Diagnose/Therapie.
- **Keine extremen Diäten / gefährlichen Defizite:** Kalorienziel mit hartem Floor (z. B. nicht < ~1500 kcal ♂ / ~1200 kcal ♀ und max. ~20–25 % Defizit), Gewichtsverlust-Empfehlung gedeckelt (~0,5–1 % KG/Woche).
- **Warnhinweise** bei: Schmerzen, Schwindel, **Brustschmerzen, Atemnot** → sofortiger Stopp-Hinweis.
- **Eskalation:** bei ernsthaften/anhaltenden Symptomen → "Bitte Arzt/Physio aufsuchen". Brustschmerz/Atemnot = Notfall-Hinweis.
- **Anfänger nicht überfordern:** Volumen/Intensität level-abhängig, sanfte Progression.
- **Regeneration:** mind. Pausentage berücksichtigen, Muskelkater/Müdigkeit fließen in Coach ein.
- **Disclaimer** beim Onboarding (einmalig bestätigen) + Footer.
- Technisch: Validierung der Eingaben (plausible Bereiche für Alter/Größe/Gewicht), RLS, Server-seitige Re-Validierung.

---

## 10. Ordnerstruktur

```
muskelkater-app/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/register/page.tsx
│   │   ├── (onboarding)/onboarding/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx           # App-Shell + Nav
│   │   │   ├── heute/page.tsx
│   │   │   ├── training/page.tsx
│   │   │   ├── training/session/[dayId]/page.tsx
│   │   │   ├── ernaehrung/page.tsx
│   │   │   ├── fortschritt/page.tsx
│   │   │   ├── coach/page.tsx
│   │   │   └── profil/page.tsx
│   │   ├── api/                     # nur wo nötig
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                      # shadcn-Basis (Button, Card, ...)
│   │   ├── dashboard/               # Kacheln, Ringe
│   │   ├── workout/                 # SetTracker, Timer
│   │   └── charts/
│   ├── features/                    # Domänen-Logik je Bereich
│   │   ├── onboarding/
│   │   ├── training/
│   │   ├── nutrition/
│   │   ├── habits/
│   │   └── progress/
│   ├── lib/
│   │   ├── supabase/                # server- & browser-Client
│   │   ├── validation/              # Zod-Schemas
│   │   ├── coach/                   # regelbasierte Engine (pure)
│   │   ├── plan/                    # Plan-Generator (pure)
│   │   ├── nutrition/               # Kalorien-/Protein-Berechnung (pure)
│   │   ├── safety/                  # Gesundheits-Guards (pure)
│   │   └── utils/
│   ├── server/
│   │   ├── actions/                 # mutations (Server Actions)
│   │   └── queries/                 # reads
│   ├── store/                       # Zustand (Workout-Session)
│   └── types/
├── supabase/
│   ├── migrations/                  # Drizzle/SQL
│   └── seed.sql                     # Übungskatalog
├── docs/
│   └── MVP-ARCHITEKTUR.md           # dieses Dokument
├── public/
├── .env.local                       # Supabase URL/Keys (nicht committen)
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 11. Entwicklungsphasen

| Phase | Inhalt | Ergebnis |
|---|---|---|
| **1** | Setup: Next.js + TS + Tailwind + shadcn, Supabase-Projekt, Auth, Middleware, RLS, App-Shell + Navigation, Design-Tokens | Eingeloggter Nutzer sieht leeres App-Layout |
| **2** | Onboarding-Flow + `user_profile`/`fitness_goal` speichern, Plan- & Ernährungs-Generator, Disclaimer | Nutzer hat Profil, Ziel, ersten Plan + Ziele |
| **3** | Heute-Dashboard + Trainingsplan-Ansicht (Read aus DB) | Nutzer sieht "Was heute" + Wochenplan |
| **4** | Workout-Session + Satz-Tracking + Speichern (Zustand + Server Action) | Nutzer trainiert & loggt Sätze |
| **5** | Ernährung (Ziele/Mahlzeiten/Wasser) + Gewohnheiten | Tägliches Tracking läuft |
| **6** | Fortschritt: Körperdaten erfassen + Charts (Gewicht/Umfänge) + Streaks | Nutzer sieht Entwicklung |
| **7** | Coach-Engine + Tagescheck + Empfehlungen + Missions | App "führt" aktiv |
| **8** | Polish: Responsiveness, Fehlerbehandlung, Leerzustände, Ladезustände, A11y, Feinschliff Design | Release-fähiger MVP |

---

## 12. Klare Empfehlung — womit zuerst bauen

**Starte mit Phase 1 (Fundament):**
1. Next.js + TypeScript + Tailwind + shadcn aufsetzen, Design-Tokens (Schwarz/Anthrazit/Silber/Rot) als erstes verankern.
2. Supabase-Projekt + Auth + RLS, Login/Register, geschütztes App-Layout mit Bottom-Navigation.
3. Datenbank-Schema (Drizzle-Migrationen) + Übungskatalog-Seed anlegen.

**Grund:** Auth + DB + Layout + Design sind das Rückgrat. Steht das, lässt sich jede weitere Phase (Onboarding → Heute → Workout → …) sauber und schnell andocken — und der Plan-Generator (Phase 2) braucht den Übungskatalog ohnehin zuerst.

> **Nächster Schritt (Schritt 2):** Auf "go" scaffolde ich Phase 1 real im Ordner `Muskelkater-GmbH`.
