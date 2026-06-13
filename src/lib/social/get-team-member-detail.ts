import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { dailyNutritionLog, socialReaction } from "@/db/schema";
import type { ReactionCounts } from "./get-social-dashboard";
import { getTodayBerlin, lastNDateStrings } from "@/lib/utils/date";
import { getSocialDashboard } from "./get-social-dashboard";
import { loadMemberWeeklySignals, WEEK_DAYS } from "./team-queries";
import {
  calculateDailyScore,
  calculateWeeklyScore,
  canViewMemberDetail,
  getMemberDailyStatus,
  sanitizeSocialMealStatus,
  type MemberDailyStatus,
  type SafeMealStatus,
} from "./challenge-scoring";

/**
 * Server-only Loader für `/team/[memberId]`.
 * Sicherheit: gibt null zurück, wenn kein gemeinsames Team besteht (→ notFound).
 * Es werden ausschließlich nicht-sensible Signale geladen — kein Gewicht,
 * keine Körpermaße, keine Kalorien/Protein-Details, keine Safety-Daten.
 */

export interface MemberDetailDay {
  date: string;
  workoutDone: boolean;
  nutritionLogged: boolean;
  waterGoalReached: boolean;
  stepsGoalReached: boolean;
  habitsCompleted: number;
  dailyScore: number;
}

export interface MemberDetailData {
  userId: string;
  displayName: string;
  isCurrentUser: boolean;
  groupId: string;
  today: MemberDailyStatus;
  weeklyScore: number;
  week: MemberDetailDay[];
  /** Heutiger Mahlzeiten-Status — nur Häkchen-Zähler, keine Details. */
  meals: SafeMealStatus;
  /** Reaktionen des Viewers gegenüber diesem Mitglied (targetType: member_week). */
  motivationReactions: ReactionCounts;
}

export async function getTeamMemberDetail(
  viewerUserId: string,
  targetUserId: string,
): Promise<MemberDetailData | null> {
  const social = await getSocialDashboard(viewerUserId);
  if (!social.activeGroup) return null;

  const sharedMemberUserIds = social.members.map((m) => m.userId);
  if (!canViewMemberDetail(viewerUserId, targetUserId, sharedMemberUserIds)) {
    return null;
  }

  const displayName =
    social.members.find((m) => m.userId === targetUserId)?.displayName ??
    "Mitglied";

  const todayStr = getTodayBerlin();
  const dateKeys = lastNDateStrings(todayStr, WEEK_DAYS);

  const signals = await loadMemberWeeklySignals(
    [targetUserId],
    social.activeGroup.id,
    todayStr,
  );
  const sig = signals.get(targetUserId);

  const week: MemberDetailDay[] = dateKeys.map((date, i) => {
    const day = sig?.days[i];
    return {
      date,
      workoutDone: day?.workoutCompleted ?? false,
      nutritionLogged: day?.nutritionLogged ?? false,
      waterGoalReached: day?.waterGoalReached ?? false,
      stepsGoalReached: day?.stepsGoalReached ?? false,
      habitsCompleted: day?.habitsCompleted ?? 0,
      dailyScore: day ? calculateDailyScore(day) : 0,
    };
  });

  const today = getMemberDailyStatus(
    sig?.today ?? {
      workoutCompleted: false,
      stepsGoalReached: false,
      nutritionLogged: false,
      waterGoalReached: false,
      habitsCompleted: 0,
      reactionsSent: 0,
      steps: null,
    },
  );

  // Nur der boolesche Mahlzeiten-Status (keine Kalorien/Protein-Spalten gelesen).
  const [todayNutrition, motivationRows] = await Promise.all([
    db
      .select({ mealsStatus: dailyNutritionLog.mealsStatus })
      .from(dailyNutritionLog)
      .where(
        and(
          eq(dailyNutritionLog.userId, targetUserId),
          eq(dailyNutritionLog.logDate, todayStr),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]),
    db
      .select({ reactionType: socialReaction.reactionType })
      .from(socialReaction)
      .where(
        and(
          eq(socialReaction.groupId, social.activeGroup.id),
          eq(socialReaction.userId, viewerUserId),
          eq(socialReaction.targetType, "member_week"),
          eq(socialReaction.targetId, targetUserId),
        ),
      ),
  ]);

  const motivationReactions: ReactionCounts = {
    stark: { count: 0, mine: false },
    weiter_so: { count: 0, mine: false },
    respekt: { count: 0, mine: false },
  };
  for (const row of motivationRows) {
    const key = row.reactionType as keyof ReactionCounts;
    if (key in motivationReactions) {
      motivationReactions[key] = { count: 1, mine: true };
    }
  }

  return {
    userId: targetUserId,
    displayName,
    isCurrentUser: targetUserId === viewerUserId,
    groupId: social.activeGroup.id,
    today,
    weeklyScore: sig ? calculateWeeklyScore(sig.days) : 0,
    week,
    meals: sanitizeSocialMealStatus(todayNutrition?.mealsStatus),
    motivationReactions,
  };
}
