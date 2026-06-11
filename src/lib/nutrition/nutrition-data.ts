import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  dailyHabitLog,
  dailyNutritionLog,
  habit,
  nutritionTarget,
} from "@/db/schema";
import { getTodayBerlin } from "@/lib/utils/date";

/**
 * Serverseitige Reads für die Phase-5-Seiten (Ernährung, Habits).
 * Alle Queries sind nach user.id gescoped (Defense-in-Depth zusätzlich zu RLS).
 */

export interface NutritionTargetRow {
  id: string;
  caloriesKcal: number;
  proteinG: number;
  waterMl: number;
}

export interface NutritionLogRow {
  id: string;
  proteinG: number | null;
  waterMl: number;
  mealsStatus: Record<string, boolean> | null;
}

export interface HabitRow {
  id: string;
  name: string;
  icon: string | null;
}

export interface HabitLogRow {
  habitId: string;
  completed: boolean;
}

/** Aktives Ernährungsziel des Nutzers. */
export async function getActiveNutritionTarget(
  userId: string,
): Promise<NutritionTargetRow | null> {
  const [target] = await db
    .select({
      id: nutritionTarget.id,
      caloriesKcal: nutritionTarget.caloriesKcal,
      proteinG: nutritionTarget.proteinG,
      waterMl: nutritionTarget.waterMl,
    })
    .from(nutritionTarget)
    .where(
      and(eq(nutritionTarget.userId, userId), eq(nutritionTarget.active, true)),
    )
    .orderBy(desc(nutritionTarget.createdAt))
    .limit(1);
  return target ?? null;
}

/** Heutiger Ernährungs-Log (Berlin-TZ). */
export async function getTodayNutritionLog(
  userId: string,
): Promise<NutritionLogRow | null> {
  const today = getTodayBerlin();
  const [log] = await db
    .select({
      id: dailyNutritionLog.id,
      proteinG: dailyNutritionLog.proteinG,
      waterMl: dailyNutritionLog.waterMl,
      mealsStatus: dailyNutritionLog.mealsStatus,
    })
    .from(dailyNutritionLog)
    .where(
      and(
        eq(dailyNutritionLog.userId, userId),
        eq(dailyNutritionLog.logDate, today),
      ),
    )
    .limit(1);
  return log ?? null;
}

/** Aktive Habits des Nutzers. */
export async function getActiveHabits(userId: string): Promise<HabitRow[]> {
  return db
    .select({ id: habit.id, name: habit.name, icon: habit.icon })
    .from(habit)
    .where(and(eq(habit.userId, userId), eq(habit.active, true)))
    .orderBy(asc(habit.createdAt));
}

/** Habit-Logs für heute (Berlin-TZ). */
export async function getTodayHabitLogs(
  userId: string,
): Promise<HabitLogRow[]> {
  const today = getTodayBerlin();
  return db
    .select({
      habitId: dailyHabitLog.habitId,
      completed: dailyHabitLog.completed,
    })
    .from(dailyHabitLog)
    .where(
      and(
        eq(dailyHabitLog.userId, userId),
        eq(dailyHabitLog.logDate, today),
      ),
    );
}
