import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrainingPlan } from "@/lib/training/get-active-plan";
import { selectNextDay } from "@/lib/plan/select-next-day";
import { PageHeader } from "@/components/layout/page-header";
import { PlanOverview } from "@/components/training/plan-overview";
import { TrainingEmptyState } from "@/components/training/training-empty-state";

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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dein Trainingsplan"
        title={plan.name}
        subtitle="Alle Trainingstage mit Übungen, Sätzen, Pausen und Technik-Hinweisen."
      />
      <PlanOverview plan={plan} highlightDayIndex={nextDay?.dayIndex ?? null} />
    </div>
  );
}
