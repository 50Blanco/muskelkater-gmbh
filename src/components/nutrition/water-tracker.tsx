"use client";

import { useState, useTransition } from "react";
import { Droplets } from "lucide-react";
import { addWater } from "@/app/(app)/ernaehrung/actions";
import { WATER_STEPS } from "@/lib/validation/nutrition";
import { cn } from "@/lib/utils";

interface Props {
  currentMl: number;
  targetMl: number;
}

function formatLiters(ml: number): string {
  return `${(ml / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} l`;
}

export function WaterTracker({ currentMl, targetMl }: Props) {
  const [pendingMl, setPendingMl] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const displayMl = currentMl + pendingMl;
  const done = displayMl >= targetMl;

  const add = (ml: number) => {
    setError(null);
    setPendingMl((prev) => prev + ml);
    startTransition(async () => {
      const result = await addWater({ addMl: ml });
      if ("error" in result) {
        setPendingMl((prev) => prev - ml);
        setError(result.error);
      }
      // Auf Erfolg: revalidatePath liefert neuen currentMl → pendingMl auf 0 resetten
      else {
        setPendingMl(0);
      }
    });
  };

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm text-muted">
        <Droplets className={cn("size-4", done ? "text-success" : "text-accent")} />
        Heute getrunken:{" "}
        <span
          className={cn(
            "font-display font-semibold",
            done ? "text-success" : "text-foreground",
          )}
        >
          {formatLiters(displayMl)}
        </span>
        {targetMl > 0 && (
          <span className="text-dim">/ {formatLiters(targetMl)}</span>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {WATER_STEPS.map((ml) => (
          <button
            key={ml}
            type="button"
            onClick={() => add(ml)}
            disabled={isPending}
            className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            +{ml} ml
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
