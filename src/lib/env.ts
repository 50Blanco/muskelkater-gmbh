/**
 * Zentraler, getypter Zugriff auf Umgebungsvariablen.
 * Wird zur Laufzeit (nicht beim Build) ausgewertet, damit `next build`
 * auch ohne gesetzte Secrets durchläuft.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Fehlende Umgebungsvariable: ${name}. Bitte in .env.local setzen (siehe .env.example).`,
    );
  }
  return value;
}

/** Öffentliche Supabase-Werte (im Browser verfügbar). */
export const publicEnv = {
  get supabaseUrl() {
    return required(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
  },
  get supabaseAnonKey() {
    return required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  },
};

/** Server-only Werte. */
export const serverEnv = {
  get databaseUrl() {
    return required("DATABASE_URL", process.env.DATABASE_URL);
  },
};
