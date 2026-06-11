import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";

/**
 * Supabase-Client für Server Components, Server Actions und Route Handlers.
 * Nur für Auth/Session verwenden – Datenzugriffe laufen über Drizzle (server).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // `setAll` aus einer Server Component heraus aufgerufen.
          // Kann ignoriert werden, wenn die Session in der Middleware
          // aktualisiert wird.
        }
      },
    },
  });
}
