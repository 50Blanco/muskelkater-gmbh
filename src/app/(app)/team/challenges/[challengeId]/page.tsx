import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Dumbbell,
  Droplets,
  Flag,
  Footprints,
  Trophy,
  Utensils,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getChallengeDetail } from "@/lib/social/get-challenge-detail";
import { groupIdSchema } from "@/lib/validation/challenge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { TeamLeaderboard } from "@/components/team/team-leaderboard";
import { cn } from "@/lib/utils";
import type { WinnerResult } from "@/lib/social/challenge-scoring";
import type { PointSource } from "@/lib/social/challenge-scoring";

export const metadata: Metadata = { title: "Challenge" };

interface Props {
  params: Promise<{ challengeId: string }>;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}.${m}.${y}`;
}

function daysRemaining(endsOn: string, today: string): number {
  const toUtcDays = (s: string): number => {
    const [y, m, d] = s.split("-").map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  };
  return toUtcDays(endsOn) - toUtcDays(today);
}

function WinnerBanner({ winner }: { winner: WinnerResult }) {
  if (winner.isTie || !winner.winner) {
    return (
      <div className="rounded-[var(--radius-sm)] border border-success/30 bg-success/10 px-4 py-3">
        <p className="flex items-center gap-2 font-display text-sm font-semibold text-success">
          <Trophy className="size-4 shrink-0" />
          Unentschieden
        </p>
        <p className="mt-1 text-xs text-muted">Starkes Team-Ergebnis — knappes Rennen!</p>
      </div>
    );
  }
  return (
    <div className="rounded-[var(--radius-sm)] border border-success/30 bg-success/10 px-4 py-3">
      <p className="flex items-center gap-2 font-display text-sm font-semibold text-success">
        <Trophy className="size-4 shrink-0" />
        {winner.winner.displayName} hat die Challenge gewonnen!
      </p>
      <p className="mt-1 text-xs text-muted">
        {winner.winner.score} Punkte · Starke Leistung!
      </p>
    </div>
  );
}

const OPEN_SOURCE_ICONS: Record<string, React.ElementType> = {
  workout: Dumbbell,
  steps: Footprints,
  nutrition: Utensils,
  water: Droplets,
  habit: CheckCircle2,
};

function OpenSourcesCard({
  openSources,
  checkinOpen,
}: {
  openSources: PointSource[];
  checkinOpen: boolean;
}) {
  const allOpen = [...openSources];
  const hasCheckin = checkinOpen;

  if (allOpen.length === 0 && !hasCheckin) {
    return (
      <div className="rounded-[var(--radius-sm)] border border-success/30 bg-success/10 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          Heute alles erledigt — stark!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {allOpen.map(({ key, label }) => {
        const Icon = OPEN_SOURCE_ICONS[key] ?? Circle;
        return (
          <div
            key={key}
            className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2"
          >
            <Circle className="size-3.5 shrink-0 text-dim" />
            <Icon className="size-3.5 shrink-0 text-muted" />
            <span className="text-sm text-foreground">{label}</span>
            <span className="ml-auto text-xs font-semibold text-accent">
              +{key === "workout" ? 30 : key === "steps" ? 20 : key === "nutrition" ? 15 : key === "water" ? 10 : 10} Pkt
            </span>
          </div>
        );
      })}
      {hasCheckin && (
        <div className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2">
          <Circle className="size-3.5 shrink-0 text-dim" />
          <ClipboardCheck className="size-3.5 shrink-0 text-muted" />
          <span className="text-sm text-foreground">Wochen-Check-in</span>
          <span className="ml-auto text-xs font-semibold text-accent">+50 Pkt</span>
        </div>
      )}
    </div>
  );
}

export default async function ChallengeDetailPage({ params }: Props) {
  const { challengeId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // challengeId muss UUID-Format haben
  const parsed = groupIdSchema.safeParse(challengeId);
  if (!parsed.success) notFound();

  const data = await getChallengeDetail(user.id, parsed.data);
  if (!data) notFound();

  const { challenge, group, leaderboard, winner, isEnded, ownOpenSources, checkinOpenThisWeek, ownScore } = data;

  // Heute (UTC-stabil für verbleibende Tage)
  const today = new Date().toISOString().slice(0, 10);
  const remaining = daysRemaining(challenge.endsOn, today);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/team"
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Zurück zum Team
        </Link>
      </div>

      <PageHeader
        eyebrow={group.name}
        title={challenge.title}
        subtitle={
          isEnded
            ? "Challenge abgeschlossen"
            : remaining === 0
            ? "Letzter Tag"
            : remaining > 0
            ? `Noch ${remaining} ${remaining === 1 ? "Tag" : "Tage"}`
            : "Challenge abgeschlossen"
        }
      />

      {/* Challenge-Info */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          {/* Status-Pill */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                isEnded
                  ? "bg-surface-3 text-muted"
                  : "bg-accent/15 text-accent",
              )}
            >
              <Trophy className="size-3" />
              {isEnded ? "Abgeschlossen" : "Aktiv"}
            </span>
            {!isEnded && remaining >= 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 px-3 py-1 text-xs font-semibold text-accent">
                {remaining === 0 ? "Letzter Tag" : `Noch ${remaining} ${remaining === 1 ? "Tag" : "Tage"}`}
              </span>
            )}
          </div>

          {/* Datum */}
          <div className="flex items-center gap-2 text-sm text-muted">
            <Calendar className="size-4 shrink-0" />
            <span>
              {formatDate(challenge.startsOn)} – {formatDate(challenge.endsOn)}
            </span>
          </div>

          {challenge.stakeText && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Flag className="size-4 shrink-0" />
              <span>Einsatz: {challenge.stakeText}</span>
            </div>
          )}

          {/* Eigene Punkte */}
          <div className="rounded-[var(--radius-sm)] border border-accent/20 bg-accent-soft/30 px-3 py-2">
            <p className="text-xs text-muted">Deine Punkte diese Woche</p>
            <p className="font-display text-xl font-semibold tabular-nums text-foreground">
              {ownScore}
              <span className="ml-1 text-sm font-normal text-muted">Punkte</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Gewinner-Banner (nur wenn beendet) */}
      {isEnded && winner && (
        <WinnerBanner winner={winner} />
      )}

      {/* Rangliste */}
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
          <TeamLeaderboard entries={leaderboard} />
        </CardContent>
      </Card>

      {/* Heute noch Punkte holen (nur aktive Challenges) */}
      {!isEnded && (
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-accent">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base">Heute noch Punkte holen</CardTitle>
              <p className="text-xs text-muted">
                Was du heute noch erledigen kannst.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <OpenSourcesCard
              openSources={ownOpenSources}
              checkinOpen={checkinOpenThisWeek}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
