import {
  formatRest,
  formatSetsReps,
  muscleGroupLabel,
} from "@/lib/training/labels";
import type { PlanExercise } from "@/lib/training/get-active-plan";

interface ExerciseRowProps {
  ex: PlanExercise;
  position: number;
}

/** Eine Übung in der Tagesansicht: Name, Muskelgruppe, Sätze×Wdh., Pause, Technik. */
export function ExerciseRow({ ex, position }: ExerciseRowProps) {
  return (
    <li className="flex gap-3 rounded-[var(--radius-sm)] border border-border bg-surface px-3.5 py-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-semibold text-muted">
        {position}
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="font-medium text-foreground">{ex.name}</p>
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
      </div>
    </li>
  );
}
