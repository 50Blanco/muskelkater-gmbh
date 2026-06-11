import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/lib/env";
import * as schema from "./schema";

/**
 * Serverseitiger Drizzle-Client (PostgreSQL via Supabase).
 * Nur in Server Components / Server Actions / Route Handlers verwenden.
 *
 * Hinweis Sicherheit: Dieser Client verbindet sich privilegiert mit der DB.
 * Zugriffe MÜSSEN serverseitig immer nach der Session-User-ID gefiltert werden
 * (Defense-in-Depth zusätzlich zu RLS, das den Supabase-anon-Zugriff schützt).
 */

// Verbindung über Singleton (vermeidet zu viele Connections im Dev/HMR).
const globalForDb = globalThis as unknown as {
  __muskelkaterClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__muskelkaterClient ??
  postgres(serverEnv.databaseUrl, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__muskelkaterClient = client;
}

export const db = drizzle(client, { schema });

export { schema };
