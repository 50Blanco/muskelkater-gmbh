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
