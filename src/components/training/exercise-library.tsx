"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import {
  buildFilterSearchParams,
  EMPTY_FILTERS,
  extractEquipment,
  extractMuscleGroups,
  hasActiveFilters,
  type ExerciseFilters,
  type LibraryExercise,
} from "@/lib/training/exercise-filters";
import { LOCATION_LABELS, LEVEL_LABELS, MUSCLE_GROUP_LABELS } from "@/lib/training/labels";
import { ExerciseCard } from "./exercise-card";

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "h-9 rounded-full border border-accent bg-accent-soft px-3.5 text-sm font-medium text-foreground transition-colors"
          : "h-9 rounded-full border border-border bg-surface px-3.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
      }
    >
      {label}
    </button>
  );
}

interface ExerciseLibraryProps {
  /** Vollständige sortierte Liste — für Filter-Options-Extraktion. */
  allExercises: LibraryExercise[];
  /** Bereits server-seitig gefilterte Liste — wird direkt gerendert. */
  filteredExercises: LibraryExercise[];
  /** Aktive Filter aus URL-Params (angewendeter Zustand). */
  currentFilters: ExerciseFilters;
}

export function ExerciseLibrary({
  allExercises,
  filteredExercises,
  currentFilters,
}: ExerciseLibraryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // "pending" = was der Nutzer im Panel ausgewählt hat, aber noch nicht angewendet hat.
  // Komponente wird via key={filtersKey} in page.tsx neu gemountet wenn URL-Filter wechseln —
  // deshalb initialisiert useState direkt aus currentFilters und kein useEffect nötig.
  const [pending, setPending] = useState<ExerciseFilters>(currentFilters);
  const [showFilters, setShowFilters] = useState(() => hasActiveFilters(currentFilters));

  const muscleGroups = useMemo(() => extractMuscleGroups(allExercises), [allExercises]);
  const equipmentOptions = useMemo(() => extractEquipment(allExercises), [allExercises]);

  function setFilter<K extends keyof ExerciseFilters>(key: K, value: string) {
    setPending((prev) => ({
      ...prev,
      [key]: prev[key] === value ? "" : value,
    }));
  }

  function handleApply() {
    const params = buildFilterSearchParams(pending);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/training/uebungen?${qs}` : "/training/uebungen");
    });
  }

  function handleReset() {
    startTransition(() => {
      router.push("/training/uebungen");
    });
    setShowFilters(false);
  }

  const pendingDirty = hasActiveFilters(pending);
  const appliedActive = hasActiveFilters(currentFilters);

  return (
    <div className="space-y-4">
      {/* Suchfeld */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-dim" />
        <input
          type="search"
          value={pending.search}
          onChange={(e) => setPending((prev) => ({ ...prev, search: e.target.value }))}
          placeholder="Übung suchen …"
          className="w-full rounded-[var(--radius)] border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-dim focus-visible:border-accent focus-visible:outline-none"
        />
      </div>

      {/* Filter-Toggle + Zurücksetzen */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <SlidersHorizontal className="size-4" />
          Filter
          {appliedActive && (
            <span className="grid size-5 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              !
            </span>
          )}
        </button>
        {appliedActive && (
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="text-xs text-accent hover:underline disabled:opacity-60"
          >
            Zurücksetzen
          </button>
        )}
      </div>

      {/* Filter-Panel */}
      {showFilters && (
        <div className="space-y-4 rounded-[var(--radius)] border border-border bg-surface/60 p-4">
          {/* Muskelgruppe */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-dim">Muskelgruppe</p>
            <div className="flex flex-wrap gap-2">
              {muscleGroups.map((mg) => (
                <FilterChip
                  key={mg}
                  label={MUSCLE_GROUP_LABELS[mg] ?? mg}
                  active={pending.muscleGroup === mg}
                  onClick={() => setFilter("muscleGroup", mg)}
                />
              ))}
            </div>
          </div>

          {/* Ort */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-dim">Trainingsort</p>
            <div className="flex flex-wrap gap-2">
              {(["gym", "home", "both"] as const).map((loc) => (
                <FilterChip
                  key={loc}
                  label={LOCATION_LABELS[loc]}
                  active={pending.location === loc}
                  onClick={() => setFilter("location", loc)}
                />
              ))}
            </div>
          </div>

          {/* Equipment */}
          {equipmentOptions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-dim">Equipment</p>
              <div className="flex flex-wrap gap-2">
                {equipmentOptions.map((eq) => (
                  <FilterChip
                    key={eq}
                    label={eq}
                    active={pending.equipment === eq}
                    onClick={() => setFilter("equipment", eq)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Level */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-dim">Level</p>
            <div className="flex flex-wrap gap-2">
              {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
                <FilterChip
                  key={lvl}
                  label={LEVEL_LABELS[lvl]}
                  active={pending.level === lvl}
                  onClick={() => setFilter("level", lvl)}
                />
              ))}
            </div>
          </div>

          {/* Aktions-Buttons */}
          <div className="flex items-center gap-3 border-t border-border pt-3">
            <button
              type="button"
              onClick={handleApply}
              disabled={isPending}
              className="rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Lädt …" : "Filter anwenden"}
            </button>
            {pendingDirty && (
              <button
                type="button"
                onClick={() => setPending(EMPTY_FILTERS)}
                className="text-xs text-muted hover:text-foreground transition-colors"
              >
                Auswahl löschen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ergebnis-Count */}
      <p className="text-xs text-dim">
        {filteredExercises.length} {filteredExercises.length === 1 ? "Übung" : "Übungen"}
        {appliedActive ? " gefunden" : " gesamt"}
      </p>

      {/* Liste */}
      {filteredExercises.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-dashed border-border bg-surface/40 px-4 py-12 text-center">
          <p className="text-sm font-medium text-foreground">Keine Übungen gefunden</p>
          <p className="mt-1 text-xs text-muted">Passe die Filter an oder setze die Suche zurück.</p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-3 text-xs text-accent hover:underline"
          >
            Filter zurücksetzen
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredExercises.map((ex) => (
            <li key={ex.uid}>
              <ExerciseCard exercise={ex} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
