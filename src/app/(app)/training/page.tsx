import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrainingPlan } from "@/lib/training/get-active-plan";
import { selectNextDay } from "@/lib/plan/select-next-day";
import { getCustomExercises } from "@/lib/workout/session-data";
import { PageHeader } from "@/components/layout/page-header";
import { PlanOverview } from "@/components/training/plan-overview";
import { TrainingEmptyState } from "@/components/training/training-empty-state";
import { CustomExerciseSection } from "@/components/training/custom-exercise-section";

export const metadata: Metadata = { title: "Training" };

export default async function TrainingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login"); // Proxy sichert die Route; hier Defense-in-Depth.

  const plan = await getActiveTrainingPlan(user.id);

  if (!plan || plan.days.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Dein Trainingsplan"
          subtitle="Hier siehst du deinen Wochenplan mit allen Übungen."
        />
        <TrainingEmptyState />
      </div>
    );
  }

  const nextDay = selectNextDay(plan.days);
  const customExercises = await getCustomExercises(user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dein Trainingsplan"
        title={plan.name}
        subtitle="Alle Trainingstage mit Übungen, Sätzen, Pausen und Technik-Hinweisen."
      >
        <Link
          href="/training/uebungen"
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
        >
          <BookOpen className="size-4" />
          Übungsbibliothek
        </Link>
      </PageHeader>
      <PlanOverview plan={plan} highlightDayIndex={nextDay?.dayIndex ?? null} />
      <CustomExerciseSection customExercises={customExercises} />
    </div>
  );
}
