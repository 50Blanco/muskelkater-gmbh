import "server-only";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  dailyHabitLog,
  dailyNutritionLog,
  dailyStepLog,
  nutritionTarget,
  socialReaction,
  teamChallenge,
  weeklyBodyCheckin,
  workoutSession,
} from "@/db/schema";
import { getWeekMondayIso, lastNDateStrings, toBerlinDate } from "@/lib/utils/date";
import type { ChallengeStatus } from "@/lib/validation/challenge";
import {
  isStepsGoalReached,
  type DailyScoreInput,
  type MemberDailyStatusInput,
} from "./challenge-scoring";

/**
 * Server-only Datenbeschaffung für die Team-Challenge (Phase 9).
 * Alle Reads sind nach den übergebenen `memberUserIds` / `groupId` gescoped —
 * die Membership-Prüfung selbst passiert im aufrufenden Loader/Action
 * (Defense-in-Depth zusätzlich zu RLS). Keine sensiblen Felder werden geladen.
 */

export const WEEK_DAYS = 7;

export interface ActiveChallenge {
  id: string;
  groupId: string;
  title: string;
  stakeText: string | null;
  startsOn: string;
  endsOn: string;
  status: ChallengeStatus;
  createdByUserId: string;
}

/** Neueste aktive Challenge einer Gruppe (MVP: nur eine ist relevant). */
export async function getActiveChallenge(
  groupId: string,
): Promise<ActiveChallenge | null> {
  const [row] = await db
    .select({
      id: teamChallenge.id,
      groupId: teamChallenge.groupId,
      title: teamChallenge.title,
      stakeText: teamChallenge.stakeText,
      startsOn: teamChallenge.startsOn,
      endsOn: teamChallenge.endsOn,
      status: teamChallenge.status,
      createdByUserId: teamChallenge.createdByUserId,
    })
    .from(teamChallenge)
    .where(
      and(eq(teamChallenge.groupId, groupId), eq(teamChallenge.status, "active")),
    )
    .orderBy(desc(teamChallenge.createdAt))
    .limit(1);

  return row ?? null;
}

export interface MemberWeeklySignals {
  /** Tagessignale, aufsteigend (heute zuletzt), Länge = WEEK_DAYS. */
  days: DailyScoreInput[];
  /** Heutige Signale inkl. Schritte (für Member-Karten). */
  today: MemberDailyStatusInput;
  /** Wöchentlicher Check-in diese Woche erledigt (Bonus +50 Punkte). */
  weeklyCheckinDone: boolean;
}

interface DayAccumulator {
  workoutCompleted: boolean;
  waterMl: number;
  nutritionLogged: boolean;
  habitsCompleted: number;
  steps: number | null;
  reactionsSent: number;
}

function emptyDay(): DayAccumulator {
  return {
    workoutCompleted: false,
    waterMl: 0,
    nutritionLogged: false,
    habitsCompleted: 0,
    steps: null,
    reactionsSent: 0,
  };
}

/**
 * Lädt die Tagessignale aller Mitglieder über die letzten 7 Tage und verdichtet
 * sie zu DailyScoreInput je Tag. Punktequellen ausschließlich aus nicht-sensiblen
 * Signalen (Training, Schritte, Ernährung geloggt, Wasserziel, Habits, Reaktionen).
 */
export async function loadMemberWeeklySignals(
  memberUserIds: string[],
  groupId: string,
  todayStr: string,
): Promise<Map<string, MemberWeeklySignals>> {
  if (memberUserIds.length === 0) return new Map();

  const dateKeys = lastNDateStrings(todayStr, WEEK_DAYS); // aufsteigend
  const sinceStr = dateKeys[0];
  const dateSet = new Set(dateKeys);

  // Untere Schranke für Timestamp-Queries: ein Tag vor dem frühesten Berlin-Tag
  // (UTC), damit kein Berlin-Tag durch den Zeitzonen-Offset verloren geht.
  const [sy, sm, sd] = sinceStr.split("-").map(Number);
  const tsLowerBound = new Date(Date.UTC(sy, sm - 1, sd - 1));

  const thisWeekMonday = getWeekMondayIso(todayStr);

  const [workouts, nutritionLogs, habitLogs, stepLogs, reactions, targets, checkins] =
    await Promise.all([
      db
        .select({
          userId: workoutSession.userId,
          completedAt: workoutSession.completedAt,
        })
        .from(workoutSession)
        .where(
          and(
            inArray(workoutSession.userId, memberUserIds),
            eq(workoutSession.status, "completed"),
            gte(workoutSession.completedAt, tsLowerBound),
          ),
        ),
      db
        .select({
          userId: dailyNutritionLog.userId,
          logDate: dailyNutritionLog.logDate,
          proteinG: dailyNutritionLog.proteinG,
          waterMl: dailyNutritionLog.waterMl,
          mealsStatus: dailyNutritionLog.mealsStatus,
        })
        .from(dailyNutritionLog)
        .where(
          and(
            inArray(dailyNutritionLog.userId, memberUserIds),
            gte(dailyNutritionLog.logDate, sinceStr),
          ),
        ),
      db
        .select({
          userId: dailyHabitLog.userId,
          logDate: dailyHabitLog.logDate,
        })
        .from(dailyHabitLog)
        .where(
          and(
            inArray(dailyHabitLog.userId, memberUserIds),
            eq(dailyHabitLog.completed, true),
            gte(dailyHabitLog.logDate, sinceStr),
          ),
        ),
      db
        .select({
          userId: dailyStepLog.userId,
          logDate: dailyStepLog.logDate,
          steps: dailyStepLog.steps,
        })
        .from(dailyStepLog)
        .where(
          and(
            inArray(dailyStepLog.userId, memberUserIds),
            gte(dailyStepLog.logDate, sinceStr),
          ),
        ),
      db
        .select({
          userId: socialReaction.userId,
          createdAt: socialReaction.createdAt,
        })
        .from(socialReaction)
        .where(
          and(
            eq(socialReaction.groupId, groupId),
            inArray(socialReaction.userId, memberUserIds),
            gte(socialReaction.createdAt, tsLowerBound),
          ),
        ),
      db
        .select({
          userId: nutritionTarget.userId,
          waterMl: nutritionTarget.waterMl,
        })
        .from(nutritionTarget)
        .where(
          and(
            inArray(nutritionTarget.userId, memberUserIds),
            eq(nutritionTarget.active, true),
          ),
        ),
      db
        .select({ userId: weeklyBodyCheckin.userId })
        .from(weeklyBodyCheckin)
        .where(
          and(
            inArray(weeklyBodyCheckin.userId, memberUserIds),
            eq(weeklyBodyCheckin.weekDate, thisWeekMonday),
          ),
        ),
    ]);

  const waterTargetByUser = new Map<string, number>();
  for (const t of targets) waterTargetByUser.set(t.userId, t.waterMl);

  const checkinDoneSet = new Set(checkins.map((c) => c.userId));

  // member -> dateStr -> accumulator
  const acc = new Map<string, Map<string, DayAccumulator>>();
  for (const uid of memberUserIds) {
    const dayMap = new Map<string, DayAccumulator>();
    for (const dk of dateKeys) dayMap.set(dk, emptyDay());
    acc.set(uid, dayMap);
  }

  for (const w of workouts) {
    if (!w.completedAt) continue;
    const day = toBerlinDate(w.completedAt);
    if (!dateSet.has(day)) continue;
    const entry = acc.get(w.userId)?.get(day);
    if (entry) entry.workoutCompleted = true;
  }

  for (const n of nutritionLogs) {
    if (!dateSet.has(n.logDate)) continue;
    const entry = acc.get(n.userId)?.get(n.logDate);
    if (!entry) continue;
    const mealsLogged = n.mealsStatus
      ? Object.values(n.mealsStatus).some(Boolean)
      : false;
    entry.nutritionLogged = (n.proteinG != null && n.proteinG > 0) || mealsLogged;
    entry.waterMl = n.waterMl ?? 0;
  }

  for (const h of habitLogs) {
    if (!dateSet.has(h.logDate)) continue;
    const entry = acc.get(h.userId)?.get(h.logDate);
    if (entry) entry.habitsCompleted += 1;
  }

  for (const s of stepLogs) {
    if (!dateSet.has(s.logDate)) continue;
    const entry = acc.get(s.userId)?.get(s.logDate);
    if (entry) entry.steps = s.steps;
  }

  for (const r of reactions) {
    const day = toBerlinDate(r.createdAt);
    if (!dateSet.has(day)) continue;
    const entry = acc.get(r.userId)?.get(day);
    if (entry) entry.reactionsSent += 1;
  }

  const todayKey = dateKeys[dateKeys.length - 1];
  const result = new Map<string, MemberWeeklySignals>();

  for (const uid of memberUserIds) {
    const dayMap = acc.get(uid)!;
    const waterTarget = waterTargetByUser.get(uid) ?? null;

    const days: DailyScoreInput[] = dateKeys.map((dk) => {
      const a = dayMap.get(dk)!;
      return {
        workoutCompleted: a.workoutCompleted,
        stepsGoalReached: isStepsGoalReached(a.steps),
        nutritionLogged: a.nutritionLogged,
        waterGoalReached: waterTarget != null && a.waterMl >= waterTarget,
        habitsCompleted: a.habitsCompleted,
        reactionsSent: a.reactionsSent,
      };
    });

    const todayAcc = dayMap.get(todayKey)!;
    const today: MemberDailyStatusInput = {
      ...days[days.length - 1],
      steps: todayAcc.steps,
    };

    result.set(uid, { days, today, weeklyCheckinDone: checkinDoneSet.has(uid) });
  }

  return result;
}
