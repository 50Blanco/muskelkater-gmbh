import { Flag, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTodayBerlin } from "@/lib/utils/date";
import { buildChallengeLabel } from "@/lib/social/challenge-scoring";
import type { ActiveChallenge } from "@/lib/social/team-queries";
import { CreateChallengeForm } from "./create-challenge-form";

interface Props {
  groupId: string;
  challenge: ActiveChallenge | null;
  defaultStart: string;
  defaultEnd: string;
}

export function ChallengeCard({
  groupId,
  challenge,
  defaultStart,
  defaultEnd,
}: Props) {
  const label = challenge
    ? buildChallengeLabel(challenge, getTodayBerlin())
    : null;

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
          <div className="rounded-[var(--radius-sm)] border border-accent/30 bg-accent-soft/40 px-4 py-3.5">
            <p className="font-display text-base font-semibold text-foreground">
              {label}
            </p>
            {challenge.stakeText && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
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
