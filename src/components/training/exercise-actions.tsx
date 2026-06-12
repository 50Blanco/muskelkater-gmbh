"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Repeat, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlanExercise } from "@/lib/training/get-active-plan";
import type { LibraryExercise } from "@/lib/training/exercise-filters";
import {
  removeWorkoutDayExercise,
  replaceWorkoutDayExercise,
  updateWorkoutDayExercisePrescription,
} from "@/app/(app)/training/actions";
import { ExerciseSearchPicker } from "./exercise-search-picker";
import { MuscleBadge } from "./muscle-badge";

type Panel = "none" | "edit" | "replace" | "remove";

interface Props {
  ex: PlanExercise;
  /** Übungsbibliothek (global + eigene) für den Ersetzen-Picker. */
  library: LibraryExercise[];
}

/** Default-Vorgaben, falls die Übung (noch) keine Werte hat. */
const DEFAULT_SETS = 3;
const DEFAULT_REPS = 10;
const DEFAULT_REST = 90;

/** Pro-Übung-Aktionen: Anpassen · Ersetzen · Entfernen (mobile-first, kompakt). */
export function ExerciseActions({ ex, library }: Props) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>("none");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Anpassen-Formular (als Strings — Eingabefelder, serverseitig validiert).
  const [sets, setSets] = useState(String(ex.targetSets ?? DEFAULT_SETS));
  const [reps, setReps] = useState(String(ex.targetReps ?? DEFAULT_REPS));
  const [rest, setRest] = useState(
    String(ex.targetRestSec && ex.targetRestSec >= 15 ? ex.targetRestSec : DEFAULT_REST),
  );

  // Ersetzen-Auswahl.
  const [replacement, setReplacement] = useState<LibraryExercise | null>(null);

  const close = () => {
    setPanel("none");
    setError(null);
    setReplacement(null);
  };

  const togglePanel = (next: Panel) => {
    setError(null);
    setReplacement(null);
    setPanel((current) => (current === next ? "none" : next));
  };

  const handleRemove = () => {
    setError(null);
    startTransition(async () => {
      const result = await removeWorkoutDayExercise({
        workoutDayExerciseId: ex.id,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      close();
      router.refresh();
    });
  };

  const handleReplace = () => {
    if (!replacement) return;
    setError(null);
    startTransition(async () => {
      const result = await replaceWorkoutDayExercise({
        workoutDayExerciseId: ex.id,
        exerciseUid: replacement.uid,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      close();
      router.refresh();
    });
  };

  const handleEdit = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateWorkoutDayExercisePrescription({
        workoutDayExerciseId: ex.id,
        targetSets: sets,
        targetReps: reps,
        targetRestSec: rest,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      close();
      router.refresh();
    });
  };

  return (
    <div className="mt-2.5 space-y-2.5">
      {/* Aktions-Buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        <ActionButton
          active={panel === "edit"}
          onClick={() => togglePanel("edit")}
          icon={<Pencil className="size-3.5" />}
          label="Anpassen"
        />
        <ActionButton
          active={panel === "replace"}
          onClick={() => togglePanel("replace")}
          icon={<Repeat className="size-3.5" />}
          label="Ersetzen"
        />
        <ActionButton
          active={panel === "remove"}
          onClick={() => togglePanel("remove")}
          icon={<Trash2 className="size-3.5" />}
          label="Entfernen"
          danger
        />
      </div>

      {/* Anpassen */}
      {panel === "edit" && (
        <div className="space-y-3 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-3">
          <div className="grid grid-cols-3 gap-2">
            <NumberField label="Sätze" value={sets} onChange={setSets} min={1} max={10} />
            <NumberField label="Wdh." value={reps} onChange={setReps} min={1} max={100} />
            <NumberField label="Pause (s)" value={rest} onChange={setRest} min={15} max={600} />
          </div>
          {error && <ErrorNote message={error} />}
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={handleEdit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Speichert …
                </>
              ) : (
                "Speichern"
              )}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={close}>
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      {/* Ersetzen */}
      {panel === "replace" && (
        <div className="space-y-3 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-3">
          <p className="text-xs text-muted">
            Sätze, Wiederholungen und Pause bleiben erhalten.
          </p>
          <ExerciseSearchPicker
            library={library}
            selectedUid={replacement?.uid ?? null}
            excludeUid={ex.uid}
            onSelect={setReplacement}
            placeholder="Ersatz-Übung suchen …"
          />
          {replacement && (
            <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface-2/60 px-3 py-2">
              <span className="text-sm font-medium text-foreground">
                {replacement.name}
              </span>
              <MuscleBadge muscleGroup={replacement.muscleGroup} />
            </div>
          )}
          {error && <ErrorNote message={error} />}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleReplace}
              disabled={!replacement || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Ersetzt …
                </>
              ) : (
                <>
                  <Repeat className="size-4" /> Ersetzen
                </>
              )}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={close}>
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      {/* Entfernen (Bestätigung) */}
      {panel === "remove" && (
        <div className="space-y-3 rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 px-3 py-3">
          <p className="text-sm text-foreground">
            „{ex.name}“ wirklich aus diesem Trainingstag entfernen?
          </p>
          <p className="text-xs text-muted">
            Die Übung selbst bleibt erhalten — nur die Zuordnung zu diesem Tag
            wird gelöscht.
          </p>
          {error && <ErrorNote message={error} />}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleRemove}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Entfernt …
                </>
              ) : (
                <>
                  <Trash2 className="size-4" /> Entfernen
                </>
              )}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={close}>
              Abbrechen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ActionButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}

function ActionButton({ active, onClick, icon, label, danger }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? danger
            ? "border-danger/50 bg-danger/10 text-danger"
            : "border-accent/50 bg-accent-soft text-accent"
          : danger
            ? "border-border bg-surface text-muted hover:border-danger/40 hover:text-danger"
            : "border-border bg-surface text-muted hover:bg-surface-3 hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
}

function NumberField({ label, value, onChange, min, max }: NumberFieldProps) {
  return (
    <label className="space-y-1">
      <span className="block text-[11px] font-medium text-muted">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[var(--radius-sm)] border border-border bg-surface-2 px-2.5 py-1.5 text-sm text-foreground tabular-nums focus-visible:border-accent focus-visible:outline-none"
      />
    </label>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
    >
      {message}
    </p>
  );
}
