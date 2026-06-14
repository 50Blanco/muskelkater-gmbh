import "server-only";
import { and, asc, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import {
  dailyHabitLog,
  dailyNutritionLog,
  habit,
  mealLog,
  nutritionTarget,
} from "@/db/schema";
import { getTodayBerlin, lastNDateStrings } from "@/lib/utils/date";

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
  caloriesKcal: number | null;
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
      caloriesKcal: dailyNutritionLog.caloriesKcal,
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

/* ------------------------------------------------------------------ */
/* Meal-Log (Phase 14)                                               */
/* ------------------------------------------------------------------ */

export interface MealLogEntry {
  id: string;
  mealType: string;
  title: string;
  caloriesKcal: number | null;
  proteinG: number | null;
}

export interface DayNutritionSummary {
  logDate: string;
  caloriesKcal: number | null;
  proteinG: number | null;
  mealCount: number;
  waterMl: number;
}

/** Heutige Mahlzeiten-Einträge (privat — nie im Team-Payload). */
export async function getTodayMealLogs(
  userId: string,
): Promise<MealLogEntry[]> {
  const today = getTodayBerlin();
  return db
    .select({
      id: mealLog.id,
      mealType: mealLog.mealType,
      title: mealLog.title,
      caloriesKcal: mealLog.caloriesKcal,
      proteinG: mealLog.proteinG,
    })
    .from(mealLog)
    .where(and(eq(mealLog.userId, userId), eq(mealLog.logDate, today)))
    .orderBy(asc(mealLog.createdAt));
}

/** Letzte 7 Tage als kompakte Tages-Zusammenfassung (aus daily_nutrition_log). */
export async function getWeekNutritionSummary(
  userId: string,
): Promise<DayNutritionSummary[]> {
  const today = getTodayBerlin();
  const dateKeys = lastNDateStrings(today, 7);
  const sinceStr = dateKeys[0];

  const logs = await db
    .select({
      logDate: dailyNutritionLog.logDate,
      caloriesKcal: dailyNutritionLog.caloriesKcal,
      proteinG: dailyNutritionLog.proteinG,
      waterMl: dailyNutritionLog.waterMl,
    })
    .from(dailyNutritionLog)
    .where(
      and(
        eq(dailyNutritionLog.userId, userId),
        gte(dailyNutritionLog.logDate, sinceStr),
      ),
    );

  const mealCounts = await db
    .select({
      logDate: mealLog.logDate,
    })
    .from(mealLog)
    .where(and(eq(mealLog.userId, userId), gte(mealLog.logDate, sinceStr)));

  const logByDate = new Map(logs.map((l) => [l.logDate, l]));
  const mealCountByDate = new Map<string, number>();
  for (const m of mealCounts) {
    mealCountByDate.set(m.logDate, (mealCountByDate.get(m.logDate) ?? 0) + 1);
  }

  return dateKeys.map((d) => {
    const l = logByDate.get(d);
    return {
      logDate: d,
      caloriesKcal: l?.caloriesKcal ?? null,
      proteinG: l?.proteinG ?? null,
      mealCount: mealCountByDate.get(d) ?? 0,
      waterMl: l?.waterMl ?? 0,
    };
  });
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
