/**
 * Wählt – ohne Workout-Tracking – einen sinnvollen „nächsten“ Trainingstag
 * anhand des aktuellen Wochentags. Rein, deterministisch und testbar.
 *
 * Grenze: Solange es kein Session-Tracking (Phase 4) gibt, ist dies nur eine
 * Heuristik nach Wochentag. Sie weiß nicht, was der Nutzer wirklich schon
 * trainiert hat — sie verteilt die Einheiten nur gleichmäßig über die Woche.
 */

/** Bevorzugte Trainings-Wochentage je Anzahl Trainingstage (0 = Mo … 6 = So). */
const WEEKLY_SCHEDULE: Record<number, number[]> = {
  2: [0, 3], // Mo, Do
  3: [0, 2, 4], // Mo, Mi, Fr
  4: [0, 1, 3, 4], // Mo, Di, Do, Fr
  5: [0, 1, 2, 3, 4], // Mo–Fr
  6: [0, 1, 2, 3, 4, 5], // Mo–Sa
};

/** JS-Wochentag (0 = So … 6 = Sa) → Montag-basiert (0 = Mo … 6 = So). */
function toMondayBased(jsWeekday: number): number {
  return ((((jsWeekday % 7) + 6) % 7) + 7) % 7;
}

/**
 * Index (0-basiert) des sinnvollen nächsten Trainingstags.
 * @param dayCount Anzahl Tage im Plan
 * @param jsWeekday Wochentag wie von Date.getDay() (0 = So … 6 = Sa)
 */
export function selectNextDayIndex(dayCount: number, jsWeekday: number): number {
  if (!Number.isInteger(dayCount) || dayCount <= 1) return 0;
  const monday = toMondayBased(jsWeekday);
  const schedule = WEEKLY_SCHEDULE[dayCount];
  // Fallback für ungewöhnliche Plangrößen: deterministisch nach Wochentag.
  if (!schedule) return monday % dayCount;

  // Heute ein geplanter Trainingstag? → genau diese Einheit.
  const exact = schedule.indexOf(monday);
  if (exact !== -1) return exact;

  // Sonst die nächste anstehende Einheit dieser Woche …
  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i] > monday) return i;
  }

  // … oder am Wochenende nach der letzten Einheit: neue Woche, erste Einheit.
  return 0;
}

export interface DayLike {
  dayIndex: number;
}

/**
 * Wählt aus den Plan-Tagen den sinnvollen nächsten Tag (oder null bei leerem
 * Plan). Sortiert defensiv nach dayIndex, falls die Eingabe nicht sortiert ist.
 */
export function selectNextDay<T extends DayLike>(
  days: T[],
  jsWeekday: number = new Date().getDay(),
): T | null {
  if (days.length === 0) return null;
  const sorted = [...days].sort((a, b) => a.dayIndex - b.dayIndex);
  const index = selectNextDayIndex(sorted.length, jsWeekday);
  return sorted[Math.min(index, sorted.length - 1)] ?? sorted[0];
}
