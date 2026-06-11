import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveSession,
  getCustomExercises,
  getExerciseCatalog,
  getWorkoutDayForSession,
} from "@/lib/workout/session-data";
import { WorkoutSession } from "@/components/workout/workout-session";

export const metadata: Metadata = { title: "Workout" };

interface PageProps {
  params: Promise<{ dayId: string }>;
}

export default async function WorkoutSessionPage({ params }: PageProps) {
  const { dayId } = await params;
  if (!z.uuid().safeParse(dayId).success) redirect("/training");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login"); // Proxy sichert die Route; hier Defense-in-Depth.

  const day = await getWorkoutDayForSession(user.id, dayId);
  // Gehört nicht dem Nutzer, existiert nicht oder hat keine Übungen.
  if (!day || day.exercises.length === 0) redirect("/training");

  const [session, catalog, customExercises] = await Promise.all([
    getActiveSession(user.id, dayId),
    getExerciseCatalog(),
    getCustomExercises(user.id),
  ]);

  // Ohne aktive Session wurde das Workout nicht über „Workout starten"
  // gestartet (z. B. direkter URL-Aufruf) → zurück zum Plan.
  if (!session) redirect("/training");

  return (
    <WorkoutSession
      sessionId={session.id}
      day={day}
      catalog={catalog}
      customExercises={customExercises}
    />
  );
}
