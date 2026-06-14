"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { addMealLog } from "@/app/(app)/ernaehrung/actions";
import { MEAL_KEYS, MEAL_TYPE_LABELS } from "@/lib/validation/nutrition";
import { cn } from "@/lib/utils";

type State = { error: string } | { ok: true } | null;

const initialState: State = null;

export function MealLogForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: State, formData: FormData) => {
      const caloriesRaw = formData.get("caloriesKcal");
      const proteinRaw = formData.get("proteinG");
      return addMealLog({
        mealType: formData.get("mealType"),
        title: String(formData.get("title") ?? "").trim(),
        caloriesKcal: caloriesRaw ? parseInt(String(caloriesRaw), 10) : null,
        proteinG: proteinRaw ? parseInt(String(proteinRaw), 10) : null,
      });
    },
    initialState,
  );

  const success = state && "ok" in state;

  return (
    <form action={formAction} className="space-y-3">
      {/* Mahlzeit-Typ */}
      <div className="grid grid-cols-4 gap-1.5">
        {MEAL_KEYS.map((key) => (
          <label
            key={key}
            className="relative cursor-pointer"
          >
            <input
              type="radio"
              name="mealType"
              value={key}
              defaultChecked={key === "fruehstueck"}
              required
              className="peer sr-only"
            />
            <span className="flex items-center justify-center rounded-[var(--radius-sm)] border border-border bg-surface px-1.5 py-2 text-center text-xs text-muted transition-colors peer-checked:border-accent/60 peer-checked:bg-accent/10 peer-checked:text-accent">
              {MEAL_TYPE_LABELS[key]}
            </span>
          </label>
        ))}
      </div>

      {/* Bezeichnung */}
      <input
        type="text"
        name="title"
        placeholder="Was gegessen? z. B. Haferflocken mit Beeren"
        required
        maxLength={120}
        className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-dim focus:outline-none focus:ring-1 focus:ring-accent/50"
      />

      {/* Optionale Makros */}
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <input
            type="number"
            name="caloriesKcal"
            placeholder="Kalorien (optional)"
            min={1}
            max={9999}
            className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-dim focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-dim">
            kcal
          </span>
        </div>
        <div className="relative">
          <input
            type="number"
            name="proteinG"
            placeholder="Protein (optional)"
            min={1}
            max={500}
            className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-dim focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-dim">
            g
          </span>
        </div>
      </div>

      {state && "error" in state && (
        <p role="alert" className="text-xs text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] py-2.5 text-sm font-medium transition-colors",
          isPending
            ? "cursor-not-allowed bg-surface-3 text-dim"
            : "bg-accent text-white hover:bg-accent/90",
        )}
      >
        <Plus className="size-4" />
        {isPending ? "Wird gespeichert…" : "Mahlzeit eintragen"}
      </button>

      {success && (
        <p className="text-center text-xs text-success">Eingetragen.</p>
      )}
    </form>
  );
}
