import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  customExercise,
  exercise,
  workoutDay,
  workoutDayExercise,
  workoutPlan,
} from "@/db/schema";
import { nextOrder } from "./prescription";
import type { ParsedExerciseUid } from "./exercise-uid";

/**
 * Serverseitige Ownership-Prüfungen für das Bearbeiten von Trainingstagen
 * (Phase 7B). RLS allein reicht hier NICHT: ein Nutzer könnte sonst eine
 * Übung in einen fremden Trainingstag schreiben oder eine fremde Custom-Übung
 * referenzieren. Diese Prüfungen sind die primäre Verteidigung (Defense-in-Depth).
 */

/**
 * Prüft, ob der Trainingstag dem Nutzer gehört — über workout_plan.user_id
 * UND workout_day.user_id. Gibt true zurück, wenn beides zum Nutzer passt.
 */
export async function assertOwnsWorkoutDay(
  userId: string,
  workoutDayId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ dayId: workoutDay.id })
    .from(workoutDay)
    .innerJoin(workoutPlan, eq(workoutDay.planId, workoutPlan.id))
    .where(
      and(
        eq(workoutDay.id, workoutDayId),
        eq(workoutDay.userId, userId),
        eq(workoutPlan.userId, userId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/**
 * Prüft, ob eine `workout_day_exercise`-Zeile dem Nutzer gehört — über die
 * gesamte Kette workout_day_exercise → workout_day → workout_plan → user_id.
 * Primäre Verteidigung beim Entfernen/Ersetzen/Anpassen (Defense-in-Depth).
 */
export async function assertOwnsWorkoutDayExercise(
  userId: string,
  workoutDayExerciseId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: workoutDayExercise.id })
    .from(workoutDayExercise)
    .innerJoin(workoutDay, eq(workoutDayExercise.workoutDayId, workoutDay.id))
    .innerJoin(workoutPlan, eq(workoutDay.planId, workoutPlan.id))
    .where(
      and(
        eq(workoutDayExercise.id, workoutDayExerciseId),
        eq(workoutDayExercise.userId, userId),
        eq(workoutDay.userId, userId),
        eq(workoutPlan.userId, userId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export interface ExerciseRefCheck {
  ok: boolean;
  /** nur bei globaler Übung gesetzt — für Default-Vorgabe. */
  isCompound?: boolean;
}

/**
 * Prüft, ob die referenzierte Übung verwendet werden darf:
 *  - global: existiert im Katalog (read-only, kein User-Scope)
 *  - custom: gehört dem Nutzer (custom_exercise.user_id = userId)
 */
export async function assertOwnsExerciseRef(
  userId: string,
  parsed: ParsedExerciseUid,
): Promise<ExerciseRefCheck> {
  if (parsed.kind === "global") {
    const [row] = await db
      .select({ id: exercise.id, isCompound: exercise.isCompound })
      .from(exercise)
      .where(eq(exercise.id, parsed.id))
      .limit(1);
    return row ? { ok: true, isCompound: row.isCompound } : { ok: false };
  }

  const [row] = await db
    .select({ id: customExercise.id })
    .from(customExercise)
    .where(
      and(
        eq(customExercise.id, parsed.id),
        eq(customExercise.userId, userId),
      ),
    )
    .limit(1);
  return row ? { ok: true } : { ok: false };
}

/**
 * Nächster `order`-Wert für einen Trainingstag (user-scoped gelesen).
 * Setzt voraus, dass der Aufrufer die Day-Ownership bereits geprüft hat.
 */
export async function getNextWorkoutDayExerciseOrder(
  userId: string,
  workoutDayId: string,
): Promise<number> {
  const rows = await db
    .select({ order: workoutDayExercise.order })
    .from(workoutDayExercise)
    .where(
      and(
        eq(workoutDayExercise.workoutDayId, workoutDayId),
        eq(workoutDayExercise.userId, userId),
      ),
    );
  return nextOrder(rows.map((r) => r.order));
}
