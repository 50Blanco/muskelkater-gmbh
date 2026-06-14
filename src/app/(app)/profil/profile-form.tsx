"use client";

import { useActionState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDisplayName, updateFitnessGoal } from "./actions";
import { GOAL_TYPE_LABELS } from "@/lib/validation/profile";

const GOAL_TYPES = [
  "build_muscle",
  "lose_fat",
  "get_fit",
  "strength",
  "maintain",
] as const;

type GoalType = (typeof GOAL_TYPES)[number];

interface ProfileFormProps {
  currentDisplayName: string | null;
  currentGoalType: GoalType | null;
}

const initialState = { error: undefined, success: undefined };

export function ProfileForm({
  currentDisplayName,
  currentGoalType,
}: ProfileFormProps) {
  const [nameState, nameAction, namePending] = useActionState(
    updateDisplayName,
    initialState,
  );
  const [goalState, goalAction, goalPending] = useActionState(
    updateFitnessGoal,
    initialState,
  );

  return (
    <div className="space-y-6">
      {/* Display Name */}
      <form action={nameAction} className="space-y-3">
        <Label htmlFor="displayName" className="text-sm font-medium text-foreground">
          Anzeigename
        </Label>
        <div className="flex gap-2">
          <Input
            id="displayName"
            name="displayName"
            defaultValue={currentDisplayName ?? ""}
            placeholder="Wie soll dein Team dich nennen?"
            maxLength={30}
          />
          <Button type="submit" disabled={namePending} className="shrink-0">
            {namePending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Pencil className="size-4" />
            )}
            <span className="hidden sm:inline">Speichern</span>
          </Button>
        </div>
        {nameState.error && (
          <p className="text-xs text-destructive">{nameState.error}</p>
        )}
        {nameState.success && (
          <p className="text-xs text-success">Anzeigename gespeichert.</p>
        )}
      </form>

      {/* Fitnessziel */}
      <form action={goalAction} className="space-y-3">
        <Label className="text-sm font-medium text-foreground">Fitnessziel</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {GOAL_TYPES.map((g) => (
            <label
              key={g}
              className={[
                "flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border px-4 py-3 text-sm transition-colors",
                currentGoalType === g
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border bg-surface text-dim hover:border-accent/50",
              ].join(" ")}
            >
              <input
                type="radio"
                name="goalType"
                value={g}
                defaultChecked={currentGoalType === g}
                className="accent-accent"
              />
              {GOAL_TYPE_LABELS[g]}
            </label>
          ))}
        </div>
        <Button
          type="submit"
          variant="secondary"
          disabled={goalPending}
          className="w-full"
        >
          {goalPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          Ziel speichern
        </Button>
        {goalState.error && (
          <p className="text-xs text-destructive">{goalState.error}</p>
        )}
        {goalState.success && (
          <p className="text-xs text-success">Ziel aktualisiert.</p>
        )}
      </form>
    </div>
  );
}
