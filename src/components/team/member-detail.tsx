import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Droplets,
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
import type {
  MemberDetailData,
  MemberDetailDay,
} from "@/lib/social/get-team-member-detail";
import { SocialReactionButtons } from "@/components/social/social-reaction-buttons";
import { StepsInput } from "./steps-input";

const WEEKDAY_LABELS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function weekdayShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return WEEKDAY_LABELS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function stepsStatusText(
  done: boolean,
  steps: number | null,
): string {
  if (done) return "erreicht";
  if (steps !== null) return "offen";
  return "keine Daten";
}

/* ------------------------------------------------------------------ */
/* StatusRow                                                           */
/* ------------------------------------------------------------------ */

interface StatusRowProps {
  Icon: typeof Dumbbell;
  label: string;
  done: boolean;
  statusText: string;
  detail?: string;
}

function StatusRow({ Icon, label, done, statusText, detail }: StatusRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-border bg-surface px-3.5 py-2.5">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full",
            done ? "bg-success/15 text-success" : "bg-surface-3 text-muted",
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {detail && (
          <span className="hidden text-xs text-dim sm:block">{detail}</span>
        )}
        <span
          className={cn(
            "text-xs font-medium",
            done ? "text-success" : "text-dim",
          )}
        >
          {statusText}
        </span>
        {done ? (
          <CheckCircle2 className="size-4 shrink-0 text-success" />
        ) : (
          <Circle className="size-4 shrink-0 text-dim" />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* WeekBarChart                                                        */
/* ------------------------------------------------------------------ */

interface BarChartProps {
  days: MemberDetailDay[];
  today: string;
}

function WeekBarChart({ days, today }: BarChartProps) {
  const maxScore = Math.max(...days.map((d) => d.dailyScore), 1);

  return (
    <div className="space-y-1">
      {/* Score labels above bars */}
      <div className="flex gap-1.5">
        {days.map((day) => (
          <span
            key={day.date}
            className="flex-1 text-center text-[10px] tabular-nums text-muted"
          >
            {day.dailyScore > 0 ? day.dailyScore : ""}
          </span>
        ))}
      </div>

      {/* Bars — items-end aligns each bar to the bottom */}
      <div className="flex items-end gap-1.5 h-16">
        {days.map((day) => {
          const barH = (day.dailyScore / maxScore) * 64;
          const isToday = day.date === today;
          const hasScore = day.dailyScore > 0;
          return (
            <div
              key={day.date}
              className={cn(
                "flex-1 rounded-t-sm transition-all",
                isToday && hasScore
                  ? "bg-accent"
                  : hasScore
                    ? "bg-accent/35"
                    : isToday
                      ? "bg-surface-3 opacity-50"
                      : "bg-surface-3 opacity-25",
              )}
              style={{ height: `${Math.max(barH, 3)}px` }}
            />
          );
        })}
      </div>

      {/* X-axis weekday labels */}
      <div className="flex gap-1.5 pt-0.5 border-t border-border/40">
        {days.map((day) => (
          <span
            key={day.date}
            className={cn(
              "flex-1 pt-1 text-center text-[10px]",
              day.date === today
                ? "font-semibold text-foreground"
                : "text-dim",
            )}
          >
            {weekdayShort(day.date)}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MemberDetail                                                        */
/* ------------------------------------------------------------------ */

interface Props {
  data: MemberDetailData;
}

/** Sichere Mitglieder-Detailansicht — keine sensiblen Körper-/Ernährungsdaten. */
export function MemberDetail({ data }: Props) {
  const today = getTodayBerlin();

  const weekWorkouts = data.week.filter((d) => d.workoutDone).length;
  const weekNutrition = data.week.filter((d) => d.nutritionLogged).length;
  const weekHabits = data.week.reduce((sum, d) => sum + d.habitsCompleted, 0);
  const weekStepsDays = data.week.filter((d) => d.stepsGoalReached).length;
  const activeDays = data.week.filter((d) => d.dailyScore > 0).length;

  const bestDay = data.week.reduce<MemberDetailDay | null>(
    (best, d) => (best === null || d.dailyScore > best.dailyScore ? d : best),
    null,
  );
  const bestDayLabel =
    bestDay && bestDay.dailyScore > 0 ? weekdayShort(bestDay.date) : "—";

  return (
    <div className="space-y-6">
      <Link
        href="/team"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="size-4" />
        Zurück zum Team
      </Link>

      {/* 1. Header */}
      <PageHeader
        eyebrow={data.isCurrentUser ? "Dein Team-Profil" : "Team-Mitglied"}
        title={data.displayName + (data.isCurrentUser ? " (Du)" : "")}
        subtitle={
          data.isCurrentUser
            ? "Deine letzten 7 Tage im Team."
            : "Sicherer Wochenstatus — ohne sensible Daten."
        }
      />

      {/* 2. Summary stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            { label: "Punkte · Woche", value: String(data.weeklyScore) },
            { label: "Punkte · Heute", value: String(data.today.dailyScore) },
            { label: "Aktive Tage", value: String(activeDays) },
            { label: "Bester Tag", value: bestDayLabel },
          ] as const
        ).map(({ label, value }) => (
          <div
            key={label}
            className="rounded-[var(--radius-sm)] border border-border bg-surface-2 px-3.5 py-3"
          >
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* 3. Heute-Status */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Heute</CardTitle>
            <p className="text-xs text-muted">Tagesstatus</p>
          </div>
          {data.today.dailyScore > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-sm font-semibold text-accent">
              <Trophy className="size-3.5" />
              +{data.today.dailyScore} Pkt
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          <StatusRow
            Icon={Dumbbell}
            label="Training"
            done={data.today.workoutDone}
            statusText={data.today.workoutDone ? "erledigt" : "offen"}
          />
          <StatusRow
            Icon={Utensils}
            label="Ernährung"
            done={data.today.nutritionLogged}
            statusText={data.today.nutritionLogged ? "geloggt" : "offen"}
            detail={
              data.meals.total > 0
                ? `${data.meals.logged}/${data.meals.total} Mahlzeiten`
                : undefined
            }
          />
          <StatusRow
            Icon={Droplets}
            label="Wasser"
            done={data.today.waterGoalReached}
            statusText={data.today.waterGoalReached ? "erreicht" : "offen"}
          />
          <StatusRow
            Icon={Footprints}
            label="Schritte"
            done={data.today.stepsGoalReached}
            statusText={stepsStatusText(
              data.today.stepsGoalReached,
              data.today.steps,
            )}
            detail={
              data.today.steps != null
                ? `${data.today.steps.toLocaleString("de-DE")} Schritte`
                : undefined
            }
          />
          <StatusRow
            Icon={Repeat2}
            label="Habits"
            done={data.today.habitsCompleted > 0}
            statusText={data.today.habitsCompleted > 0 ? "erledigt" : "offen"}
            detail={
              data.today.habitsCompleted > 0
                ? `${data.today.habitsCompleted}× heute`
                : undefined
            }
          />
        </CardContent>
      </Card>

      {/* 7. Schritte eintragen — nur eigenes Profil, direkt nach Heute */}
      {data.isCurrentUser && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schritte heute eintragen</CardTitle>
            <p className="text-xs text-muted">
              Manuell — Ziel sind 8.000 Schritte pro Tag.
            </p>
          </CardHeader>
          <CardContent>
            <StepsInput date={today} initialSteps={data.today.steps} />
          </CardContent>
        </Card>
      )}

      {/* 4. Punkteverlauf (Balkendiagramm) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Punkteverlauf</CardTitle>
          <p className="text-xs text-muted">Letzte 7 Tage</p>
        </CardHeader>
        <CardContent>
          <WeekBarChart days={data.week} today={today} />
        </CardContent>
      </Card>

      {/* 6. Signale der Woche */}
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
            statusText={data.today.workoutDone ? "heute erledigt" : "heute offen"}
            detail={`${weekWorkouts}× diese Woche`}
          />
          <StatusRow
            Icon={Utensils}
            label="Ernährung"
            done={data.today.nutritionLogged}
            statusText={data.today.nutritionLogged ? "heute geloggt" : "heute offen"}
            detail={`${weekNutrition}× geloggt`}
          />
          <StatusRow
            Icon={Footprints}
            label="Schritte"
            done={data.today.stepsGoalReached}
            statusText={
              data.today.stepsGoalReached ? "Ziel heute" : "Ziel offen"
            }
            detail={`${weekStepsDays}× Ziel diese Woche`}
          />
          <StatusRow
            Icon={Repeat2}
            label="Habits"
            done={data.today.habitsCompleted > 0}
            statusText={
              data.today.habitsCompleted > 0 ? "heute aktiv" : "heute offen"
            }
            detail={`${weekHabits}× diese Woche`}
          />
        </CardContent>
      </Card>

      {/* 8. Motivation — nur für andere Mitglieder */}
      {!data.isCurrentUser && (
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-accent">
              <Heart className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base">Motivation senden</CardTitle>
              <p className="text-xs text-muted">
                Schick{" "}
                <span className="font-medium text-foreground">
                  {data.displayName}
                </span>{" "}
                einen kurzen Push.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <SocialReactionButtons
              groupId={data.groupId}
              targetType="member_week"
              targetId={data.userId}
              reactions={data.motivationReactions}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
