import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  customExercise,
  exercise,
  workoutDay,
  workoutDayExercise,
  workoutSession,
} from "@/db/schema";
import type { SlimExercise } from "@/lib/workout/alternatives";

/**
 * Serverseitige Reads/Helfer für die Workout-Session (Phase 4).
 * Alle Queries sind nach user.id gescoped (Defense-in-Depth zusätzlich zu RLS).
 */

export interface SessionExercise {
  id: string; // workout_day_exercise id (stabiler Schlüssel)
  kind: "catalog" | "custom";
  exerciseId: string | null; // Katalog-Übung (null bei custom)
  customExerciseId: string | null; // eigene Übung (null bei catalog)
  order: number;
  targetSets: number | null;
  targetReps: number | null;
  targetRestSec: number | null;
  name: string;
  muscleGroup: string;
  equipment: string | null;
  location: string;
  level: string;
  instructions: string | null;
}

export interface SessionDay {
  id: string;
  dayIndex: number;
  title: string;
  focus: string | null;
  estMinutes: number | null;
  exercises: SessionExercise[];
}

/** Lädt einen Trainingstag (nur wenn er dem Nutzer gehört) inkl. Übungen. */
export async function getWorkoutDayForSession(
  userId: string,
  dayId: string,
): Promise<SessionDay | null> {
  const [day] = await db
    .select()
    .from(workoutDay)
    .where(and(eq(workoutDay.id, dayId), eq(workoutDay.userId, userId)))
    .limit(1);
  if (!day) return null;

  const rows = await db
    .select({
      id: workoutDayExercise.id,
      exerciseId: workoutDayExercise.exerciseId,
      customExerciseId: workoutDayExercise.customExerciseId,
      order: workoutDayExercise.order,
      targetSets: workoutDayExercise.targetSets,
      targetReps: workoutDayExercise.targetReps,
      targetRestSec: workoutDayExercise.targetRestSec,
      gName: exercise.name,
      gMuscle: exercise.muscleGroup,
      gEquipment: exercise.equipment,
      gLocation: exercise.location,
      gLevel: exercise.level,
      gInstructions: exercise.instructions,
      cName: customExercise.name,
      cMuscle: customExercise.muscleGroup,
      cEquipment: customExercise.equipment,
      cLocation: customExercise.location,
      cLevel: customExercise.level,
      cInstructions: customExercise.instructions,
    })
    .from(workoutDayExercise)
    .leftJoin(exercise, eq(workoutDayExercise.exerciseId, exercise.id))
    // Custom-Join zusätzlich user-scoped: fremde Custom-Übungen bleiben unsichtbar.
    .leftJoin(
      customExercise,
      and(
        eq(workoutDayExercise.customExerciseId, customExercise.id),
        eq(customExercise.userId, userId),
      ),
    )
    .where(
      and(
        eq(workoutDayExercise.workoutDayId, dayId),
        eq(workoutDayExercise.userId, userId),
      ),
    )
    .orderBy(asc(workoutDayExercise.order));

  return {
    id: day.id,
    dayIndex: day.dayIndex,
    title: day.title,
    focus: day.focus,
    estMinutes: day.estMinutes,
    exercises: rows.map((r) => {
      const isCustom = r.customExerciseId !== null;
      return {
        id: r.id,
        kind: isCustom ? ("custom" as const) : ("catalog" as const),
        exerciseId: r.exerciseId,
        customExerciseId: r.customExerciseId,
        order: r.order,
        targetSets: r.targetSets,
        targetReps: r.targetReps,
        targetRestSec: r.targetRestSec,
        name: (isCustom ? r.cName : r.gName) ?? "Unbekannte Übung",
        muscleGroup: (isCustom ? r.cMuscle : r.gMuscle) ?? "sonstige",
        equipment: isCustom ? r.cEquipment : r.gEquipment,
        location: (isCustom ? r.cLocation : r.gLocation) ?? "both",
        level: (isCustom ? r.cLevel : r.gLevel) ?? "beginner",
        instructions: isCustom ? r.cInstructions : r.gInstructions,
      };
    }),
  };
}

/** Globaler Übungskatalog (schlank) — für Alternativ-Vorschläge. */
export async function getExerciseCatalog(): Promise<SlimExercise[]> {
  return db
    .select({
      id: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      location: exercise.location,
      level: exercise.level,
      instructions: exercise.instructions,
    })
    .from(exercise)
    .orderBy(asc(exercise.name));
}

export interface CustomExerciseRow {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string | null;
  location: string;
  level: string;
  instructions: string | null;
  notes: string | null;
}

/** Eigene Übungen des Nutzers (user-scoped). */
export async function getCustomExercises(
  userId: string,
): Promise<CustomExerciseRow[]> {
  return db
    .select({
      id: customExercise.id,
      name: customExercise.name,
      muscleGroup: customExercise.muscleGroup,
      equipment: customExercise.equipment,
      location: customExercise.location,
      level: customExercise.level,
      instructions: customExercise.instructions,
      notes: customExercise.notes,
    })
    .from(customExercise)
    .where(eq(customExercise.userId, userId))
    .orderBy(desc(customExercise.createdAt));
}

/** Liest (nur lesend) die aktive Session für diesen Tag, falls vorhanden. */
export async function getActiveSession(
  userId: string,
  dayId: string,
): Promise<{ id: string } | null> {
  const [existing] = await db
    .select({ id: workoutSession.id })
    .from(workoutSession)
    .where(
      and(
        eq(workoutSession.userId, userId),
        eq(workoutSession.workoutDayId, dayId),
        eq(workoutSession.status, "active"),
      ),
    )
    .orderBy(desc(workoutSession.startedAt))
    .limit(1);
  return existing ?? null;
}

/**
 * Findet die aktive Session für diesen Tag oder legt eine neue an.
 * Voraussetzung: Der Aufrufer hat bereits geprüft, dass `dayId` dem Nutzer
 * gehört. Wird ausschließlich aus der `startWorkout`-Server-Action genutzt
 * (Mutation niemals beim reinen Seitenaufruf). Idempotent.
 */
export async function ensureActiveSession(
  userId: string,
  dayId: string,
): Promise<{ id: string }> {
  const existing = await getActiveSession(userId, dayId);
  if (existing) return existing;

  const [created] = await db
    .insert(workoutSession)
    .values({ userId, workoutDayId: dayId, status: "active" })
    .returning({ id: workoutSession.id });
  return created;
}
