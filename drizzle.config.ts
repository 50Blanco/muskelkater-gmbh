import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit Konfiguration.
 * - Schema: src/db/schema.ts
 * - Migrationen: ./drizzle
 * - Nur das `public`-Schema wird verwaltet (Supabase `auth`-Schema bleibt extern).
 * - Supabase verwaltet die Rollen (anon/authenticated/service_role) selbst.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  schemaFilter: ["public"],
  entities: {
    roles: {
      provider: "supabase",
    },
  },
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});
