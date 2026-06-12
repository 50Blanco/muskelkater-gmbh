import "server-only";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  dailyHabitLog,
  dailyMission,
  socialGroup,
  socialGroupMember,
  socialReaction,
  userProfile,
  workoutSession,
} from "@/db/schema";
import type { SocialReactionType, SocialTargetType } from "@/lib/validation/social";

export type { SocialReactionType, SocialTargetType };

export type SocialGroupRole = "owner" | "member";

export interface SocialGroupInfo {
  id: string;
  name: string;
  inviteCode: string;
  role: SocialGroupRole;
  memberCount: number;
}

export interface GroupMemberInfo {
  userId: string;
  displayName: string;
  role: SocialGroupRole;
}

export type ReactionCounts = {
  [K in SocialReactionType]: { count: number; mine: boolean };
};

export interface FeedEvent {
  id: string;
  userId: string;
  displayName: string;
  eventType: SocialTargetType;
  eventText: string;
  occurredAt: Date;
  reactions: ReactionCounts;
}

export interface SocialDashboardData {
  groups: SocialGroupInfo[];
  activeGroup: SocialGroupInfo | null;
  members: GroupMemberInfo[];
  feed: FeedEvent[];
}

const EMPTY_REACTIONS: ReactionCounts = {
  stark: { count: 0, mine: false },
  weiter_so: { count: 0, mine: false },
  respekt: { count: 0, mine: false },
};

const EVENT_TEXT: Record<SocialTargetType, string> = {
  workout_session: "hat eine Trainingseinheit abgeschlossen",
  daily_mission: "hat eine Mission erledigt",
  daily_habit_log: "hat eine Gewohnheit abgehakt",
};

/**
 * Lädt alle Social-Dashboard-Daten für den eingeloggten Nutzer.
 * Server-only: läuft als Drizzle-Direktverbindung (bypasses RLS).
 * Security: Gruppen, Mitglieder und Feed-Events werden serverseitig auf
 * Mitgliedschaft eingeschränkt — keine fremden Gruppen, keine sensiblen Felder.
 */
export async function getSocialDashboard(
  userId: string,
): Promise<SocialDashboardData> {
  const userGroups = await db
    .select({
      id: socialGroup.id,
      name: socialGroup.name,
      inviteCode: socialGroup.inviteCode,
      role: socialGroupMember.role,
    })
    .from(socialGroupMember)
    .innerJoin(socialGroup, eq(socialGroupMember.groupId, socialGroup.id))
    .where(eq(socialGroupMember.userId, userId))
    .orderBy(socialGroupMember.createdAt);

  if (userGroups.length === 0) {
    return { groups: [], activeGroup: null, members: [], feed: [] };
  }

  const activeGroupRaw = userGroups[0];
  const activeGroupId = activeGroupRaw.id;

  const memberships = await db
    .select({
      userId: socialGroupMember.userId,
      role: socialGroupMember.role,
    })
    .from(socialGroupMember)
    .where(eq(socialGroupMember.groupId, activeGroupId));

  const memberUserIds = memberships.map((m) => m.userId);

  const profiles =
    memberUserIds.length > 0
      ? await db
          .select({
            userId: userProfile.userId,
            displayName: userProfile.displayName,
          })
          .from(userProfile)
          .where(inArray(userProfile.userId, memberUserIds))
      : [];

  const nameMap = new Map(
    profiles.map((p) => [p.userId, p.displayName ?? "Mitglied"]),
  );

  const members: GroupMemberInfo[] = memberships.map((m) => ({
    userId: m.userId,
    displayName: nameMap.get(m.userId) ?? "Mitglied",
    role: m.role as SocialGroupRole,
  }));

  const groups: SocialGroupInfo[] = userGroups.map((g) => ({
    id: g.id,
    name: g.name,
    inviteCode: g.inviteCode,
    role: g.role as SocialGroupRole,
    memberCount: g.id === activeGroupId ? memberships.length : 0,
  }));

  const activeGroup: SocialGroupInfo = {
    ...groups[0],
    memberCount: memberships.length,
  };

  if (memberUserIds.length === 0) {
    return { groups, activeGroup, members, feed: [] };
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  const [workoutRows, missionRows, habitRows] = await Promise.all([
    db
      .select({
        id: workoutSession.id,
        userId: workoutSession.userId,
        occurredAt: workoutSession.completedAt,
      })
      .from(workoutSession)
      .where(
        and(
          inArray(workoutSession.userId, memberUserIds),
          eq(workoutSession.status, "completed"),
          gte(workoutSession.completedAt, sevenDaysAgo),
        ),
      )
      .orderBy(desc(workoutSession.completedAt))
      .limit(30),

    db
      .select({
        id: dailyMission.id,
        userId: dailyMission.userId,
        occurredAt: dailyMission.updatedAt,
      })
      .from(dailyMission)
      .where(
        and(
          inArray(dailyMission.userId, memberUserIds),
          eq(dailyMission.status, "done"),
          gte(dailyMission.missionDate, sevenDaysAgoStr),
        ),
      )
      .orderBy(desc(dailyMission.updatedAt))
      .limit(30),

    db
      .select({
        id: dailyHabitLog.id,
        userId: dailyHabitLog.userId,
        occurredAt: dailyHabitLog.updatedAt,
      })
      .from(dailyHabitLog)
      .where(
        and(
          inArray(dailyHabitLog.userId, memberUserIds),
          eq(dailyHabitLog.completed, true),
          gte(dailyHabitLog.logDate, sevenDaysAgoStr),
        ),
      )
      .orderBy(desc(dailyHabitLog.updatedAt))
      .limit(30),
  ]);

  type RawEvent = {
    id: string;
    userId: string;
    eventType: SocialTargetType;
    occurredAt: Date;
  };

  const rawEvents: RawEvent[] = [
    ...workoutRows
      .filter((r) => r.occurredAt !== null)
      .map((r) => ({
        id: r.id,
        userId: r.userId,
        eventType: "workout_session" as const,
        occurredAt: r.occurredAt as Date,
      })),
    ...missionRows.map((r) => ({
      id: r.id,
      userId: r.userId,
      eventType: "daily_mission" as const,
      occurredAt: r.occurredAt,
    })),
    ...habitRows.map((r) => ({
      id: r.id,
      userId: r.userId,
      eventType: "daily_habit_log" as const,
      occurredAt: r.occurredAt,
    })),
  ];

  rawEvents.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  const topEvents = rawEvents.slice(0, 30);

  const allTargetIds = topEvents.map((e) => e.id);
  const reactionRows =
    allTargetIds.length > 0
      ? await db
          .select({
            targetId: socialReaction.targetId,
            userId: socialReaction.userId,
            reactionType: socialReaction.reactionType,
          })
          .from(socialReaction)
          .where(
            and(
              eq(socialReaction.groupId, activeGroupId),
              inArray(socialReaction.targetId, allTargetIds),
            ),
          )
      : [];

  const reactionMap = new Map<string, ReactionCounts>();
  for (const ev of topEvents) {
    reactionMap.set(ev.id, {
      stark: { count: 0, mine: false },
      weiter_so: { count: 0, mine: false },
      respekt: { count: 0, mine: false },
    });
  }
  for (const r of reactionRows) {
    const counts = reactionMap.get(r.targetId);
    if (!counts) continue;
    const key = r.reactionType as SocialReactionType;
    counts[key].count += 1;
    if (r.userId === userId) counts[key].mine = true;
  }

  const feed: FeedEvent[] = topEvents.map((e) => ({
    id: e.id,
    userId: e.userId,
    displayName: nameMap.get(e.userId) ?? "Mitglied",
    eventType: e.eventType,
    eventText: EVENT_TEXT[e.eventType],
    occurredAt: e.occurredAt,
    reactions: reactionMap.get(e.id) ?? { ...EMPTY_REACTIONS },
  }));

  return { groups, activeGroup, members, feed };
}
