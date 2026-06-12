"use client";

import { useMemo, useState } from "react";
import { Check, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  filterExercises,
  EMPTY_FILTERS,
} from "@/lib/training/exercise-filters";
import type { LibraryExercise } from "@/lib/training/exercise-filters";
import { MUSCLE_GROUP_LABELS } from "@/lib/training/labels";

const MAX_VISIBLE = 30;

interface Props {
  /** Vollständige Übungsbibliothek (global + eigene) — vom Server geladen. */
  library: LibraryExercise[];
  /** UID der aktuell gewählten Übung (für die Markierung). */
  selectedUid?: string | null;
  onSelect: (ex: LibraryExercise) => void;
  /** Optional: eine Übung (z. B. die zu ersetzende) ausblenden. */
  excludeUid?: string | null;
  placeholder?: string;
}

/**
 * Wiederverwendbarer Such-Picker für Übungen (Hinzufügen + Ersetzen).
 * Reine Auswahl-UI — die Aktion liegt beim Aufrufer.
 */
export function ExerciseSearchPicker({
  library,
  selectedUid,
  onSelect,
  excludeUid,
  placeholder = "Übung suchen …",
}: Props) {
  const [search, setSearch] = useState("");

  const results = useMemo(() => {
    const filtered = filterExercises(library, { ...EMPTY_FILTERS, search });
    const limited = excludeUid
      ? filtered.filter((ex) => ex.uid !== excludeUid)
      : filtered;
    return limited.slice(0, MAX_VISIBLE);
  }, [library, search, excludeUid]);

  return (
    <div className="space-y-2.5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-[var(--radius-sm)] border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-dim focus-visible:border-accent focus-visible:outline-none"
        />
      </div>

      <ul className="max-h-64 space-y-1.5 overflow-y-auto">
        {results.length === 0 ? (
          <li className="px-1 py-3 text-center text-xs text-dim">
            Keine Übung gefunden.
          </li>
        ) : (
          results.map((ex) => {
            const isSelected = selectedUid === ex.uid;
            return (
              <li key={ex.uid}>
                <button
                  type="button"
                  onClick={() => onSelect(ex)}
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
                      {MUSCLE_GROUP_LABELS[
                        ex.muscleGroup.trim().toLowerCase()
                      ] ?? ex.muscleGroup}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="size-4 shrink-0 text-accent" />
                  )}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
