/**
 * Anzeige-Labels (Deutsch) für Trainingsdaten.
 * Übersetzt die englischen DB-Enum-/Katalogwerte für die UI.
 */

export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  legs: "Beine",
  hamstrings: "Beinrückseite",
  glutes: "Gesäß",
  chest: "Brust",
  shoulders: "Schultern",
  back: "Rücken",
  biceps: "Bizeps",
  triceps: "Trizeps",
  core: "Rumpf",
  cardio: "Ausdauer",
};

export const GOAL_TYPE_LABELS: Record<string, string> = {
  build_muscle: "Muskeln aufbauen",
  lose_fat: "Fett verlieren",
  get_fit: "Fitter werden",
  strength: "Stärker werden",
  maintain: "Gewicht halten",
};

export const LOCATION_LABELS: Record<string, string> = {
  gym: "Gym",
  home: "Zuhause",
  both: "Gym & Zuhause",
};

export const LEVEL_LABELS: Record<string, string> = {
  beginner: "Anfänger",
  intermediate: "Fortgeschritten",
  advanced: "Profi",
};

export function muscleGroupLabel(group: string): string {
  return MUSCLE_GROUP_LABELS[group] ?? group;
}

/** Pause in Sekunden lesbar formatieren (z. B. „90 s“, „2 Min“, „2,5 Min“). */
export function formatRest(restSec: number | null): string {
  if (!restSec || restSec <= 0) return "—";
  if (restSec < 60) return `${restSec} s`;
  const minutes = restSec / 60;
  return Number.isInteger(minutes)
    ? `${minutes} Min`
    : `${minutes.toFixed(1).replace(".", ",")} Min`;
}

/** Sätze × Wiederholungen als kompakter Text (z. B. „3 × 10“). */
export function formatSetsReps(
  sets: number | null,
  reps: number | null,
): string {
  if (!sets || !reps) return "—";
  return `${sets} × ${reps}`;
}
