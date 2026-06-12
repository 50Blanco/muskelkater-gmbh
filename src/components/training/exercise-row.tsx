import Link from "next/link";
import { User } from "lucide-react";
import {
  formatRest,
  formatSetsReps,
  muscleGroupLabel,
} from "@/lib/training/labels";
import type { PlanExercise } from "@/lib/training/get-active-plan";
import type { LibraryExercise } from "@/lib/training/exercise-filters";
import { ExerciseActions } from "./exercise-actions";

interface ExerciseRowProps {
  ex: PlanExercise;
  position: number;
  /** Übungsbibliothek für den Ersetzen-Picker. */
  library: LibraryExercise[];
}

/** Eine Übung in der Tagesansicht: Name, Muskelgruppe, Sätze×Wdh., Pause, Technik. */
export function ExerciseRow({ ex, position, library }: ExerciseRowProps) {
  return (
    <li className="flex gap-3 rounded-[var(--radius-sm)] border border-border bg-surface px-3.5 py-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-semibold text-muted">
        {position}
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="flex items-center gap-1.5">
            <Link
              href={`/training/uebungen/${ex.uid}`}
              className="font-medium text-foreground hover:text-accent transition-colors"
            >
              {ex.name}
            </Link>
            {ex.source === "custom" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
                <User className="size-2.5" />
                Eigene
              </span>
            )}
          </span>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {formatSetsReps(ex.targetSets, ex.targetReps)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span className="rounded-full bg-surface-2 px-2 py-0.5">
            {muscleGroupLabel(ex.muscleGroup)}
          </span>
          <span>Pause {formatRest(ex.targetRestSec)}</span>
        </div>
        {ex.instructions && (
          <p className="text-xs leading-relaxed text-dim">
            <span className="text-muted">Technik:</span> {ex.instructions}
          </p>
        )}
        <ExerciseActions ex={ex} library={library} />
      </div>
    </li>
  );
}
