import "server-only";
import { getTodayBerlin } from "@/lib/utils/date";
import {
  getSocialDashboard,
  type FeedEvent,
  type SocialGroupInfo,
  type SocialGroupRole,
} from "./get-social-dashboard";
import {
  getActiveChallenge,
  loadMemberWeeklySignals,
  type ActiveChallenge,
} from "./team-queries";
import {
  buildLeaderboard,
  buildSupportHints,
  calculateWeeklyScore,
  findOwnRank,
  getMemberDailyStatus,
  POINTS,
  type LeaderboardEntry,
  type MemberDailyStatus,
  type MemberDailyStatusInput,
  type SupportHint,
} from "./challenge-scoring";

/**
 * Server-only Loader für `/team`.
 * Baut auf getSocialDashboard auf (Gruppe, Mitglieder, Feed) und ergänzt
 * Challenge, Wochen-Punkte, Rangliste, Tagesstatus und Support-Hinweise.
 * Membership wird in getSocialDashboard serverseitig erzwungen — keine fremden Teams.
 */

export interface TeamMemberCard {
  userId: string;
  displayName: string;
  role: SocialGroupRole;
  weeklyScore: number;
  rank: number;
  isCurrentUser: boolean;
  status: MemberDailyStatus;
  weeklyCheckinDone: boolean;
}

export interface TeamDashboardData {
  hasTeam: boolean;
  group: SocialGroupInfo | null;
  currentUserId: string;
  challenge: ActiveChallenge | null;
  members: TeamMemberCard[];
  leaderboard: LeaderboardEntry[];
  ownRank: LeaderboardEntry | null;
  supportHints: SupportHint[];
  feed: FeedEvent[];
}

const TEAM_FEED_LIMIT = 12;

const EMPTY_TODAY: MemberDailyStatusInput = {
  workoutCompleted: false,
  stepsGoalReached: false,
  nutritionLogged: false,
  waterGoalReached: false,
  habitsCompleted: 0,
  reactionsSent: 0,
  steps: null,
};

export async function getTeamDashboard(
  userId: string,
): Promise<TeamDashboardData> {
  const social = await getSocialDashboard(userId);

  if (!social.activeGroup) {
    return {
      hasTeam: false,
      group: null,
      currentUserId: userId,
      challenge: null,
      members: [],
      leaderboard: [],
      ownRank: null,
      supportHints: [],
      feed: [],
    };
  }

  const group = social.activeGroup;
  const todayStr = getTodayBerlin();
  const memberUserIds = social.members.map((m) => m.userId);

  const [challenge, signals] = await Promise.all([
    getActiveChallenge(group.id),
    loadMemberWeeklySignals(memberUserIds, group.id, todayStr),
  ]);

  const scored = social.members.map((m) => {
    const sig = signals.get(m.userId);
    const baseScore = sig ? calculateWeeklyScore(sig.days) : 0;
    const checkinBonus = sig?.weeklyCheckinDone ? POINTS.bodyCheckin : 0;
    const weeklyScore = baseScore + checkinBonus;
    const status = getMemberDailyStatus(sig ? sig.today : EMPTY_TODAY);
    const weeklyCheckinDone = sig?.weeklyCheckinDone ?? false;
    return { ...m, weeklyScore, status, weeklyCheckinDone };
  });

  const leaderboard = buildLeaderboard(
    scored.map((s) => ({
      userId: s.userId,
      displayName: s.displayName,
      score: s.weeklyScore,
    })),
    userId,
  );
  const rankByUser = new Map(leaderboard.map((e) => [e.userId, e.rank]));

  const members: TeamMemberCard[] = scored
    .map((s) => ({
      userId: s.userId,
      displayName: s.displayName,
      role: s.role,
      weeklyScore: s.weeklyScore,
      rank: rankByUser.get(s.userId) ?? 0,
      isCurrentUser: s.userId === userId,
      status: s.status,
      weeklyCheckinDone: s.weeklyCheckinDone,
    }))
    .sort(
      (a, b) =>
        a.rank - b.rank || a.displayName.localeCompare(b.displayName, "de"),
    );

  const supportHints = buildSupportHints(
    scored.map((s) => ({
      userId: s.userId,
      displayName: s.displayName,
      activeToday: s.status.activeToday,
      isCurrentUser: s.userId === userId,
    })),
  );

  return {
    hasTeam: true,
    group,
    currentUserId: userId,
    challenge,
    members,
    leaderboard,
    ownRank: findOwnRank(leaderboard),
    supportHints,
    feed: social.feed.slice(0, TEAM_FEED_LIMIT),
  };
}
