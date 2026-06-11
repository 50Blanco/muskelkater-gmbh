"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { toggleMeal } from "@/app/(app)/ernaehrung/actions";
import { MEAL_KEYS, MEAL_LABELS, type MealKey } from "@/lib/validation/nutrition";
import { cn } from "@/lib/utils";

interface Props {
  initialStatus: Record<string, boolean>;
}

export function MealChecklist({ initialStatus }: Props) {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const getStatus = (key: MealKey): boolean =>
    overrides[key] ?? initialStatus[key] ?? false;

  const toggle = (key: MealKey) => {
    const current = getStatus(key);
    const done = !current;
    setOverrides((prev) => ({ ...prev, [key]: done }));
    startTransition(async () => {
      const result = await toggleMeal({ mealKey: key, done });
      if ("error" in result) {
        setOverrides((prev) => ({ ...prev, [key]: current }));
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-2">
      {MEAL_KEYS.map((key) => {
        const done = getStatus(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            disabled={isPending}
            aria-pressed={done}
            className={cn(
              "flex w-full items-center gap-3 rounded-[var(--radius-sm)] border px-3.5 py-2.5 text-sm transition-colors disabled:cursor-not-allowed",
              done
                ? "border-success/40 bg-success/10 text-success"
                : "border-border bg-surface text-foreground hover:bg-surface-2",
            )}
          >
            {done ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <Circle className="size-4 shrink-0 text-dim" />
            )}
            {MEAL_LABELS[key]}
          </button>
        );
      })}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
