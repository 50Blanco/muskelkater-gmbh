import "server-only";
import { and, asc, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import {
  bodyMeasurement,
  bodyMetrics,
  weeklyBodyCheckin,
  workoutSession,
} from "@/db/schema";
import { getWeekMondayIso } from "@/lib/utils/date";

/**
 * Server-only Loader für /fortschritt.
 * Lädt ausschließlich eigene Körperdaten — kein Team-Kontext, keine fremden Daten.
 * Security: userId kommt immer aus auth.getUser(), nie vom Client.
 */

export interface WeightEntry {
  date: string;
  weightKg: number;
}

export interface MeasurementEntry {
  date: string;
  valueCm: number;
}

export interface WorkoutWeek {
  weekMonday: string;
  count: number;
}

export interface BodyProgressData {
  weightHistory: WeightEntry[];
  waistHistory: MeasurementEntry[];
  armHistory: MeasurementEntry[];
  checkinStreak: number;
  workoutWeeks: WorkoutWeek[];
  todayWeekMonday: string;
  checkinDoneThisWeek: boolean;
}

const WEIGHT_ENTRIES = 12;
const MEASUREMENT_ENTRIES = 8;
const WORKOUT_WEEKS = 8;

export async function getBodyProgress(
  userId: string,
  todayStr: string,
): Promise<BodyProgressData> {
  const todayWeekMonday = getWeekMondayIso(todayStr);

  const [weightRows, waistRows, armRows, checkinRows, sessionRows] =
    await Promise.all([
      db
        .select({
          date: bodyMetrics.measuredOn,
          weightKg: bodyMetrics.weightKg,
        })
        .from(bodyMetrics)
        .where(
          and(eq(bodyMetrics.userId, userId)),
        )
        .orderBy(desc(bodyMetrics.measuredOn))
        .limit(WEIGHT_ENTRIES),

      db
        .select({
          date: bodyMeasurement.measuredOn,
          valueCm: bodyMeasurement.valueCm,
        })
        .from(bodyMeasurement)
        .where(
          and(
            eq(bodyMeasurement.userId, userId),
            eq(bodyMeasurement.type, "waist"),
          ),
        )
        .orderBy(desc(bodyMeasurement.measuredOn))
        .limit(MEASUREMENT_ENTRIES),

      db
        .select({
          date: bodyMeasurement.measuredOn,
          valueCm: bodyMeasurement.valueCm,
        })
        .from(bodyMeasurement)
        .where(
          and(
            eq(bodyMeasurement.userId, userId),
            eq(bodyMeasurement.type, "arm"),
          ),
        )
        .orderBy(desc(bodyMeasurement.measuredOn))
        .limit(MEASUREMENT_ENTRIES),

      db
        .select({ weekDate: weeklyBodyCheckin.weekDate })
        .from(weeklyBodyCheckin)
        .where(eq(weeklyBodyCheckin.userId, userId))
        .orderBy(desc(weeklyBodyCheckin.weekDate))
        .limit(26),

      db
        .select({ completedAt: workoutSession.completedAt })
        .from(workoutSession)
        .where(
          and(
            eq(workoutSession.userId, userId),
            eq(workoutSession.status, "completed"),
            gte(
              workoutSession.completedAt,
              new Date(Date.UTC(...isoToUtcParts(addWeeks(todayWeekMonday, -WORKOUT_WEEKS)))),
            ),
          ),
        )
        .orderBy(asc(workoutSession.completedAt)),
    ]);

  const weightHistory: WeightEntry[] = weightRows
    .filter((r) => r.weightKg != null)
    .map((r) => ({ date: r.date, weightKg: r.weightKg as number }))
    .reverse();

  const waistHistory: MeasurementEntry[] = waistRows.reverse();
  const armHistory: MeasurementEntry[] = armRows.reverse();

  const checkinDoneThisWeek = checkinRows.some(
    (r) => r.weekDate === todayWeekMonday,
  );

  const checkinStreak = computeCheckinStreak(
    checkinRows.map((r) => r.weekDate),
    todayWeekMonday,
  );

  const workoutWeeks = computeWorkoutWeeks(
    sessionRows
      .filter((r) => r.completedAt != null)
      .map((r) => r.completedAt as Date),
    todayWeekMonday,
    WORKOUT_WEEKS,
  );

  return {
    weightHistory,
    waistHistory,
    armHistory,
    checkinStreak,
    workoutWeeks,
    todayWeekMonday,
    checkinDoneThisWeek,
  };
}

/* ------------------------------------------------------------------ */
/* Helpers (kein DB-Zugriff, testbar)                                 */
/* ------------------------------------------------------------------ */

function isoToUtcParts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m - 1, d];
}

function addWeeks(isoMonday: string, weeks: number): string {
  const [y, m, d] = isoMonday.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d) + weeks * 7 * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

function computeCheckinStreak(
  weekDates: string[],
  todayMonday: string,
): number {
  const sorted = [...new Set(weekDates)].sort().reverse();
  let streak = 0;
  let expected = todayMonday;
  for (const w of sorted) {
    if (w === expected) {
      streak++;
      expected = addWeeks(expected, -1);
    } else {
      break;
    }
  }
  return streak;
}

function computeWorkoutWeeks(
  completedAts: Date[],
  todayMonday: string,
  weeks: number,
): WorkoutWeek[] {
  const result: WorkoutWeek[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekMonday = addWeeks(todayMonday, -i);
    const weekEnd = addWeeks(weekMonday, 1);
    const count = completedAts.filter((d) => {
      const iso = d.toISOString().slice(0, 10);
      return iso >= weekMonday && iso < weekEnd;
    }).length;
    result.push({ weekMonday, count });
  }
  return result;
}
