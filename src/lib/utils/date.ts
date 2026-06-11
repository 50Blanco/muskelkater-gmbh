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
