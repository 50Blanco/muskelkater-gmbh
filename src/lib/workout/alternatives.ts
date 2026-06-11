/**
 * Alternativ-Übungen für „Übung ersetzen" (Phase 4, MVP).
 * Pure Logik ohne DB/React: filtert den Übungskatalog nach passender
 * Muskelgruppe und kompatiblem Trainingsort. Keine KI, keine Plan-Reparatur —
 * nur einfache, nachvollziehbare Vorschläge.
 */

export interface SlimExercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string | null;
  location: string; // "gym" | "home" | "both"
  level: string;
  instructions: string | null;
}

/** Ist `candidateLocation` mit `wantedLocation` vereinbar? "both" passt immer. */
export function locationMatches(
  candidateLocation: string,
  wantedLocation: string | null | undefined,
): boolean {
  if (!wantedLocation || wantedLocation === "both") return true;
  return candidateLocation === wantedLocation || candidateLocation === "both";
}

/**
 * Liefert bis zu `limit` Alternativen zur aktuellen Übung:
 * gleiche Muskelgruppe, kompatibler Ort, ohne die Übung selbst.
 * Deterministisch nach Name sortiert (stabil, kein Zufall).
 */
export function findAlternatives(
  catalog: SlimExercise[],
  current: { id: string; muscleGroup: string; location?: string | null },
  limit = 4,
): SlimExercise[] {
  return catalog
    .filter(
      (ex) =>
        ex.id !== current.id &&
        ex.muscleGroup === current.muscleGroup &&
        locationMatches(ex.location, current.location),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "de"))
    .slice(0, Math.max(0, limit));
}
