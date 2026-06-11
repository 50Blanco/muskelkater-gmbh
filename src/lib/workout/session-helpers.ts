/**
 * Pure Helfer rund um die Workout-Session (keine DB/React) — testbar.
 */

/** Trainingsdauer in Minuten aus Start/Ende (deckelt bei 600, min. 0). */
export function computeDurationMin(
  start: Date | string,
  end: Date | string,
): number {
  const startMs = (typeof start === "string" ? new Date(start) : start).getTime();
  const endMs = (typeof end === "string" ? new Date(end) : end).getTime();
  const diff = endMs - startMs;
  if (!Number.isFinite(diff) || diff <= 0) return 0;
  return Math.min(600, Math.round(diff / 60_000));
}

/** Anzahl der Sätze, die als „erledigt“ gewertet werden. */
export function countCompletedSets(
  sets: ReadonlyArray<{ completed: boolean }>,
): number {
  return sets.reduce((sum, s) => sum + (s.completed ? 1 : 0), 0);
}
