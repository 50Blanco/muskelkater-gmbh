import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { weeklyBodyCheckin } from "@/db/schema";
import { getTodayBerlin, getWeekMondayIso } from "@/lib/utils/date";
import { getSocialDashboard } from "@/lib/social/get-social-dashboard";
import {
  loadMemberWeeklySignals,
  getActiveChallenge,
  WEEK_DAYS,
} from "@/lib/social/team-queries";
import {
  getMemberDailyStatus,
  buildLeaderboard,
  calculateWeeklyScore,
  findOwnRank,
  POINTS,
  daysBetween,
  type MemberDailyStatusInput,
} from "@/lib/social/challenge-scoring";
import type { CoachAllInputs } from "./coach-rules";

/**
 * Phase 15 — Server-only Loader für die Coach-Seite.
 * Baut alle vier Coach-Eingaben aus vorhandenen DB-Quellen zusammen.
 * Keine Körperwerte (Gewicht, Maße, Kalorien) in der Ausgabe.
 */

const NULL_TODAY: MemberDailyStatusInput = {
  workoutCompleted: false,
  stepsGoalReached: false,
  nutritionLogged: false,
  waterGoalReached: false,
  habitsCompleted: 0,
  reactionsSent: 0,
  steps: null,
};

export async function getCoachDashboard(
  userId: string,
): Promise<CoachAllInputs> {
  const todayStr = getTodayBerlin();
  const thisWeekMonday = getWeekMondayIso(todayStr);

  const social = await getSocialDashboard(userId);
  const hasTeam = social.activeGroup != null;
  const groupId = social.activeGroup?.id ?? "";

  // Immer den eigenen User einbeziehen (auch ohne Team)
  const memberUserIds =
    social.members.length > 0
      ? social.members.map((m) => m.userId)
      : [userId];

  const [signals, challenge, checkinRows] = await Promise.all([
    loadMemberWeeklySignals(memberUserIds, groupId, todayStr),
    hasTeam ? getActiveChallenge(groupId) : Promise.resolve(null),
    db
      .select({ id: weeklyBodyCheckin.id })
      .from(weeklyBodyCheckin)
      .where(
        and(
          eq(weeklyBodyCheckin.userId, userId),
          eq(weeklyBodyCheckin.weekDate, thisWeekMonday),
        ),
      )
      .limit(1),
  ]);

  const checkinDone = checkinRows[0] != null;
  const ownSignals = signals.get(userId);
  const ownTodayInput = ownSignals?.today ?? { ...NULL_TODAY };
  const ownWeekDays = ownSignals?.days ?? [];
  const ownStatus = getMemberDailyStatus(ownTodayInput);

  /* ---- Heute ---- */
  const today = {
    workoutDone: ownStatus.workoutDone,
    nutritionLogged: ownStatus.nutritionLogged,
    waterGoalReached: ownStatus.waterGoalReached,
    stepsGoalReached: ownStatus.stepsGoalReached,
    habitsCompleted: ownStatus.habitsCompleted,
    checkinDoneThisWeek: checkinDone,
  };

  /* ---- Team ---- */
  const otherMembers = social.members.filter((m) => m.userId !== userId);
  const inactiveMembersToday = otherMembers.filter((m) => {
    const sig = signals.get(m.userId);
    if (!sig) return true;
    return !getMemberDailyStatus(sig.today).activeToday;
  }).length;

  const team = {
    hasTeam,
    memberCount: social.members.length,
    inactiveMembersToday,
    allMembersActive:
      hasTeam && otherMembers.length > 0 && inactiveMembersToday === 0,
  };

  /* ---- Challenge ---- */
  let challengeInput: CoachAllInputs["challenge"];
  if (!challenge || !hasTeam) {
    challengeInput = {
      hasChallenge: false,
      isActive: false,
      challengeTitle: null,
      daysRemaining: null,
      ownRank: null,
      totalMembers: social.members.length,
      ownOpenSourceCount: ownStatus.openSources.length,
    };
  } else {
    const leaderboard = buildLeaderboard(
      social.members.map((m) => {
        const sig = signals.get(m.userId);
        const base = sig ? calculateWeeklyScore(sig.days) : 0;
        const bonus = sig?.weeklyCheckinDone ? POINTS.bodyCheckin : 0;
        return { userId: m.userId, displayName: m.displayName, score: base + bonus };
      }),
      userId,
    );
    const ownRankEntry = findOwnRank(leaderboard);
    const remaining =
      challenge.status === "active"
        ? Math.max(0, daysBetween(todayStr, challenge.endsOn))
        : null;

    challengeInput = {
      hasChallenge: true,
      isActive: challenge.status === "active",
      challengeTitle: challenge.title,
      daysRemaining: remaining,
      ownRank: ownRankEntry?.rank ?? null,
      totalMembers: social.members.length,
      ownOpenSourceCount: ownStatus.openSources.length,
    };
  }

  /* ---- Woche ---- */
  // Tage seit Montag (Mon=1, Di=2, … So=7)
  const mondayMs = new Date(thisWeekMonday + "T00:00:00Z").getTime();
  const todayMs = new Date(todayStr + "T00:00:00Z").getTime();
  const daysElapsed = Math.min(
    WEEK_DAYS,
    Math.max(1, Math.floor((todayMs - mondayMs) / 86_400_000) + 1),
  );

  // Nur Tage der aktuellen Woche aus dem 7-Tage-Rolling-Window
  const thisWeekDays = ownWeekDays.slice(WEEK_DAYS - daysElapsed);

  const activeDaysCount = thisWeekDays.filter(
    (d) =>
      d.workoutCompleted ||
      d.nutritionLogged ||
      d.waterGoalReached ||
      d.stepsGoalReached ||
      d.habitsCompleted > 0,
  ).length;

  const week = {
    activeDaysCount,
    workoutCount: thisWeekDays.filter((d) => d.workoutCompleted).length,
    nutritionDaysCount: thisWeekDays.filter((d) => d.nutritionLogged).length,
    stepsGoalDays: thisWeekDays.filter((d) => d.stepsGoalReached).length,
    checkinDoneThisWeek: checkinDone,
    daysElapsedInWeek: daysElapsed,
  };

  return { today, team, challenge: challengeInput, week };
}
