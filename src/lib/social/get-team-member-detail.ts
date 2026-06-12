import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { dailyNutritionLog } from "@/db/schema";
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
  today: MemberDailyStatus;
  weeklyScore: number;
  week: MemberDetailDay[];
  /** Heutiger Mahlzeiten-Status — nur Häkchen-Zähler, keine Details. */
  meals: SafeMealStatus;
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
  const [todayNutrition] = await db
    .select({ mealsStatus: dailyNutritionLog.mealsStatus })
    .from(dailyNutritionLog)
    .where(
      and(
        eq(dailyNutritionLog.userId, targetUserId),
        eq(dailyNutritionLog.logDate, todayStr),
      ),
    )
    .limit(1);

  return {
    userId: targetUserId,
    displayName,
    isCurrentUser: targetUserId === viewerUserId,
    today,
    weeklyScore: sig ? calculateWeeklyScore(sig.days) : 0,
    week,
    meals: sanitizeSocialMealStatus(todayNutrition?.mealsStatus),
  };
}
