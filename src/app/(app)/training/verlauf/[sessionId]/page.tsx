import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getWorkoutSessionDetail } from "@/lib/training/get-workout-history";
import { formatSessionDate } from "@/lib/training/history-helpers";
import { WorkoutSessionDetailView } from "@/components/training/workout-session-detail";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { title: "Trainingstagebuch" };

  const session = await getWorkoutSessionDetail(sessionId, user.id);
  return {
    title: session
      ? `${session.dayTitle ?? "Freies Training"} — ${formatSessionDate(session.completedAt)}`
      : "Trainingstagebuch",
  };
}

export default async function WorkoutSessionDetailPage({ params }: Props) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const session = await getWorkoutSessionDetail(sessionId, user.id);
  if (!session) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/training/verlauf"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Zurück zum Tagebuch
      </Link>
      <WorkoutSessionDetailView session={session} />
    </div>
  );
}
