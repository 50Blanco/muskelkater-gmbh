import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getExerciseLibrary } from "@/lib/training/exercise-library";
import { sortExercises } from "@/lib/training/exercise-filters";
import { PageHeader } from "@/components/layout/page-header";
import { ExerciseLibrary } from "@/components/training/exercise-library";

export const metadata: Metadata = { title: "Übungsbibliothek" };

export default async function ExerciseLibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const exercises = sortExercises(await getExerciseLibrary(user.id));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Übungsbibliothek"
        title="Alle Übungen"
        subtitle="Globaler Katalog und deine eigenen Übungen — durchsuchen und filtern."
      />
      <ExerciseLibrary exercises={exercises} />
    </div>
  );
}
