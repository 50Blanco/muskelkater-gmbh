import { BookOpen, Dumbbell, MapPin, User } from "lucide-react";
import { LOCATION_LABELS, LEVEL_LABELS } from "@/lib/training/labels";
import { MuscleBadge } from "./muscle-badge";
import type { LibraryExercise } from "@/lib/training/exercise-filters";

interface ExerciseDetailProps {
  exercise: LibraryExercise;
}

export function ExerciseDetail({ exercise: ex }: ExerciseDetailProps) {
  const locationLabel = LOCATION_LABELS[ex.location] ?? ex.location;
  const levelLabel = LEVEL_LABELS[ex.level] ?? ex.level;

  return (
    <div className="space-y-6">
      {/* Kopf */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <MuscleBadge muscleGroup={ex.muscleGroup} />
          {ex.source === "custom" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
              <User className="size-3" />
              Eigene Übung
            </span>
          )}
          {ex.isCompound && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
              Grundübung
            </span>
          )}
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {ex.name}
        </h1>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetaItem icon={<MapPin className="size-4" />} label="Ort" value={locationLabel} />
        <MetaItem icon={<Dumbbell className="size-4" />} label="Level" value={levelLabel} />
        {ex.equipment && (
          <MetaItem icon={<Dumbbell className="size-4" />} label="Equipment" value={ex.equipment} />
        )}
      </div>

      {/* Technik */}
      {ex.instructions ? (
        <div className="rounded-[var(--radius)] border border-border bg-surface px-4 py-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BookOpen className="size-4 text-accent" />
            Technik-Hinweis
          </div>
          <p className="text-sm leading-relaxed text-muted">{ex.instructions}</p>
        </div>
      ) : (
        <div className="rounded-[var(--radius)] border border-dashed border-border bg-surface/40 px-4 py-4">
          <p className="text-sm text-dim">Noch keine Technik-Hinweise hinterlegt.</p>
        </div>
      )}

      {/* Visualisierungs-Platzhalter */}
      <div className="rounded-[var(--radius)] border border-dashed border-border bg-surface/40 px-4 py-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-dim">Visualisierung folgt</p>
        <p className="mt-1 text-xs text-dim">Muskelgrafik & Animation — Phase 7D</p>
      </div>
    </div>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2.5 space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-dim">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
