# MUSKELKATER GMBH — Fitness-App

Dein Coach in der Hosentasche. Moderne Fitness-App, die täglich klar führt:
Training, Ernährung, Gewohnheiten, Fortschritt und ein regelbasierter Coach.

> **Status: Phase 1 (Fundament).** Auth, geschützte Routen, App-Shell,
> Design-System und das vorbereitete Datenbankschema stehen. Die fachlichen
> Features (Onboarding, Plan, Tracking, Coach) folgen in den Phasen 2–8 — siehe
> [docs/MVP-ARCHITEKTUR.md](docs/MVP-ARCHITEKTUR.md).

## Tech-Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** · shadcn/ui-Stil (eigene UI-Komponenten)
- **Supabase Auth** (Login/Session) — _nur_ für Auth
- **Drizzle ORM** + PostgreSQL (Schema, Migrationen, serverseitige Zugriffe)
- **Row Level Security** auf allen nutzerbezogenen Tabellen

## Schnellstart

```bash
# 1) Abhängigkeiten
npm install

# 2) Env einrichten
#    .env.example nach .env.local kopieren und Supabase-Werte eintragen
cp .env.example .env.local

# 3) Datenbank aufsetzen (siehe "Supabase einrichten")

# 4) Dev-Server
npm run dev   # http://localhost:3000
```

## Environment Variables

| Variable | Zweck |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Projekt-URL (Auth, Browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key (Auth) |
| `DATABASE_URL` | Postgres-Connection-String (nur serverseitig, Drizzle) |
| `NEXT_PUBLIC_SITE_URL` _(optional)_ | Basis-URL für E-Mail-Bestätigungslinks |

## Supabase einrichten

1. Projekt auf [supabase.com](https://supabase.com) anlegen.
2. **Project Settings → API**: `Project URL` und `anon public key` in `.env.local`.
3. **Project Settings → Database → Connection string**: `DATABASE_URL` setzen.
   - Für die **App** (Runtime): Transaction-Pooler (Port `6543`).
   - Für **Migrationen**: Session-Pooler oder direkte Verbindung (Port `5432`).
4. **Schema + RLS anlegen** (eine der beiden Optionen):
   - **A · SQL-Editor (einfach):** Inhalt von `drizzle/0000_*.sql` in den Supabase
     SQL-Editor kopieren und ausführen. Erstellt Tabellen, Enums, FKs **und** RLS-Policies.
   - **B · Drizzle (CLI):** `DATABASE_URL` auf Port `5432` setzen, dann
     `npm run db:migrate`.
5. **Seed (Übungen):** `supabase/seed.sql` im SQL-Editor ausführen.
6. **E-Mail-Bestätigung:** Standardmäßig aktiv. Zum schnellen Testen unter
   **Authentication → Providers → Email** „Confirm email" deaktivieren, oder den
   Bestätigungslink nutzen (`/auth/confirm`).

## NPM-Scripts

| Script | Beschreibung |
|---|---|
| `npm run dev` | Dev-Server (Turbopack) |
| `npm run build` | Production-Build |
| `npm run start` | Production-Server |
| `npm run lint` | ESLint |
| `npm run db:generate` | Drizzle-Migration aus dem Schema erzeugen |
| `npm run db:migrate` | Migrationen anwenden |
| `npm run db:push` | Schema direkt pushen (Dev) |
| `npm run db:studio` | Drizzle Studio |

## Projektstruktur (Auszug)

```
src/
├── app/
│   ├── (auth)/           login, register, actions
│   ├── (onboarding)/     onboarding (Platzhalter Phase 2)
│   ├── (app)/            heute, training, ernaehrung, fortschritt, coach, profil
│   ├── auth/confirm/     E-Mail-Bestätigung
│   └── page.tsx          → /heute
├── components/           ui/, brand/, auth/, navigation/, layout/
├── db/                   schema.ts (16 Tabellen + RLS), index.ts (Drizzle)
├── lib/                  supabase/, validation/, env.ts, utils.ts, nav-items.ts
└── proxy.ts              Routenschutz + Onboarding-Gate (Next 16)
drizzle/                  generierte Migrationen (inkl. RLS-Policies)
supabase/seed.sql         Übungskatalog
docs/MVP-ARCHITEKTUR.md   vollständiger MVP-Plan
```
