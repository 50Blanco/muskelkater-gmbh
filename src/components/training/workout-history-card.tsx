import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  formatDuration,
  formatSessionDate,
  rpeLabel,
} from "@/lib/training/history-helpers";
import type { WorkoutHistoryItem } from "@/lib/training/get-workout-history";

interface WorkoutHistoryCardProps {
  item: WorkoutHistoryItem;
}

/** Eine abgeschlossene Trainingseinheit in der Verlaufsliste — klickbar. */
export function WorkoutHistoryCard({ item }: WorkoutHistoryCardProps) {
  const title = item.dayTitle ?? "Freies Training";
  const rpe = rpeLabel(item.perceivedEffort);

  return (
    <Link
      href={`/training/verlauf/${item.id}`}
      className="group flex items-center gap-3 rounded-[var(--radius)] border border-border bg-surface px-4 py-3.5 transition-colors hover:border-accent/40 hover:bg-surface-2"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="text-sm font-semibold text-foreground">
            {formatSessionDate(item.completedAt)}
          </p>
          <p className="text-xs tabular-nums text-muted">
            {formatDuration(item.durationMin)}
          </p>
        </div>
        <p className="text-sm text-muted">{title}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-dim">
          <span>{item.exerciseCount} {item.exerciseCount === 1 ? "Übung" : "Übungen"}</span>
          <span>·</span>
          <span>{item.completedSets} {item.completedSets === 1 ? "Satz" : "Sätze"}</span>
          {rpe && (
            <>
              <span>·</span>
              <span>RPE {item.perceivedEffort} · {rpe}</span>
            </>
          )}
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-dim transition-colors group-hover:text-muted" />
    </Link>
  );
}
