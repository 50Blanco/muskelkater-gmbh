import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  socialGroup,
  socialGroupMember,
  teamChallenge,
  userProfile,
} from "@/db/schema";
import { getTodayBerlin } from "@/lib/utils/date";
import {
  applyRankingPrivacy,
  buildLeaderboard,
  calculateWeeklyScore,
  determineChallengeWinner,
  getOpenPointSources,
  POINTS,
  type LeaderboardEntry,
  type PointSource,
  type WinnerResult,
} from "./challenge-scoring";
import { loadMemberWeeklySignals } from "./team-queries";
import { getManyUserPrivacy } from "./get-user-privacy";
import type { ChallengeStatus } from "@/lib/validation/challenge";

/**
 * Server-only Loader für /team/challenges/[challengeId].
 * Security: Nur Mitglieder des zugehörigen Teams erhalten Daten.
 * Privacy: Keine Körperwerte, Messwerte oder sensiblen Felder.
 */

export interface ChallengeDetailData {
  challenge: {
    id: string;
    groupId: string;
    title: string;
    stakeText: string | null;
    startsOn: string;
    endsOn: string;
    status: ChallengeStatus;
  };
  group: { id: string; name: string };
  leaderboard: LeaderboardEntry[];
  winner: WinnerResult | null;
  isEnded: boolean;
  ownOpenSources: PointSource[];
  checkinOpenThisWeek: boolean;
  ownScore: number;
}

export async function getChallengeDetail(
  userId: string,
  challengeId: string,
): Promise<ChallengeDetailData | null> {
  const todayStr = getTodayBerlin();

  // 1. Challenge laden
  const [challengeRow] = await db
    .select({
      id: teamChallenge.id,
      groupId: teamChallenge.groupId,
      title: teamChallenge.title,
      stakeText: teamChallenge.stakeText,
      startsOn: teamChallenge.startsOn,
      endsOn: teamChallenge.endsOn,
      status: teamChallenge.status,
    })
    .from(teamChallenge)
    .where(eq(teamChallenge.id, challengeId))
    .limit(1);

  if (!challengeRow) return null;

  // 2. Membership prüfen (Defense-in-Depth zusätzlich zu RLS)
  const [membership] = await db
    .select({ id: socialGroupMember.id })
    .from(socialGroupMember)
    .where(
      and(
        eq(socialGroupMember.groupId, challengeRow.groupId),
        eq(socialGroupMember.userId, userId),
      ),
    )
    .limit(1);

  if (!membership) return null;

  // 3. Gruppe + alle Mitglieder parallel laden
  const [groupRows, memberRows] = await Promise.all([
    db
      .select({ id: socialGroup.id, name: socialGroup.name })
      .from(socialGroup)
      .where(eq(socialGroup.id, challengeRow.groupId))
      .limit(1),
    db
      .select({
        userId: socialGroupMember.userId,
        displayName: userProfile.displayName,
      })
      .from(socialGroupMember)
      .leftJoin(userProfile, eq(userProfile.userId, socialGroupMember.userId))
      .where(eq(socialGroupMember.groupId, challengeRow.groupId)),
  ]);

  const groupRow = groupRows[0];
  if (!groupRow) return null;

  const memberUserIds = memberRows.map((m) => m.userId);

  // 4. Wochensignale + Privacy-Settings parallel laden
  const [signals, privacyMap] = await Promise.all([
    loadMemberWeeklySignals(memberUserIds, challengeRow.groupId, todayStr),
    getManyUserPrivacy(memberUserIds),
  ]);

  // 5. Scored list + Leaderboard (Score immer aus vollen Signalen — fair)
  const scored = memberRows.map((m) => {
    const sig = signals.get(m.userId);
    const baseScore = sig ? calculateWeeklyScore(sig.days) : 0;
    const checkinBonus = sig?.weeklyCheckinDone ? POINTS.bodyCheckin : 0;
    return {
      userId: m.userId,
      displayName: m.displayName ?? "Mitglied",
      score: baseScore + checkinBonus,
    };
  });

  const rawLeaderboard = buildLeaderboard(scored, userId);
  const leaderboard = applyRankingPrivacy(rawLeaderboard, privacyMap);

  // 6. Beendet-Status: explizit gesetzt oder Enddatum überschritten
  const isEnded =
    challengeRow.status !== "active" || challengeRow.endsOn < todayStr;

  // 7. Gewinner nur für beendete Challenges — aus dem unmaskierten Leaderboard
  const winner = isEnded ? determineChallengeWinner(rawLeaderboard) : null;

  // 8. Eigene offene Quellen für „Heute noch Punkte holen"
  const ownSig = signals.get(userId);
  const ownOpenSources: PointSource[] = ownSig
    ? getOpenPointSources(ownSig.today)
    : [];
  const checkinOpenThisWeek = ownSig ? !ownSig.weeklyCheckinDone : false;

  const ownEntry = leaderboard.find((e) => e.isCurrentUser);
  const ownScore = ownEntry?.score ?? 0;

  return {
    challenge: challengeRow,
    group: groupRow,
    leaderboard,
    winner,
    isEnded,
    ownOpenSources,
    checkinOpenThisWeek,
    ownScore,
  };
}
