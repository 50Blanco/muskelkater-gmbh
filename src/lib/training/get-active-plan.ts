import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  exercise,
  workoutDay,
  workoutDayExercise,
  workoutPlan,
} from "@/db/schema";

/**
 * Serverseitiger Read des aktiven Trainingsplans eines Nutzers.
 * Alle Queries sind nach user.id gescoped (Defense-in-Depth zusätzlich zu RLS).
 * Übungsdaten kommen via JOIN aus dem globalen `exercise`-Katalog.
 */

export interface PlanExercise {
  id: string;
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
            order: workoutDayExercise.order,
            targetSets: workoutDayExercise.targetSets,
            targetReps: workoutDayExercise.targetReps,
            targetRestSec: workoutDayExercise.targetRestSec,
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            equipment: exercise.equipment,
            level: exercise.level,
            instructions: exercise.instructions,
          })
          .from(workoutDayExercise)
          .innerJoin(
            exercise,
            eq(workoutDayExercise.exerciseId, exercise.id),
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
    const list = exercisesByDay.get(row.workoutDayId) ?? [];
    list.push({
      id: row.id,
      order: row.order,
      targetSets: row.targetSets,
      targetReps: row.targetReps,
      targetRestSec: row.targetRestSec,
      name: row.name,
      muscleGroup: row.muscleGroup,
      equipment: row.equipment,
      level: row.level,
      instructions: row.instructions,
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
