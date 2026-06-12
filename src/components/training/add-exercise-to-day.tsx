"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Search, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addExerciseToWorkoutDay } from "@/app/(app)/training/actions";
import { filterExercises, EMPTY_FILTERS } from "@/lib/training/exercise-filters";
import type { LibraryExercise } from "@/lib/training/exercise-filters";
import { defaultPrescription } from "@/lib/training/prescription";
import { MUSCLE_GROUP_LABELS } from "@/lib/training/labels";
import { MuscleBadge } from "./muscle-badge";

interface Props {
  workoutDayId: string;
  /** Vollständige Übungsbibliothek (global + eigene) — vom Server geladen. */
  library: LibraryExercise[];
}

const MAX_VISIBLE = 30;

/** Picker zum Hinzufügen einer globalen oder eigenen Übung zu einem Trainingstag. */
export function AddExerciseToDay({ workoutDayId, library }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<LibraryExercise | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const results = useMemo(() => {
    const filtered = filterExercises(library, { ...EMPTY_FILTERS, search });
    return filtered.slice(0, MAX_VISIBLE);
  }, [library, search]);

  const preview = selected
    ? defaultPrescription(selected.isCompound ?? false)
    : null;

  const reset = () => {
    setOpen(false);
    setSearch("");
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

      {/* Suche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Übung suchen …"
          className="w-full rounded-[var(--radius-sm)] border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-dim focus-visible:border-accent focus-visible:outline-none"
        />
      </div>

      {/* Trefferliste */}
      <ul className="max-h-64 space-y-1.5 overflow-y-auto">
        {results.length === 0 ? (
          <li className="px-1 py-3 text-center text-xs text-dim">
            Keine Übung gefunden.
          </li>
        ) : (
          results.map((ex) => {
            const isSelected = selected?.uid === ex.uid;
            return (
              <li key={ex.uid}>
                <button
                  type="button"
                  onClick={() => setSelected(ex)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-2 text-left transition-colors",
                    isSelected
                      ? "border-accent bg-accent-soft"
                      : "border-border bg-surface hover:bg-surface-3",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground">
                        {ex.name}
                      </span>
                      {ex.source === "custom" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
                          <User className="size-2.5" />
                          Eigene
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-dim">
                      {MUSCLE_GROUP_LABELS[ex.muscleGroup.trim().toLowerCase()] ??
                        ex.muscleGroup}
                    </span>
                  </div>
                  {isSelected && <Check className="size-4 shrink-0 text-accent" />}
                </button>
              </li>
            );
          })
        )}
      </ul>

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
