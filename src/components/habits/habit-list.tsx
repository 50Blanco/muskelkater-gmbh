"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { toggleHabitLog } from "@/app/(app)/heute/actions";
import { cn } from "@/lib/utils";

export interface HabitItem {
  id: string;
  name: string;
  icon: string | null;
  completed: boolean;
}

interface Props {
  habits: HabitItem[];
}

export function HabitList({ habits }: Props) {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const getCompleted = (h: HabitItem): boolean =>
    overrides[h.id] ?? h.completed;

  const toggle = (h: HabitItem) => {
    const current = getCompleted(h);
    const completed = !current;
    setOverrides((prev) => ({ ...prev, [h.id]: completed }));
    startTransition(async () => {
      const result = await toggleHabitLog({ habitId: h.id, completed });
      if ("error" in result) {
        setOverrides((prev) => ({ ...prev, [h.id]: current }));
        setError(result.error);
      }
    });
  };

  if (habits.length === 0) return null;

  return (
    <div className="space-y-2">
      {habits.map((h) => {
        const done = getCompleted(h);
        return (
          <button
            key={h.id}
            type="button"
            onClick={() => toggle(h)}
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
            <span className="text-left">
              {h.icon && <span className="mr-1.5">{h.icon}</span>}
              {h.name}
            </span>
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
