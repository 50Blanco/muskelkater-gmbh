import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getExerciseByUid } from "@/lib/training/exercise-library";
import { ExerciseDetail } from "@/components/training/exercise-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: decodeURIComponent(id) };
}

export default async function ExerciseDetailPage({ params }: Props) {
  const { id } = await params;
  const uid = decodeURIComponent(id);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const exercise = await getExerciseByUid(uid, user.id);
  if (!exercise) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/training/uebungen"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Zurück zur Bibliothek
      </Link>
      <ExerciseDetail exercise={exercise} />
    </div>
  );
}
