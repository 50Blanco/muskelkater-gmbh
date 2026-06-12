/**
 * Pure Filterlogik für die Übungsbibliothek.
 * Keine DB-, React- oder Next.js-Abhängigkeiten — vollständig testbar.
 */

import { MUSCLE_GROUP_LABELS } from "./labels";

export type ExerciseSource = "global" | "custom";

export interface LibraryExercise {
  /** Eindeutige ID — Präfix "g_" für global, "c_" für custom verhindert Kollisionen. */
  uid: string;
  source: ExerciseSource;
  name: string;
  muscleGroup: string;
  equipment: string | null;
  location: string;
  level: string;
  instructions: string | null;
  /** nur global */
  slug?: string;
  isCompound?: boolean;
}

export interface ExerciseFilters {
  search: string;
  muscleGroup: string; // "" = alle
  location: string;   // "" = alle
  equipment: string;  // "" = alle
  level: string;      // "" = alle
}

export const EMPTY_FILTERS: ExerciseFilters = {
  search: "",
  muscleGroup: "",
  location: "",
  equipment: "",
  level: "",
};

/** Normalisiert einen Muskelgruppen-Text → bekannter Key oder "sonstige". */
export function normalizeMuscleGroup(raw: string): string {
  const key = raw.trim().toLowerCase();
  return key in MUSCLE_GROUP_LABELS ? key : "sonstige";
}

/** Alle eindeutigen Muskelgruppen aus einer Liste (normalisiert, sortiert). */
export function extractMuscleGroups(exercises: LibraryExercise[]): string[] {
  const groups = new Set(exercises.map((ex) => normalizeMuscleGroup(ex.muscleGroup)));
  return Array.from(groups).sort((a, b) => a.localeCompare(b, "de"));
}

/** Alle eindeutigen Equipment-Werte (ohne null/leer, sortiert). */
export function extractEquipment(exercises: LibraryExercise[]): string[] {
  const eq = new Set<string>();
  for (const ex of exercises) {
    if (ex.equipment) eq.add(ex.equipment.trim());
  }
  return Array.from(eq).sort((a, b) => a.localeCompare(b, "de"));
}

/** Wendet alle aktiven Filter auf eine Übungsliste an. */
export function filterExercises(
  exercises: LibraryExercise[],
  filters: ExerciseFilters,
): LibraryExercise[] {
  const search = filters.search.trim().toLowerCase();
  return exercises.filter((ex) => {
    if (search && !ex.name.toLowerCase().includes(search)) return false;
    if (filters.muscleGroup && normalizeMuscleGroup(ex.muscleGroup) !== filters.muscleGroup) return false;
    if (filters.location && ex.location !== "both" && ex.location !== filters.location) return false;
    if (filters.equipment && (ex.equipment ?? "").trim() !== filters.equipment) return false;
    if (filters.level && ex.level !== filters.level) return false;
    return true;
  });
}

/** Sortiert: globale zuerst, dann custom; innerhalb alphabetisch nach Name (de). */
export function sortExercises(exercises: LibraryExercise[]): LibraryExercise[] {
  return [...exercises].sort((a, b) => {
    if (a.source !== b.source) return a.source === "global" ? -1 : 1;
    return a.name.localeCompare(b.name, "de");
  });
}

/** Baut URLSearchParams aus einem ExerciseFilters-Objekt. Leere Werte werden ausgelassen. */
export function buildFilterSearchParams(filters: ExerciseFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.muscleGroup) params.set("muscle", filters.muscleGroup);
  if (filters.location) params.set("location", filters.location);
  if (filters.equipment) params.set("equipment", filters.equipment);
  if (filters.level) params.set("level", filters.level);
  return params;
}

/** Liest ExerciseFilters aus Next.js-searchParams (Record von Server-Component). */
export function filtersFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
): ExerciseFilters {
  function str(v: string | string[] | undefined): string {
    if (!v) return "";
    return Array.isArray(v) ? (v[0] ?? "") : v;
  }
  return {
    search: str(sp.q),
    muscleGroup: str(sp.muscle),
    location: str(sp.location),
    equipment: str(sp.equipment),
    level: str(sp.level),
  };
}

/** Gibt true zurück, wenn mindestens ein Filter aktiv ist. */
export function hasActiveFilters(filters: ExerciseFilters): boolean {
  return !!(
    filters.search ||
    filters.muscleGroup ||
    filters.location ||
    filters.equipment ||
    filters.level
  );
}
