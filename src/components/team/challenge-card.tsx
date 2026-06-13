import Link from "next/link";
import { ArrowRight, Flag, Rocket, Trophy, Users2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getTodayBerlin } from "@/lib/utils/date";
import { getChallengeDaysRemaining } from "@/lib/social/challenge-scoring";
import type { ActiveChallenge } from "@/lib/social/team-queries";
import { CreateChallengeForm } from "./create-challenge-form";

interface Props {
  groupId: string;
  challenge: ActiveChallenge | null;
  defaultStart: string;
  defaultEnd: string;
  memberCount: number;
}

function daysLabel(remaining: number): string {
  if (remaining < 0) return "Abgeschlossen";
  if (remaining === 0) return "Letzter Tag";
  return `Noch ${remaining} ${remaining === 1 ? "Tag" : "Tage"}`;
}

function challengeProgressPct(
  startsOn: string,
  endsOn: string,
  today: string,
): number {
  const start = new Date(startsOn).getTime();
  const end = new Date(endsOn).getTime();
  const now = new Date(today).getTime();
  const total = end - start;
  if (total <= 0) return 100;
  const elapsed = Math.max(0, Math.min(now - start, total));
  return Math.round((elapsed / total) * 100);
}

export function ChallengeCard({
  groupId,
  challenge,
  defaultStart,
  defaultEnd,
  memberCount,
}: Props) {
  const today = getTodayBerlin();

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-accent">
          <Trophy className="size-5" />
        </span>
        <div>
          <CardTitle>Team-Challenge</CardTitle>
          <p className="text-xs text-muted">
            Ein gemeinsames Ziel — Punkte kommen aus eurem Alltag.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {challenge ? (
          <div className="space-y-3 rounded-[var(--radius-sm)] border border-accent/30 bg-accent-soft/40 px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                  <Trophy className="size-3 shrink-0" />
                  Aktive Challenge
                </span>
                <p className="font-display text-base font-semibold text-foreground">
                  {challenge.title}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-sm font-semibold tabular-nums text-accent">
                {daysLabel(getChallengeDaysRemaining(challenge.endsOn, today))}
              </span>
            </div>

            {/* Fortschrittsbalken */}
            <div className="space-y-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-accent/20">
                <div
                  className="h-1.5 rounded-full bg-accent transition-all"
                  style={{
                    width: `${challengeProgressPct(challenge.startsOn, challenge.endsOn, today)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>{challenge.startsOn}</span>
                <div className="flex items-center gap-1">
                  <Users2 className="size-3 shrink-0" />
                  {memberCount} {memberCount === 1 ? "Teilnehmer" : "Teilnehmer"}
                </div>
                <span>{challenge.endsOn}</span>
              </div>
            </div>

            {challenge.stakeText && (
              <p className="flex items-center gap-1.5 text-sm text-muted">
                <Flag className="size-3.5 shrink-0" />
                Einsatz: {challenge.stakeText}
              </p>
            )}

            <Link
              href={`/team/challenges/${challenge.id}`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Challenge ansehen
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="rounded-[var(--radius-sm)] border border-dashed border-border bg-surface/40 px-4 py-5 text-center">
            <span className="mx-auto mb-3 grid size-10 place-items-center rounded-[12px] bg-surface-3 text-muted">
              <Rocket className="size-5" />
            </span>
            <p className="text-sm font-semibold text-foreground">
              Noch keine aktive Challenge
            </p>
            <p className="mt-1 text-xs text-muted">
              Startet gemeinsam ein Ziel und sammelt Punkte aus eurem Alltag.
            </p>
          </div>
        )}

        <CreateChallengeForm
          groupId={groupId}
          defaultStart={defaultStart}
          defaultEnd={defaultEnd}
          hasActive={challenge !== null}
        />
      </CardContent>
    </Card>
  );
}
