import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  customExercise,
  exercise,
  workoutDay,
  workoutDayExercise,
  workoutPlan,
} from "@/db/schema";
import { buildExerciseUid } from "./exercise-uid";

/**
 * Serverseitiger Read des aktiven Trainingsplans eines Nutzers.
 * Alle Queries sind nach user.id gescoped (Defense-in-Depth zusätzlich zu RLS).
 * Übungsdaten kommen via LEFT JOIN aus dem globalen `exercise`-Katalog ODER
 * aus den eigenen `custom_exercise` des Nutzers (genau eine Referenz pro Zeile,
 * per XOR-CHECK erzwungen). Der Custom-Join ist zusätzlich user-scoped.
 */

export interface PlanExercise {
  id: string;
  /** "g_<id>" oder "c_<id>" — für Link zu /training/uebungen/<uid>. */
  uid: string;
  source: "global" | "custom";
  exerciseId: string | null;
  customExerciseId: string | null;
  order: number;
  targetSets: number | null;
  targetReps: number | null;
  targetRestSec: number | null;
  name: string;
  muscleGroup: string;
  equipment: string | null;
  level: string;
  instructions: string | null;
}

export interface PlanDay {
  id: string;
  dayIndex: number;
  title: string;
  focus: string | null;
  estMinutes: number | null;
  exercises: PlanExercise[];
}

export interface ActivePlan {
  id: string;
  name: string;
  goalType: string | null;
  daysPerWeek: number | null;
  location: string | null;
  startDate: string | null;
  days: PlanDay[];
}

export async function getActiveTrainingPlan(
  userId: string,
): Promise<ActivePlan | null> {
  const [plan] = await db
    .select()
    .from(workoutPlan)
    .where(and(eq(workoutPlan.userId, userId), eq(workoutPlan.active, true)))
    .orderBy(desc(workoutPlan.createdAt))
    .limit(1);
  if (!plan) return null;

  const days = await db
    .select()
    .from(workoutDay)
    .where(and(eq(workoutDay.planId, plan.id), eq(workoutDay.userId, userId)))
    .orderBy(asc(workoutDay.dayIndex));

  const dayIds = days.map((d) => d.id);
  const exerciseRows =
    dayIds.length > 0
      ? await db
          .select({
            workoutDayId: workoutDayExercise.workoutDayId,
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
            gLevel: exercise.level,
            gInstructions: exercise.instructions,
            cName: customExercise.name,
            cMuscle: customExercise.muscleGroup,
            cEquipment: customExercise.equipment,
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
              eq(workoutDayExercise.userId, userId),
              inArray(workoutDayExercise.workoutDayId, dayIds),
            ),
          )
          .orderBy(asc(workoutDayExercise.order))
      : [];

  const exercisesByDay = new Map<string, PlanExercise[]>();
  for (const row of exerciseRows) {
    const isCustom = row.customExerciseId !== null;
    const source: "global" | "custom" = isCustom ? "custom" : "global";
    const refId = (isCustom ? row.customExerciseId : row.exerciseId) ?? row.id;

    const list = exercisesByDay.get(row.workoutDayId) ?? [];
    list.push({
      id: row.id,
      uid: buildExerciseUid(source, refId),
      source,
      exerciseId: row.exerciseId,
      customExerciseId: row.customExerciseId,
      order: row.order,
      targetSets: row.targetSets,
      targetReps: row.targetReps,
      targetRestSec: row.targetRestSec,
      name: (isCustom ? row.cName : row.gName) ?? "Unbekannte Übung",
      muscleGroup: (isCustom ? row.cMuscle : row.gMuscle) ?? "sonstige",
      equipment: isCustom ? row.cEquipment : row.gEquipment,
      level: (isCustom ? row.cLevel : row.gLevel) ?? "beginner",
      instructions: isCustom ? row.cInstructions : row.gInstructions,
    });
    exercisesByDay.set(row.workoutDayId, list);
  }

  return {
    id: plan.id,
    name: plan.name,
    goalType: plan.goalType,
    daysPerWeek: plan.daysPerWeek,
    location: plan.location,
    startDate: plan.startDate,
    days: days.map((d) => ({
      id: d.id,
      dayIndex: d.dayIndex,
      title: d.title,
      focus: d.focus,
      estMinutes: d.estMinutes,
      exercises: exercisesByDay.get(d.id) ?? [],
    })),
  };
}
