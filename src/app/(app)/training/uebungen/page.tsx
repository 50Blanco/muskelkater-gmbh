import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getExerciseLibrary } from "@/lib/training/exercise-library";
import {
  filterExercises,
  filtersFromSearchParams,
  sortExercises,
} from "@/lib/training/exercise-filters";
import { PageHeader } from "@/components/layout/page-header";
import { ExerciseLibrary } from "@/components/training/exercise-library";

export const metadata: Metadata = { title: "Übungsbibliothek" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ExerciseLibraryPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const allExercises = sortExercises(await getExerciseLibrary(user.id));
  const currentFilters = filtersFromSearchParams(sp);
  const filteredExercises = filterExercises(allExercises, currentFilters);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Übungsbibliothek"
        title="Alle Übungen"
        subtitle="Globaler Katalog und deine eigenen Übungen — durchsuchen und filtern."
      />
      <ExerciseLibrary
        key={JSON.stringify(currentFilters)}
        allExercises={allExercises}
        filteredExercises={filteredExercises}
        currentFilters={currentFilters}
      />
    </div>
  );
}
