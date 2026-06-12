"use client";

import Link from "next/link";
import { ChevronRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOCATION_LABELS, LEVEL_LABELS } from "@/lib/training/labels";
import { MuscleBadge } from "./muscle-badge";
import type { LibraryExercise } from "@/lib/training/exercise-filters";

interface ExerciseCardProps {
  exercise: LibraryExercise;
  className?: string;
}

/** Listenitem in der Übungsbibliothek — klickbar, führt zur Detailseite. */
export function ExerciseCard({ exercise: ex, className }: ExerciseCardProps) {
  const locationLabel = LOCATION_LABELS[ex.location] ?? ex.location;
  const levelLabel = LEVEL_LABELS[ex.level] ?? ex.level;

  return (
    <Link
      href={`/training/uebungen/${encodeURIComponent(ex.uid)}`}
      className={cn(
        "group flex items-center gap-3 rounded-[var(--radius)] border border-border bg-surface px-4 py-3.5 transition-colors hover:border-accent/40 hover:bg-surface-2",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground leading-snug">{ex.name}</span>
          {ex.source === "custom" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
              <User className="size-3" />
              Eigene
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <MuscleBadge muscleGroup={ex.muscleGroup} />
          <span className="text-xs text-dim">{locationLabel}</span>
          {ex.equipment && (
            <>
              <span className="text-xs text-dim">·</span>
              <span className="text-xs text-dim">{ex.equipment}</span>
            </>
          )}
          <span className="text-xs text-dim">·</span>
          <span className="text-xs text-dim">{levelLabel}</span>
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-dim group-hover:text-muted transition-colors" />
    </Link>
  );
}
