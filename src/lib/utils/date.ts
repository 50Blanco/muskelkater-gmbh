/**
 * Gibt das heutige Datum im Format YYYY-MM-DD zurück,
 * ausgewertet in der Zeitzone Europe/Berlin (nicht Server-UTC).
 * Verhindert, dass Logs um Mitternacht MEZ auf den Vortag fallen.
 */
export function getTodayBerlin(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(
    new Date(),
  );
}

/** Wandelt einen Zeitpunkt in das zugehörige Berlin-Kalenderdatum (YYYY-MM-DD). */
export function toBerlinDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(
    date,
  );
}

/**
 * Die letzten `n` Kalenderdaten (YYYY-MM-DD) endend mit `todayStr`,
 * aufsteigend sortiert. Anker in UTC, damit DST-stabil.
 */
export function lastNDateStrings(todayStr: string, n: number): string[] {
  const [y, m, d] = todayStr.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(base - i * 86_400_000).toISOString().slice(0, 10));
  }
  return out;
}

/** Addiert `n` Tage zu einem ISO-Datum (YYYY-MM-DD), UTC-stabil. */
export function addDaysToIso(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/**
 * ISO-Montag der Woche, in der `isoDate` liegt (YYYY-MM-DD), UTC-stabil.
 * ISO-8601: Woche beginnt am Montag (1), Sonntag = 7.
 */
export function getWeekMondayIso(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const utcMs = Date.UTC(y, m - 1, d);
  const jsDay = new Date(utcMs).getUTCDay(); // 0=So, 1=Mo, …, 6=Sa
  const daysFromMonday = jsDay === 0 ? 6 : jsDay - 1;
  return new Date(utcMs - daysFromMonday * 86_400_000).toISOString().slice(0, 10);
}
