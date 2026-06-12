"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addExerciseToWorkoutDay } from "@/app/(app)/training/actions";
import type { LibraryExercise } from "@/lib/training/exercise-filters";
import { defaultPrescription } from "@/lib/training/prescription";
import { MuscleBadge } from "./muscle-badge";
import { ExerciseSearchPicker } from "./exercise-search-picker";

interface Props {
  workoutDayId: string;
  /** Vollständige Übungsbibliothek (global + eigene) — vom Server geladen. */
  library: LibraryExercise[];
}

/** Picker zum Hinzufügen einer globalen oder eigenen Übung zu einem Trainingstag. */
export function AddExerciseToDay({ workoutDayId, library }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<LibraryExercise | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const preview = selected
    ? defaultPrescription(selected.isCompound ?? false)
    : null;

  const reset = () => {
    setOpen(false);
    setSelected(null);
    setError(null);
  };

  const handleAdd = () => {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await addExerciseToWorkoutDay({
        workoutDayId,
        exerciseUid: selected.uid,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      reset();
      router.refresh();
    });
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" /> Übung hinzufügen
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-[var(--radius)] border border-border bg-surface-2/70 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">Übung hinzufügen</p>
        <button
          type="button"
          onClick={reset}
          className="text-muted transition-colors hover:text-foreground"
          aria-label="Schließen"
        >
          <X className="size-4" />
        </button>
      </div>

      <ExerciseSearchPicker
        library={library}
        selectedUid={selected?.uid ?? null}
        onSelect={setSelected}
      />

      {/* Auswahl + Vorschau */}
      {selected && preview && (
        <div className="space-y-3 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {selected.name}
            </span>
            <MuscleBadge muscleGroup={selected.muscleGroup} />
          </div>
          <p className="text-xs text-muted">
            Vorgabe:{" "}
            <span className="font-medium text-foreground tabular-nums">
              {preview.targetSets} × {preview.targetReps}
            </span>{" "}
            · Pause {preview.targetRestSec} s
          </p>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={!selected || isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Fügt hinzu …
            </>
          ) : (
            <>
              <Plus className="size-4" /> Zum Trainingstag hinzufügen
            </>
          )}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={reset}>
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
