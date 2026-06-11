"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import {
  EMPTY_FILTERS,
  extractEquipment,
  extractMuscleGroups,
  filterExercises,
  sortExercises,
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
  exercises: LibraryExercise[];
}

export function ExerciseLibrary({ exercises }: ExerciseLibraryProps) {
  const [filters, setFilters] = useState<ExerciseFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const muscleGroups = useMemo(() => extractMuscleGroups(exercises), [exercises]);
  const equipmentOptions = useMemo(() => extractEquipment(exercises), [exercises]);

  const results = useMemo(
    () => sortExercises(filterExercises(exercises, filters)),
    [exercises, filters],
  );

  function setFilter<K extends keyof ExerciseFilters>(key: K, value: string) {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? "" : value,
    }));
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
  }

  const hasActiveFilters =
    filters.search ||
    filters.muscleGroup ||
    filters.location ||
    filters.equipment ||
    filters.level;

  return (
    <div className="space-y-4">
      {/* Suchfeld */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-dim" />
        <input
          type="search"
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          placeholder="Übung suchen …"
          className="w-full rounded-[var(--radius)] border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-dim focus-visible:border-accent focus-visible:outline-none"
        />
      </div>

      {/* Filter-Toggle */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <SlidersHorizontal className="size-4" />
          Filter
          {hasActiveFilters && (
            <span className="grid size-5 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              !
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-accent hover:underline"
          >
            Alle zurücksetzen
          </button>
        )}
      </div>

      {/* Filter-Chips */}
      {showFilters && (
        <div className="space-y-3 rounded-[var(--radius)] border border-border bg-surface/60 p-4">
          {/* Muskelgruppe */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-dim">Muskelgruppe</p>
            <div className="flex flex-wrap gap-2">
              {muscleGroups.map((mg) => (
                <FilterChip
                  key={mg}
                  label={MUSCLE_GROUP_LABELS[mg] ?? mg}
                  active={filters.muscleGroup === mg}
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
                  active={filters.location === loc}
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
                    active={filters.equipment === eq}
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
                  active={filters.level === lvl}
                  onClick={() => setFilter("level", lvl)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ergebnis-Count */}
      <p className="text-xs text-dim">
        {results.length} {results.length === 1 ? "Übung" : "Übungen"}
        {hasActiveFilters ? " gefunden" : " gesamt"}
      </p>

      {/* Liste */}
      {results.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-dashed border-border bg-surface/40 px-4 py-12 text-center">
          <p className="text-sm font-medium text-foreground">Keine Übungen gefunden</p>
          <p className="mt-1 text-xs text-muted">Passe die Filter an oder setze die Suche zurück.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-xs text-accent hover:underline"
          >
            Filter zurücksetzen
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {results.map((ex) => (
            <li key={ex.uid}>
              <ExerciseCard exercise={ex} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
