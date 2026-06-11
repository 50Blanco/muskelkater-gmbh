"use client";

import {
  AlertTriangle,
  Check,
  Plus,
  Repeat,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatRest,
  formatSetsReps,
  muscleGroupLabel,
} from "@/lib/training/labels";
import {
  FEEDBACK_REASONS,
  FEEDBACK_REASON_LABELS,
  isPainReason,
  type FeedbackReason,
} from "@/lib/workout/reasons";
import type { SlimExercise } from "@/lib/workout/alternatives";
import type { ExerciseState, SetState } from "./types";

const PAIN_HINT =
  "Wenn eine Übung Schmerzen verursacht, brich sie ab und kläre es ggf. medizinisch ab.";

interface Props {
  exercise: ExerciseState;
  position: number;
  alternatives: SlimExercise[];
  onUpdate: (key: string, updater: (ex: ExerciseState) => ExerciseState) => void;
  onRemove: (key: string) => void;
}

function emptySet(): SetState {
  return { weightKg: "", reps: "", completed: false };
}

export function ExerciseSessionCard({
  exercise: ex,
  position,
  alternatives,
  onUpdate,
  onRemove,
}: Props) {
  const isBodyweight = ex.equipment === "bodyweight" || ex.equipment === null;
  const doneCount = ex.sets.filter((s) => s.completed).length;

  const patchSet = (index: number, patch: Partial<SetState>) =>
    onUpdate(ex.key, (cur) => ({
      ...cur,
      sets: cur.sets.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));

  const addSet = () =>
    onUpdate(ex.key, (cur) => ({ ...cur, sets: [...cur.sets, emptySet()] }));

  const removeSet = (index: number) =>
    onUpdate(ex.key, (cur) => ({
      ...cur,
      sets:
        cur.sets.length > 1
          ? cur.sets.filter((_, i) => i !== index)
          : cur.sets,
    }));

  const setPreference = (preference: "like" | "dislike") =>
    onUpdate(ex.key, (cur) => ({
      ...cur,
      preference: cur.preference === preference ? null : preference,
      reason: preference === "like" ? null : cur.reason,
    }));

  const setReason = (reason: FeedbackReason) =>
    onUpdate(ex.key, (cur) => ({
      ...cur,
      reason: cur.reason === reason ? null : reason,
    }));

  const swapTo = (alt: SlimExercise) =>
    onUpdate(ex.key, (cur) => ({
      ...cur,
      logExerciseId: alt.id,
      name: alt.name,
      equipment: alt.equipment,
      location: alt.location,
      instructions: alt.instructions,
      swappedToName: alt.name,
    }));

  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface-2/80 p-4">
      {/* Kopf */}
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-3 text-sm font-semibold text-muted">
          {position}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="font-display text-base font-semibold text-foreground">
              {ex.name}
            </h3>
            <span className="text-sm font-semibold tabular-nums text-muted">
              Ziel {formatSetsReps(ex.targetSets, ex.targetReps)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="rounded-full bg-surface px-2 py-0.5">
              {muscleGroupLabel(ex.muscleGroup)}
            </span>
            <span>Pause {formatRest(ex.targetRestSec)}</span>
            {ex.kind === "custom" && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">
                Eigene Übung
              </span>
            )}
            {ex.swappedToName && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">
                Ersetzt
              </span>
            )}
          </div>
        </div>
        {ex.removable && (
          <button
            type="button"
            onClick={() => onRemove(ex.key)}
            aria-label="Übung aus dieser Session entfernen"
            className="shrink-0 rounded-[var(--radius-sm)] p-1.5 text-dim transition-colors hover:bg-surface-3 hover:text-foreground"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      {ex.instructions && (
        <p className="mt-2 text-xs leading-relaxed text-dim">
          <span className="text-muted">Technik:</span> {ex.instructions}
        </p>
      )}

      {/* Sätze */}
      <div className="mt-3 space-y-2">
        <div className="grid grid-cols-[2rem_1fr_1fr_2.75rem] items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-dim">
          <span>Satz</span>
          <span>{isBodyweight ? "Gewicht" : "Gewicht (kg)"}</span>
          <span>Wdh.</span>
          <span className="text-right">OK</span>
        </div>
        {ex.sets.map((set, index) => (
          <div
            key={index}
            className="grid grid-cols-[2rem_1fr_1fr_2.75rem] items-center gap-2"
          >
            <span className="grid size-7 place-items-center rounded-full bg-surface text-xs font-semibold tabular-nums text-muted">
              {index + 1}
            </span>
            {isBodyweight ? (
              <span className="flex h-11 items-center rounded-[var(--radius-sm)] border border-dashed border-border bg-surface/40 px-3 text-xs text-dim">
                Körpergewicht
              </span>
            ) : (
              <Input
                inputMode="decimal"
                placeholder="–"
                aria-label={`Gewicht Satz ${index + 1} in kg`}
                value={set.weightKg}
                onChange={(e) => patchSet(index, { weightKg: e.target.value })}
                className="h-11 text-center"
              />
            )}
            <Input
              inputMode="numeric"
              placeholder={ex.targetReps ? String(ex.targetReps) : "–"}
              aria-label={`Wiederholungen Satz ${index + 1}`}
              value={set.reps}
              onChange={(e) => patchSet(index, { reps: e.target.value })}
              className="h-11 text-center"
            />
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => patchSet(index, { completed: !set.completed })}
                aria-label={`Satz ${index + 1} als erledigt markieren`}
                aria-pressed={set.completed}
                className={cn(
                  "grid size-11 place-items-center rounded-[var(--radius-sm)] border transition-colors",
                  set.completed
                    ? "border-success/60 bg-success/15 text-success"
                    : "border-border bg-surface text-dim hover:text-foreground",
                )}
              >
                <Check className="size-5" />
              </button>
            </div>
            {ex.sets.length > 1 && (
              <button
                type="button"
                onClick={() => removeSet(index)}
                aria-label={`Satz ${index + 1} entfernen`}
                className="col-start-4 -mt-1 justify-self-end text-[11px] text-dim hover:text-danger"
              >
                entfernen
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addSet}
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-dashed border-border text-xs font-medium text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
        >
          <Plus className="size-3.5" /> Satz hinzufügen
        </button>
        {doneCount > 0 && (
          <p className="px-1 text-[11px] text-dim">
            {doneCount} von {ex.sets.length} Sätzen erledigt
          </p>
        )}
      </div>

      {/* Feedback (nur für Katalog-Übungen) */}
      {ex.kind === "catalog" && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Wie war die Übung?</span>
            <button
              type="button"
              onClick={() => setPreference("like")}
              aria-pressed={ex.preference === "like"}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                ex.preference === "like"
                  ? "border-success/60 bg-success/15 text-success"
                  : "border-border text-muted hover:text-foreground",
              )}
            >
              <ThumbsUp className="size-3.5" /> Behalten
            </button>
            <button
              type="button"
              onClick={() => setPreference("dislike")}
              aria-pressed={ex.preference === "dislike"}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                ex.preference === "dislike"
                  ? "border-accent/60 bg-accent-soft text-accent"
                  : "border-border text-muted hover:text-foreground",
              )}
            >
              <ThumbsDown className="size-3.5" /> Ersetzen
            </button>
          </div>

          {ex.preference === "dislike" && (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {FEEDBACK_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setReason(reason)}
                    aria-pressed={ex.reason === reason}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      ex.reason === reason
                        ? "border-accent/60 bg-accent-soft text-accent"
                        : "border-border text-muted hover:text-foreground",
                    )}
                  >
                    {FEEDBACK_REASON_LABELS[reason]}
                  </button>
                ))}
              </div>

              {isPainReason(ex.reason) && (
                <div className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>{PAIN_HINT}</span>
                </div>
              )}

              {alternatives.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-dim">
                    Alternativen — du kannst direkt eine davon machen:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {alternatives.map((alt) => (
                      <button
                        key={alt.id}
                        type="button"
                        onClick={() => swapTo(alt)}
                        className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-accent/50 hover:text-foreground"
                      >
                        <Repeat className="size-3" /> {alt.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-dim">
                Wir berücksichtigen das bei zukünftigen Anpassungen.
              </p>
            </div>
          )}

          {ex.preference === "like" && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-success">
              <Check className="size-3.5" /> Bleibt in deinem Plan.
            </p>
          )}
        </div>
      )}

      {ex.swappedToName && ex.kind === "catalog" && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
          <X className="size-3 text-dim" /> Diese Sätze zählen jetzt für „
          {ex.swappedToName}“.
        </p>
      )}
    </div>
  );
}
