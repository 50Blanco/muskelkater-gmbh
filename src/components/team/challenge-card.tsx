import { Flag, Trophy, Users2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
          <div className="rounded-[var(--radius-sm)] border border-accent/30 bg-accent-soft/40 px-4 py-3.5 space-y-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
              <Trophy className="size-3 shrink-0" />
              Aktive Challenge
            </span>
            <p className="font-display text-base font-semibold text-foreground">
              {challenge.title}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span>{daysLabel(getChallengeDaysRemaining(challenge.endsOn, today))}</span>
              <span className="inline-flex items-center gap-1">
                <Users2 className="size-3 shrink-0" />
                {memberCount} {memberCount === 1 ? "Teilnehmer" : "Teilnehmer"}
              </span>
            </div>
            {challenge.stakeText && (
              <p className="flex items-center gap-1.5 text-sm text-muted">
                <Flag className="size-3.5 shrink-0" />
                Einsatz: {challenge.stakeText}
              </p>
            )}
          </div>
        ) : (
          <p className="rounded-[var(--radius-sm)] border border-dashed border-border bg-surface/40 px-4 py-4 text-center text-sm text-muted">
            Noch keine aktive Challenge — startet gemeinsam ein Ziel.
          </p>
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
