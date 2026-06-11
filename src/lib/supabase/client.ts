import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

/**
 * Supabase-Client für Client Components (Browser).
 * Nur für Auth/Session verwenden – Datenzugriffe laufen über Drizzle (server).
 */
export function createClient() {
  return createBrowserClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
  );
}
