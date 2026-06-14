"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteMealLog } from "@/app/(app)/ernaehrung/actions";
import { MEAL_TYPE_LABELS, type MealKey } from "@/lib/validation/nutrition";
import type { MealLogEntry } from "@/lib/nutrition/nutrition-data";
import { cn } from "@/lib/utils";

const MEAL_TYPE_ICONS: Record<string, string> = {
  fruehstueck: "🌅",
  mittagessen: "☀️",
  abendessen: "🌙",
  snack: "🍎",
};

interface Props {
  entries: MealLogEntry[];
}

function MealEntry({ entry }: { entry: MealLogEntry }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteMealLog({ mealLogId: entry.id });
    });
  };

  const label =
    MEAL_TYPE_LABELS[entry.mealType as MealKey] ?? entry.mealType;
  const icon = MEAL_TYPE_ICONS[entry.mealType] ?? "🍽️";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2.5 transition-opacity",
        isPending && "opacity-50",
      )}
    >
      <span className="mt-0.5 shrink-0 text-base" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{entry.title}</p>
        <p className="mt-0.5 text-xs text-dim">
          {label}
          {entry.caloriesKcal != null && ` · ${entry.caloriesKcal} kcal`}
          {entry.proteinG != null && ` · ${entry.proteinG} g Protein`}
        </p>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        aria-label={`${entry.title} löschen`}
        className="mt-0.5 shrink-0 rounded p-1 text-dim transition-colors hover:text-danger disabled:cursor-not-allowed"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

export function MealLogList({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-dim">
        Noch nichts eingetragen.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <MealEntry key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
