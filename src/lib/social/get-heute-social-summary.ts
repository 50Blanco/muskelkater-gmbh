import "server-only";
import { getTodayBerlin } from "@/lib/utils/date";
import type { FeedEvent, SocialGroupInfo } from "./get-social-dashboard";
import { getTeamDashboard } from "./get-team-dashboard";
import type { ActiveChallenge } from "./team-queries";
import {
  buildChallengeLabel,
  type LeaderboardEntry,
  type MemberDailyStatus,
  type PointSource,
} from "./challenge-scoring";

/**
 * Server-only Loader für den Social-V2-Block auf `/heute`.
 * Verdichtete Sicht: Challenge-Label, eigene Platzierung, heute offene
 * Punktequellen, kompakte Team-Statuskarten und ein kurzer Feed.
 * Baut auf getTeamDashboard auf (eine Query-Kette, kein Doppel-Load).
 */

export interface HeuteMemberStatus {
  userId: string;
  displayName: string;
  isCurrentUser: boolean;
  status: MemberDailyStatus;
}

export interface HeuteSocialSummary {
  hasTeam: boolean;
  group: SocialGroupInfo | null;
  currentUserId: string;
  challenge: ActiveChallenge | null;
  challengeLabel: string | null;
  ownRank: LeaderboardEntry | null;
  memberCount: number;
  ownOpenSources: PointSource[];
  members: HeuteMemberStatus[];
  feed: FeedEvent[];
}

const HEUTE_FEED_LIMIT = 5;
const HEUTE_MEMBER_LIMIT = 6;

export async function getHeuteSocialSummary(
  userId: string,
): Promise<HeuteSocialSummary> {
  const team = await getTeamDashboard(userId);

  if (!team.hasTeam || !team.group) {
    return {
      hasTeam: false,
      group: null,
      currentUserId: userId,
      challenge: null,
      challengeLabel: null,
      ownRank: null,
      memberCount: 0,
      ownOpenSources: [],
      members: [],
      feed: [],
    };
  }

  const todayStr = getTodayBerlin();
  const challengeLabel = team.challenge
    ? buildChallengeLabel(team.challenge, todayStr)
    : null;

  const own = team.members.find((m) => m.isCurrentUser);

  const members: HeuteMemberStatus[] = team.members
    .slice(0, HEUTE_MEMBER_LIMIT)
    .map((m) => ({
      userId: m.userId,
      displayName: m.displayName,
      isCurrentUser: m.isCurrentUser,
      status: m.status,
    }));

  return {
    hasTeam: true,
    group: team.group,
    currentUserId: userId,
    challenge: team.challenge,
    challengeLabel,
    ownRank: team.ownRank,
    memberCount: team.members.length,
    ownOpenSources: own ? own.status.openSources : [],
    members,
    feed: team.feed.slice(0, HEUTE_FEED_LIMIT),
  };
}
