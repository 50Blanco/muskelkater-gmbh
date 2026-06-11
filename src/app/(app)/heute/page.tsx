import type { Metadata } from "next";
import {
  ArrowRight,
  Circle,
  CheckCircle2,
  Droplets,
  Dumbbell,
  Flame,
  Moon,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  coachRecommendation,
  dailyMission,
  fitnessGoal,
  nutritionTarget,
  userProfile,
  workoutSession,
} from "@/db/schema";
import { getActiveTrainingPlan } from "@/lib/training/get-active-plan";
import { selectNextDay } from "@/lib/plan/select-next-day";
import { GOAL_TYPE_LABELS } from "@/lib/training/labels";
import { restartOnboarding } from "@/app/(onboarding)/actions";
import { PageHeader } from "@/components/layout/page-header";
import { StartWorkoutButton } from "@/components/workout/start-workout-button";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Heute" };

/** Statische, regelbasierte Coach-Hinweise (Phase 7 bringt die echte Engine). */
const COACH_TIPS: Record<string, string> = {
  build_muscle:
    "Konstanz schlägt Intensität: Lieber jede Woche alle Einheiten sauber durchziehen als einmal alles geben.",
  lose_fat:
    "Dein Defizit ist moderat geplant — bleib geduldig. Protein und Schlaf machen den Unterschied.",
  get_fit:
    "Fang locker an und steigere dich langsam. Der beste Plan ist der, den du durchhältst.",
  strength:
    "Technik vor Gewicht: Saubere Wiederholungen bringen dich schneller voran als schwere, unsaubere.",
  maintain:
    "Routine ist dein Werkzeug: Gleiche Trainingstage jede Woche machen das Halten fast automatisch.",
};

function formatLiters(waterMl: number): string {
  return `${(waterMl / 1000).toLocaleString("de-DE", {
    maximumFractionDigits: 1,
  })} l`;
}

export default async function HeutePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login"); // Proxy sichert die Route; hier Defense-in-Depth.

  const todayLabel = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const todayIso = new Date().toLocaleDateString("en-CA");

  const [profile] = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.userId, user.id))
    .limit(1);

  /* Alt-Nutzer des Phase-1-Platzhalters: Flag gesetzt, aber kein Profil. */
  if (!profile?.onboardingCompletedAt) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow={todayLabel}
          title="Servus."
          subtitle="Ein Schritt fehlt noch, bevor es losgeht."
        />
        <Card>
          <CardHeader>
            <CardTitle>Dein Profil ist noch nicht eingerichtet</CardTitle>
            <p className="text-sm text-muted">
              Beantworte ein paar kurze Fragen — danach erstellen wir deinen
              ersten Trainingsplan und deine Ernährungsziele.
            </p>
          </CardHeader>
          <CardContent>
            <form action={restartOnboarding}>
              <Button type="submit" size="lg">
                Onboarding starten
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [plan, [goal], [target], missions, [recommendation], [lastCompleted]] =
    await Promise.all([
      getActiveTrainingPlan(user.id),
      db
        .select()
        .from(fitnessGoal)
        .where(
          and(eq(fitnessGoal.userId, user.id), eq(fitnessGoal.active, true)),
        )
        .orderBy(desc(fitnessGoal.createdAt))
        .limit(1),
      db
        .select()
        .from(nutritionTarget)
        .where(
          and(
            eq(nutritionTarget.userId, user.id),
            eq(nutritionTarget.active, true),
          ),
        )
        .orderBy(desc(nutritionTarget.createdAt))
        .limit(1),
      db
        .select()
        .from(dailyMission)
        .where(
          and(
            eq(dailyMission.userId, user.id),
            eq(dailyMission.missionDate, todayIso),
          ),
        )
        .orderBy(asc(dailyMission.createdAt)),
      db
        .select()
        .from(coachRecommendation)
        .where(
          and(
            eq(coachRecommendation.userId, user.id),
            eq(coachRecommendation.dismissed, false),
          ),
        )
        .orderBy(desc(coachRecommendation.createdAt))
        .limit(1),
      db
        .select({ completedAt: workoutSession.completedAt })
        .from(workoutSession)
        .where(
          and(
            eq(workoutSession.userId, user.id),
            eq(workoutSession.status, "completed"),
          ),
        )
        .orderBy(desc(workoutSession.completedAt))
        .limit(1),
    ]);

  const days = plan?.days ?? [];
  const nextDay = selectNextDay(days);
  const workoutDoneToday = lastCompleted?.completedAt
    ? lastCompleted.completedAt.toLocaleDateString("en-CA") === todayIso
    : false;
  const goalLabel = goal ? GOAL_TYPE_LABELS[goal.goalType] : null;
  const coachMessage =
    recommendation?.message ??
    (goal ? COACH_TIPS[goal.goalType] : COACH_TIPS.get_fit);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={todayLabel}
        title={`Servus, ${profile.displayName ?? "Athlet"}.`}
        subtitle={
          goalLabel
            ? `Ziel: ${goalLabel} — dein Plan ist bereit.`
            : "Dein Plan ist bereit."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Heute empfohlen */}
        <Card className="sm:col-span-2">
          <CardHeader className="flex-row items-center gap-3">
            <span className="grid size-10 place-items-center rounded-[12px] bg-accent text-accent-foreground">
              <Dumbbell className="size-5" />
            </span>
            <div>
              <CardTitle>Heute empfohlen</CardTitle>
              <p className="text-sm text-muted">
                {plan ? plan.name : "Noch kein aktiver Plan."}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {workoutDoneToday ? (
              <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-success/40 bg-success/10 px-4 py-3.5">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                <div>
                  <p className="font-display text-base font-semibold text-foreground">
                    Workout erledigt — stark gemacht.
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    Deine Einheit für heute ist gespeichert. Gönn dir die
                    Erholung.
                  </p>
                </div>
              </div>
            ) : nextDay ? (
              <>
                <div className="rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3.5">
                  <p className="font-display text-base font-semibold text-foreground">
                    {nextDay.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {[
                      nextDay.focus,
                      `${nextDay.exercises.length} ${
                        nextDay.exercises.length === 1 ? "Übung" : "Übungen"
                      }`,
                      nextDay.estMinutes != null
                        ? `ca. ${nextDay.estMinutes} Min.`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <StartWorkoutButton dayId={nextDay.id} />
                  <Link
                    href={`/training#day-${nextDay.dayIndex}`}
                    className={buttonVariants({
                      variant: "secondary",
                      size: "md",
                    })}
                  >
                    Plan ansehen
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="rounded-[var(--radius-sm)] border border-dashed border-border bg-surface/40 px-4 py-6 text-center text-sm text-dim">
                Kein Plan gefunden — starte das Onboarding erneut.
              </div>
            )}
            {days.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {days.map((day) => (
                  <Link
                    key={day.id}
                    href={`/training#day-${day.dayIndex}`}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-xs whitespace-nowrap text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                  >
                    {day.title} ·{" "}
                    {day.exercises.length === 1
                      ? "1 Übung"
                      : `${day.exercises.length} Übungen`}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Heutige Missionen */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Heutige Missionen</CardTitle>
            <p className="text-xs text-muted">
              Deine Workout-Mission hakt sich nach dem Training automatisch ab.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {missions.length === 0 ? (
              <p className="text-sm text-dim">
                Für heute sind keine Missionen angelegt.
              </p>
            ) : (
              missions.map((mission) => (
                <div
                  key={mission.id}
                  className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-border bg-surface px-3.5 py-2.5"
                >
                  {mission.status === "done" ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-dim" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {mission.title}
                    </p>
                    {mission.description && (
                      <p className="text-xs text-muted">
                        {mission.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Ernährungsziele */}
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <span className="grid size-10 place-items-center rounded-[12px] bg-surface-3 text-muted">
              <Flame className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base">Ernährungsziele</CardTitle>
              <p className="text-xs text-muted">Dein täglicher Rahmen.</p>
            </div>
          </CardHeader>
          <CardContent>
            {target ? (
              <dl className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-sm text-muted">Kalorien</dt>
                  <dd className="font-display text-sm font-semibold text-foreground">
                    {target.caloriesKcal.toLocaleString("de-DE")} kcal
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-sm text-muted">Protein</dt>
                  <dd className="font-display text-sm font-semibold text-foreground">
                    {target.proteinG} g
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-sm text-muted">
                    <Droplets className="size-3.5" /> Wasser
                  </dt>
                  <dd className="font-display text-sm font-semibold text-foreground">
                    {formatLiters(target.waterMl)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-dim">Noch keine Ziele berechnet.</p>
            )}
          </CardContent>
        </Card>

        {/* Coach */}
        <Card className="sm:col-span-2">
          <CardHeader className="flex-row items-center gap-3">
            <span className="grid size-10 place-items-center rounded-[12px] bg-accent-soft text-accent">
              <Sparkles className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base">Coach</CardTitle>
              <p className="text-xs text-muted">
                Kurz und ehrlich — regelbasiert.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground">
              {coachMessage}
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-dim">
              <Moon className="size-3.5" />
              Erholung zählt mit: Plane mindestens einen trainingsfreien Tag
              zwischen harten Einheiten.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
