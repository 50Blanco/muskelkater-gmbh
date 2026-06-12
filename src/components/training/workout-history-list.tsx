import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { WorkoutHistoryCard } from "./workout-history-card";
import type { WorkoutHistoryItem } from "@/lib/training/get-workout-history";

interface WorkoutHistoryListProps {
  items: WorkoutHistoryItem[];
}

/** Verlaufsliste abgeschlossener Workouts — oder freundlicher Empty State. */
export function WorkoutHistoryList({ items }: WorkoutHistoryListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-border bg-surface/40 px-4 py-14 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-surface-2">
          <ClipboardList className="size-6 text-dim" />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">
          Noch kein Training gespeichert.
        </p>
        <p className="mt-1 text-sm text-muted">
          Starte dein erstes Workout aus dem Plan.
        </p>
        <Link
          href="/training"
          className="mt-5 inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
        >
          Zum Trainingsplan
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <WorkoutHistoryCard item={item} />
        </li>
      ))}
    </ul>
  );
}
