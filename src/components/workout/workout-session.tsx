"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { finishWorkout } from "@/app/(app)/training/actions";
import { findAlternatives, type SlimExercise } from "@/lib/workout/alternatives";
import type {
  CustomExerciseRow,
  SessionDay,
} from "@/lib/workout/session-data";
import { ExerciseSessionCard } from "./exercise-session-card";
import type { ExerciseState, SetState } from "./types";

interface Props {
  sessionId: string;
  day: SessionDay;
  catalog: SlimExercise[];
  customExercises: CustomExerciseRow[];
}

function emptySet(): SetState {
  return { weightKg: "", reps: "", completed: false };
}

function buildSets(count: number): SetState[] {
  return Array.from({ length: Math.max(1, count) }, emptySet);
}

function initExercises(day: SessionDay): ExerciseState[] {
  return day.exercises.map((ex) => ({
    key: `plan-${ex.id}`,
    kind: "catalog",
    logExerciseId: ex.exerciseId,
    logCustomExerciseId: null,
    feedbackExerciseId: ex.exerciseId,
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    equipment: ex.equipment,
    location: ex.location,
    instructions: ex.instructions,
    targetSets: ex.targetSets,
    targetReps: ex.targetReps,
    targetRestSec: ex.targetRestSec,
    sets: buildSets(ex.targetSets ?? 3),
    preference: null,
    reason: null,
    swappedToName: null,
    removable: false,
  }));
}

function customToState(c: CustomExerciseRow): ExerciseState {
  return {
    key: `custom-${c.id}`,
    kind: "custom",
    logExerciseId: null,
    logCustomExerciseId: c.id,
    feedbackExerciseId: null,
    name: c.name,
    muscleGroup: c.muscleGroup,
    equipment: c.equipment,
    location: c.location,
    instructions: c.instructions,
    targetSets: 3,
    targetReps: null,
    targetRestSec: null,
    sets: buildSets(3),
    preference: null,
    reason: null,
    swappedToName: null,
    removable: true,
  };
}

const RPE_SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function WorkoutSession({
  sessionId,
  day,
  catalog,
  customExercises,
}: Props) {
  const router = useRouter();
  const [exercises, setExercises] = useState<ExerciseState[]>(() =>
    initExercises(day),
  );
  const [rpe, setRpe] = useState<number | null>(null);
  const [pickerId, setPickerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const updateExercise = (
    key: string,
    updater: (ex: ExerciseState) => ExerciseState,
  ) =>
    setExercises((prev) =>
      prev.map((ex) => (ex.key === key ? updater(ex) : ex)),
    );

  const removeExercise = (key: string) =>
    setExercises((prev) => prev.filter((ex) => ex.key !== key));

  const availableCustom = useMemo(
    () =>
      customExercises.filter(
        (c) => !exercises.some((ex) => ex.logCustomExerciseId === c.id),
      ),
    [customExercises, exercises],
  );

  const addCustom = () => {
    const found = availableCustom.find((c) => c.id === pickerId);
    if (!found) return;
    setExercises((prev) => [...prev, customToState(found)]);
    setPickerId("");
  };

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const doneSets = exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0,
  );

  const handleFinish = () => {
    setError(null);
    const sets = exercises.flatMap((ex) =>
      ex.sets.map((s, i) => ({
        exerciseId: ex.logExerciseId,
        customExerciseId: ex.logCustomExerciseId,
        setNumber: i + 1,
        weightKg: s.weightKg,
        reps: s.reps,
        completed: s.completed,
      })),
    );
    const feedback = exercises
      .filter(
        (ex) =>
          ex.kind === "catalog" &&
          ex.preference !== null &&
          ex.feedbackExerciseId,
      )
      .map((ex) => ({
        exerciseId: ex.feedbackExerciseId as string,
        preference: ex.preference as "like" | "dislike",
        reason: ex.reason,
      }));

    startTransition(async () => {
      const result = await finishWorkout({
        sessionId,
        dayId: day.id,
        durationMin: null,
        perceivedEffort: rpe,
        mood: null,
        soreness: null,
        sets,
        feedback,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  };

  /* Erfolgs-Screen */
  if (done) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-9" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-foreground">
          Stark. Training gespeichert.
        </h1>
        <p className="mt-2 text-sm text-muted">
          {doneSets > 0
            ? `${doneSets} ${doneSets === 1 ? "Satz" : "Sätze"} protokolliert. Gut gemacht.`
            : "Deine Einheit ist gespeichert. Weiter so."}
        </p>
        <div className="mt-7 flex flex-col gap-2">
          <Button onClick={() => router.push("/heute")} size="lg">
            Zurück zu Heute
          </Button>
          <Link
            href="/training"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Zum Trainingsplan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kopf */}
      <div className="space-y-3">
        <Link
          href="/training"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Trainingsplan
        </Link>
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-accent text-accent-foreground">
            <Dumbbell className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {day.title}
            </h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
              {day.focus && <span>{day.focus}</span>}
              {day.estMinutes ? (
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" /> ca. {day.estMinutes} Min.
                </span>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-2.5 text-sm">
          <Flame className="size-4 text-accent" />
          <span className="text-muted">
            <span className="font-semibold tabular-nums text-foreground">
              {doneSets}
            </span>{" "}
            von {totalSets} Sätzen erledigt
          </span>
        </div>
      </div>

      {/* Übungen */}
      <div className="space-y-3">
        {exercises.map((ex, index) => (
          <ExerciseSessionCard
            key={ex.key}
            exercise={ex}
            position={index + 1}
            alternatives={findAlternatives(
              catalog,
              {
                id: ex.logExerciseId ?? "",
                muscleGroup: ex.muscleGroup,
                location: ex.location,
              },
              4,
            )}
            onUpdate={updateExercise}
            onRemove={removeExercise}
          />
        ))}
      </div>

      {/* Eigene Übung zur Session hinzufügen */}
      <div className="rounded-[var(--radius)] border border-dashed border-border bg-surface/40 p-4">
        <p className="text-sm font-medium text-foreground">
          Eigene Übung hinzufügen
        </p>
        {availableCustom.length > 0 ? (
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <select
              value={pickerId}
              onChange={(e) => setPickerId(e.target.value)}
              className="h-11 flex-1 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
            >
              <option value="">Übung wählen …</option>
              {availableCustom.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="secondary"
              onClick={addCustom}
              disabled={!pickerId}
            >
              <Plus className="size-4" /> Hinzufügen
            </Button>
          </div>
        ) : (
          <p className="mt-1 text-xs text-dim">
            Lege unter{" "}
            <Link href="/training" className="text-accent hover:underline">
              Training
            </Link>{" "}
            eigene Übungen an, um sie hier zu nutzen.
          </p>
        )}
      </div>

      {/* Abschluss */}
      <div className="rounded-[var(--radius)] border border-border bg-surface-2/80 p-4">
        <p className="text-sm font-medium text-foreground">
          Wie hart war es?{" "}
          <span className="text-xs font-normal text-dim">(optional)</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {RPE_SCALE.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRpe(rpe === value ? null : value)}
              aria-pressed={rpe === value}
              className={cn(
                "grid size-9 place-items-center rounded-[var(--radius-sm)] border text-sm font-semibold tabular-nums transition-colors",
                rpe === value
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border text-muted hover:text-foreground",
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-dim">
          1 = sehr leicht · 10 = maximale Anstrengung
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <div className="sticky bottom-20 z-10 md:bottom-4">
        <Button
          onClick={handleFinish}
          disabled={isPending}
          size="lg"
          className="w-full shadow-lg"
        >
          {isPending ? (
            <>
              <Loader2 className="size-5 animate-spin" /> Speichert …
            </>
          ) : (
            "Workout abschließen"
          )}
        </Button>
      </div>
    </div>
  );
}
