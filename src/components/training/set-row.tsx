import { Check } from "lucide-react";
import { formatWeightReps, type HistorySet } from "@/lib/training/history-helpers";

interface SetRowProps {
  set: HistorySet;
}

/** Eine Satzzeile im Workout-Detail: Nummer, Gewicht × Wdh., erledigt-Haken. */
export function SetRow({ set }: SetRowProps) {
  const value = formatWeightReps(set.weightKg, set.reps);

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-semibold text-muted">
        {set.setNumber}
      </span>
      <span className="flex-1 text-sm tabular-nums text-foreground">
        {value ?? <span className="text-dim">—</span>}
      </span>
      {set.completed && (
        <Check className="size-4 shrink-0 text-accent" aria-label="erledigt" />
      )}
    </div>
  );
}
