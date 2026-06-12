import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Dumbbell,
  Footprints,
  Heart,
  Repeat2,
  Trophy,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTodayBerlin } from "@/lib/utils/date";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import type { MemberDetailData } from "@/lib/social/get-team-member-detail";
import { MemberStatusPills } from "./member-status-pills";
import { StepsInput } from "./steps-input";

const WEEKDAY_LETTERS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function weekdayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return WEEKDAY_LETTERS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

interface RowProps {
  Icon: typeof Dumbbell;
  label: string;
  done: boolean;
  detail: string;
}

function StatusRow({ Icon, label, done, detail }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-border bg-surface px-3.5 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-3 text-muted">
          <Icon className="size-3.5" />
        </span>
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">{detail}</span>
        {done ? (
          <CheckCircle2 className="size-4 text-success" />
        ) : (
          <Circle className="size-4 text-dim" />
        )}
      </div>
    </div>
  );
}

interface Props {
  data: MemberDetailData;
}

/** Sichere Mitglieder-Detailansicht — keine sensiblen Körper-/Ernährungsdaten. */
export function MemberDetail({ data }: Props) {
  const weekWorkouts = data.week.filter((d) => d.workoutDone).length;
  const weekNutrition = data.week.filter((d) => d.nutritionLogged).length;
  const weekHabits = data.week.reduce((sum, d) => sum + d.habitsCompleted, 0);
  const weekStepsDays = data.week.filter((d) => d.stepsGoalReached).length;

  return (
    <div className="space-y-6">
      <Link
        href="/team"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="size-4" />
        Zurück zum Team
      </Link>

      <PageHeader
        eyebrow={data.isCurrentUser ? "Dein Wochenstatus" : "Team-Mitglied"}
        title={data.displayName + (data.isCurrentUser ? " (Du)" : "")}
        subtitle="Letzte 7 Tage · nur nicht-sensible Signale."
      />

      {/* Heute + Punkte */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Heute</CardTitle>
            <p className="text-xs text-muted">Tagesstatus</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-sm font-semibold text-accent">
            <Trophy className="size-3.5" />
            {data.weeklyScore}
            <span className="text-xs font-normal">Pkt / Woche</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <MemberStatusPills status={data.today} />
          {!data.today.activeToday && (
            <p className="text-xs text-dim">
              Heute noch nichts erfasst — der Tag ist noch jung.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Wochenübersicht */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wochenübersicht</CardTitle>
          <p className="text-xs text-muted">
            Aktive Tage der letzten Woche (Punkte pro Tag).
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5">
            {data.week.map((day) => {
              const active = day.dailyScore > 0;
              return (
                <div
                  key={day.date}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span className="text-[11px] text-dim">
                    {weekdayLabel(day.date)}
                  </span>
                  <div
                    className={cn(
                      "grid h-11 w-full place-items-center rounded-[var(--radius-sm)] border text-xs font-semibold tabular-nums",
                      active
                        ? "border-accent/40 bg-accent-soft text-accent"
                        : "border-border bg-surface text-dim",
                    )}
                  >
                    {active ? day.dailyScore : "·"}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Signale der Woche */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signale</CardTitle>
          <p className="text-xs text-muted">Woraus die Punkte entstehen.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatusRow
            Icon={Dumbbell}
            label="Training"
            done={data.today.workoutDone}
            detail={`${weekWorkouts}× diese Woche`}
          />
          <StatusRow
            Icon={Utensils}
            label="Ernährung"
            done={data.today.nutritionLogged}
            detail={
              data.meals.total > 0
                ? `${data.meals.logged}/${data.meals.total} Mahlzeiten heute`
                : `${weekNutrition}× geloggt`
            }
          />
          <StatusRow
            Icon={Footprints}
            label="Schritte"
            done={data.today.stepsGoalReached}
            detail={
              data.today.steps != null
                ? `${data.today.steps.toLocaleString("de-DE")} heute · ${weekStepsDays}× Ziel`
                : `${weekStepsDays}× Ziel diese Woche`
            }
          />
          <StatusRow
            Icon={Repeat2}
            label="Habits"
            done={data.today.habitsCompleted > 0}
            detail={`${weekHabits}× diese Woche`}
          />
        </CardContent>
      </Card>

      {/* Schritte eintragen (nur eigenes Profil) */}
      {data.isCurrentUser && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schritte heute eintragen</CardTitle>
            <p className="text-xs text-muted">
              Manuell — Ziel sind 8.000 Schritte pro Tag.
            </p>
          </CardHeader>
          <CardContent>
            <StepsInput date={getTodayBerlin()} initialSteps={data.today.steps} />
          </CardContent>
        </Card>
      )}

      {/* Motivation */}
      {!data.isCurrentUser && (
        <Card>
          <CardContent className="flex items-center gap-2.5 py-4 text-sm text-muted">
            <Heart className="size-4 shrink-0 text-accent" />
            Motiviere {data.displayName} mit einer Reaktion im{" "}
            <Link href="/team" className="text-accent hover:underline">
              Team-Feed
            </Link>
            .
          </CardContent>
        </Card>
      )}
    </div>
  );
}
