import Link from "next/link";
import { ArrowRight, Footprints, Trophy, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { HeuteSocialSummary } from "@/lib/social/get-heute-social-summary";
import { MemberStatusPills } from "@/components/team/member-status-pills";
import { TeamEmptyState } from "@/components/team/team-empty-state";
import { StepsInput } from "@/components/team/steps-input";
import { SocialFeed } from "./social-feed";

interface Props {
  summary: HeuteSocialSummary;
}

/** Social-V2-Block auf /heute: Challenge + eigener Stand + Team-Status + Feed. */
export function HeuteSocialV2({ summary }: Props) {
  if (!summary.hasTeam || !summary.group) {
    return <TeamEmptyState />;
  }

  const {
    ownRank,
    ownOpenSources,
    challengeLabel,
    challenge,
    members,
    feed,
    group,
    todaySteps,
    todayDate,
  } = summary;

  return (
    <Card className="sm:col-span-2">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-accent">
            <Users2 className="size-5" />
          </span>
          <div className="min-w-0">
            <CardTitle className="truncate">{group.name}</CardTitle>
            <p className="text-xs text-muted">
              {summary.memberCount}{" "}
              {summary.memberCount === 1 ? "Mitglied" : "Mitglieder"} · heute
            </p>
          </div>
        </div>
        <Link
          href="/team"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          Zum Team
          <ArrowRight className="size-4" />
        </Link>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Challenge + eigener Stand */}
        {challenge ? (
          <div className="rounded-[var(--radius-sm)] border border-accent/25 bg-accent-soft/40 px-4 py-3">
            <p className="flex items-center gap-1.5 font-display text-sm font-semibold text-foreground">
              <Trophy className="size-4 shrink-0 text-accent" />
              {challengeLabel}
            </p>
            {challenge.stakeText && (
              <p className="mt-1 text-xs text-muted">
                Einsatz: {challenge.stakeText}
              </p>
            )}
            <p className="mt-1.5 text-sm text-muted">
              {ownRank ? (
                <>
                  Du:{" "}
                  <span className="font-semibold text-foreground">
                    Platz {ownRank.rank}
                  </span>{" "}
                  · {ownRank.score} Punkte
                </>
              ) : (
                "Sammle heute deine ersten Punkte."
              )}
            </p>
            <p className="mt-1 text-xs text-dim">
              {ownOpenSources.length > 0
                ? `Heute offen: ${ownOpenSources.map((s) => s.label).join(", ")}`
                : "Heute alles erledigt — stark!"}
            </p>
          </div>
        ) : (
          <div className="rounded-[var(--radius-sm)] border border-dashed border-border bg-surface/40 px-4 py-4">
            <p className="text-sm font-semibold text-foreground">
              Keine aktive Team-Challenge
            </p>
            <p className="mt-1 text-xs text-muted">
              Starte eine Challenge und sammelt gemeinsam Punkte.
            </p>
            <Link
              href="/team"
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "mt-3",
              )}
            >
              Challenge starten
              <ArrowRight className="size-4" />
            </Link>
          </div>
        )}

        {/* Schritte Quick-Add */}
        <div className="rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Footprints className="size-4 shrink-0 text-muted" />
            Schritte heute
          </p>
          <StepsInput date={todayDate} initialSteps={todaySteps} />
        </div>

        {/* Team-Status-Karten */}
        <div className="grid gap-2 sm:grid-cols-2">
          {members.map((member) => (
            <Link
              key={member.userId}
              href={`/team/${member.userId}`}
              className={cn(
                "group block rounded-[var(--radius-sm)] border bg-surface px-3 py-2.5 transition-colors hover:bg-surface-3",
                member.isCurrentUser
                  ? "border-accent/40 bg-accent-soft/40"
                  : "border-border",
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-medium text-foreground">
                  {member.displayName}
                  {member.isCurrentUser && (
                    <span className="text-muted"> (Du)</span>
                  )}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  {member.status.dailyScore > 0 && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold tabular-nums text-accent">
                      +{member.status.dailyScore}
                    </span>
                  )}
                  <ArrowRight className="size-3.5 text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                </div>
              </div>
              <MemberStatusPills status={member.status} />
            </Link>
          ))}
        </div>

        {/* Kompakter Feed */}
        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-dim">
            Aktivitäten
          </p>
          <SocialFeed events={feed} groupId={group.id} />
        </div>
      </CardContent>
    </Card>
  );
}
