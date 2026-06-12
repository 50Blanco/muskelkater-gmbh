import { z } from "zod";
import { FEEDBACK_REASONS } from "@/lib/workout/reasons";

/**
 * Validierung für Phase 4 (Workout-Session, Sätze, Feedback, eigene Übungen).
 * Wird client- UND serverseitig benutzt. Zahlenfelder akzeptieren Strings mit
 * Komma ("82,5") aus den Formularen und leere Eingaben werden zu null.
 */

export const MUSCLE_GROUPS = [
  "legs",
  "hamstrings",
  "glutes",
  "chest",
  "shoulders",
  "back",
  "biceps",
  "triceps",
  "core",
  "cardio",
] as const;

export const EQUIPMENT_OPTIONS = [
  "bodyweight",
  "dumbbell",
  "barbell",
  "cable",
  "machine",
  "bands",
  "kettlebell",
  "other",
] as const;

export const TRAINING_LOCATIONS = ["gym", "home", "both"] as const;
export const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const PREFERENCE_VALUES = ["like", "dislike", "neutral"] as const;

/** Optionales Zahlenfeld (Komma erlaubt, leer → null) mit Grenzen. */
function optionalNumber(min: number, max: number) {
  return z.preprocess((value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") return null;
      const parsed = Number(trimmed.replace(",", "."));
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }, z.number().min(min, "Wert ist zu klein.").max(max, "Wert ist zu groß.").nullable());
}

/* ------------------------------------------------------------------ */
/* Eigene Übung                                                       */
/* ------------------------------------------------------------------ */

export const customExerciseSchema = z.object({
  name: z
    .string("Bitte gib einen Namen an.")
    .trim()
    .min(2, "Der Name braucht mindestens 2 Zeichen.")
    .max(60, "Der Name darf höchstens 60 Zeichen haben."),
  muscleGroup: z.enum(MUSCLE_GROUPS, "Bitte wähle eine Muskelgruppe."),
  equipment: z.enum(EQUIPMENT_OPTIONS).default("bodyweight"),
  location: z.enum(TRAINING_LOCATIONS).default("both"),
  level: z.enum(EXPERIENCE_LEVELS).default("beginner"),
  instructions: z
    .string()
    .trim()
    .max(500, "Bitte kürzer beschreiben (max. 500 Zeichen).")
    .default(""),
  notes: z
    .string()
    .trim()
    .max(500, "Bitte kürzer (max. 500 Zeichen).")
    .default(""),
});

export type CustomExerciseInput = z.infer<typeof customExerciseSchema>;

/* ------------------------------------------------------------------ */
/* Workout abschließen                                                */
/* ------------------------------------------------------------------ */

/** Ein protokollierter Satz. Genau eine Übungsreferenz ist gesetzt. */
export const workoutSetInputSchema = z
  .object({
    exerciseId: z.uuid().nullable().default(null),
    customExerciseId: z.uuid().nullable().default(null),
    setNumber: z.number().int().min(1).max(50),
    weightKg: optionalNumber(0, 1000),
    reps: z.preprocess(
      (value) => {
        if (value === null || value === undefined || value === "") return null;
        if (typeof value === "number") return value;
        if (typeof value === "string") {
          const parsed = Number(value.trim());
          return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
      },
      z.number().int().min(0).max(1000).nullable(),
    ),
    completed: z.boolean().default(false),
  })
  .refine(
    (s) => (s.exerciseId === null) !== (s.customExerciseId === null),
    "Ein Satz braucht genau eine Übungsreferenz.",
  );

export const exerciseFeedbackInputSchema = z.object({
  exerciseId: z.uuid(),
  preference: z.enum(PREFERENCE_VALUES),
  reason: z.enum(FEEDBACK_REASONS).nullable().default(null),
});

export const finishWorkoutSchema = z.object({
  sessionId: z.uuid(),
  dayId: z.uuid(),
  durationMin: z.number().int().min(0).max(600).nullable().default(null),
  perceivedEffort: z.number().int().min(1).max(10).nullable().default(null),
  mood: z.number().int().min(1).max(5).nullable().default(null),
  soreness: z.number().int().min(0).max(10).nullable().default(null),
  sets: z.array(workoutSetInputSchema).max(200),
  feedback: z.array(exerciseFeedbackInputSchema).max(50),
});

export type FinishWorkoutInput = z.infer<typeof finishWorkoutSchema>;
export type WorkoutSetInput = z.infer<typeof workoutSetInputSchema>;
export type ExerciseFeedbackInput = z.infer<typeof exerciseFeedbackInputSchema>;

/* ------------------------------------------------------------------ */
/* Übung zu Trainingstag hinzufügen (Phase 7B1)                       */
/* ------------------------------------------------------------------ */

/** UID einer Übungsreferenz: "g_<uuid>" (global) oder "c_<uuid>" (custom). */
const exerciseUidSchema = z
  .string()
  .trim()
  .regex(
    /^[gc]_[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    "Ungültige Übungsreferenz.",
  );

export const addExerciseToWorkoutDaySchema = z.object({
  workoutDayId: z.uuid("Ungültiger Trainingstag."),
  exerciseUid: exerciseUidSchema,
  // Optionale Vorgabe; fehlt sie, setzt der Server sinnvolle Defaults.
  targetSets: optionalNumber(1, 20),
  targetReps: optionalNumber(1, 100),
  targetRestSec: optionalNumber(0, 600),
});

export type AddExerciseToWorkoutDayInput = z.infer<
  typeof addExerciseToWorkoutDaySchema
>;
