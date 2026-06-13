import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Activity, LifeBuoy, Trophy, Users2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTeamDashboard } from "@/lib/social/get-team-dashboard";
import { addDaysToIso, getTodayBerlin } from "@/lib/utils/date";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TeamHeader } from "@/components/team/team-header";
import { TeamEmptyState } from "@/components/team/team-empty-state";
import { ChallengeCard } from "@/components/team/challenge-card";
import { TeamLeaderboard } from "@/components/team/team-leaderboard";
import { MemberCard } from "@/components/team/member-card";
import { SupportHints } from "@/components/team/support-hints";
import { InviteCode } from "@/components/team/invite-code";
import { SocialFeed } from "@/components/social/social-feed";

export const metadata: Metadata = { title: "Team" };

/** Default-Challenge-Dauer für das Formular. */
const DEFAULT_CHALLENGE_DAYS = 30;

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getTeamDashboard(user.id);
  const today = getTodayBerlin();
  const defaultEnd = addDaysToIso(today, DEFAULT_CHALLENGE_DAYS);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team"
        title="Dein Team"
        subtitle="Status sehen · Challenge verfolgen · motivieren."
      />

      {!data.hasTeam || !data.group ? (
        <TeamEmptyState />
      ) : (
        <>
          <TeamHeader group={data.group} />

          {data.group.memberCount === 1 && (
            <div className="rounded-[var(--radius)] border border-dashed border-accent/30 bg-accent-soft/20 px-4 py-3.5">
              <p className="text-sm font-semibold text-foreground">
                Dein Team ist noch klein.
              </p>
              <p className="mt-1 text-xs text-muted">
                Lade jemanden ein, damit die Challenge spannend wird.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-dim">
                <span>Einladungscode</span>
                <InviteCode code={data.group.inviteCode} />
              </div>
            </div>
          )}

          <ChallengeCard
            groupId={data.group.id}
            challenge={data.challenge}
            defaultStart={today}
            defaultEnd={defaultEnd}
            memberCount={data.members.length}
          />

          {data.members.length > 1 && (
            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface-3 text-muted">
                  <Trophy className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-base">Rangliste</CardTitle>
                  <p className="text-xs text-muted">
                    Punkte dieser Woche — unterstützend gemeint, kein Pranger.
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <TeamLeaderboard entries={data.leaderboard} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface-3 text-muted">
                <Users2 className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">Team-Mitglieder</CardTitle>
                <p className="text-xs text-muted">
                  Tippe auf ein Mitglied für den sicheren Wochenstatus.
                </p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2.5 sm:grid-cols-2">
              {data.members.map((member) => (
                <MemberCard key={member.userId} member={member} />
              ))}
            </CardContent>
          </Card>

          {data.supportHints.length > 0 && (
            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-accent">
                  <LifeBuoy className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-base">Heute pushen</CardTitle>
                  <p className="text-xs text-muted">
                    Ein kurzer Push motiviert mehr als jede Statistik.
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <SupportHints hints={data.supportHints} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface-3 text-muted">
                <Activity className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">Aktivitäten</CardTitle>
                <p className="text-xs text-muted">Letzte Einträge im Team.</p>
              </div>
            </CardHeader>
            <CardContent>
              <SocialFeed events={data.feed} groupId={data.group.id} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
