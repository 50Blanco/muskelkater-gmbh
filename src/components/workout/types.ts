import type { FeedbackReason } from "@/lib/workout/reasons";

/** Lokaler Zustand einer Satz-Zeile (Eingaben als String, leer erlaubt). */
export interface SetState {
  weightKg: string;
  reps: string;
  completed: boolean;
}

/** Lokaler Zustand einer Übung in der laufenden Session. */
export interface ExerciseState {
  key: string; // stabiler React-Key
  kind: "catalog" | "custom";
  /** Übung, gegen die die Sätze geloggt werden (genau eine ID gesetzt). */
  logExerciseId: string | null;
  logCustomExerciseId: string | null;
  /** Übung, auf die sich Feedback bezieht (nur Katalog, ursprünglich geplant). */
  feedbackExerciseId: string | null;
  name: string;
  muscleGroup: string;
  equipment: string | null;
  location: string;
  instructions: string | null;
  targetSets: number | null;
  targetReps: number | null;
  targetRestSec: number | null;
  sets: SetState[];
  preference: "like" | "dislike" | null;
  reason: FeedbackReason | null;
  swappedToName: string | null;
  removable: boolean;
}
