"use client";

import { useActionState, useOptimistic, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updatePrivacySettings } from "./actions";
import type { UpdatePrivacySettings } from "@/lib/validation/profile";

interface PrivacyToggle {
  key: keyof UpdatePrivacySettings;
  label: string;
  description: string;
}

const TOGGLES: PrivacyToggle[] = [
  {
    key: "showTraining",
    label: "Training",
    description: "Ob dein Team sieht, wenn du trainiert hast.",
  },
  {
    key: "showSteps",
    label: "Schritte",
    description: "Ob dein Team deinen Schrittstatus sieht.",
  },
  {
    key: "showNutrition",
    label: "Ernährung",
    description: "Ob dein Team sieht, ob du etwas geloggt hast.",
  },
  {
    key: "showWater",
    label: "Wasser",
    description: "Ob dein Team deinen Wasserstatus sieht.",
  },
  {
    key: "showHabits",
    label: "Habits",
    description: "Ob dein Team sieht, wie viele Habits du erledigt hast.",
  },
  {
    key: "showWeeklyCheckinStatus",
    label: "Wöchentlicher Check-in",
    description:
      "Ob dein Team sieht, ob du den Body-Check-in diese Woche gemacht hast.",
  },
  {
    key: "showInRanking",
    label: "In der Rangliste erscheinen",
    description:
      "Wenn aus, erscheinst du in der Team-Rangliste als 'Privat'. Deine eigene Ansicht zeigt weiterhin deine Punkte.",
  },
];

interface PrivacySettingsFormProps {
  current: UpdatePrivacySettings;
}

const initialActionState = { error: undefined, success: undefined };

export function PrivacySettingsForm({ current }: PrivacySettingsFormProps) {
  const [actionState, formAction, isPending] = useActionState(
    updatePrivacySettings,
    initialActionState,
  );
  const [optimistic, setOptimistic] = useOptimistic(current);
  const [, startTransition] = useTransition();

  function toggle(key: keyof UpdatePrivacySettings) {
    startTransition(() => {
      setOptimistic((prev) => ({ ...prev, [key]: !prev[key] }));
    });
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Hidden fields for all values */}
      {TOGGLES.map((t) => (
        <input
          key={t.key}
          type="hidden"
          name={t.key}
          value={optimistic[t.key] ? "true" : "false"}
        />
      ))}

      <div className="space-y-3">
        {TOGGLES.map((toggle_item) => (
          <div
            key={toggle_item.key}
            className="flex items-start justify-between gap-4 rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                {toggle_item.label}
              </p>
              <p className="text-xs text-dim">{toggle_item.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={optimistic[toggle_item.key]}
              onClick={() => toggle(toggle_item.key)}
              className={[
                "relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                optimistic[toggle_item.key]
                  ? "bg-accent"
                  : "bg-border",
              ].join(" ")}
            >
              <span
                className={[
                  "pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform",
                  optimistic[toggle_item.key]
                    ? "translate-x-5"
                    : "translate-x-0",
                ].join(" ")}
              />
            </button>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Datenschutz speichern
      </Button>

      {actionState.error && (
        <p className="text-xs text-destructive">{actionState.error}</p>
      )}
      {actionState.success && (
        <p className="text-xs text-success">Einstellungen gespeichert.</p>
      )}
    </form>
  );
}
