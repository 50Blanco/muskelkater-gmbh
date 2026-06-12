import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getWorkoutHistory } from "@/lib/training/get-workout-history";
import { PageHeader } from "@/components/layout/page-header";
import { WorkoutHistoryList } from "@/components/training/workout-history-list";

export const metadata: Metadata = { title: "Trainingstagebuch" };

export default async function WorkoutHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const history = await getWorkoutHistory(user.id);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/training"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Zurück zum Training
        </Link>
        <PageHeader
          eyebrow="Trainingsverlauf"
          title="Tagebuch"
          subtitle="Alle abgeschlossenen Trainingseinheiten — sortiert nach Datum."
        />
      </div>
      <WorkoutHistoryList items={history} />
    </div>
  );
}
