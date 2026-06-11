"use client";

import { Label } from "@/components/ui/label";
import { MINUTES_OPTIONS } from "@/lib/validation/onboarding";
import { OptionChip } from "./option-card";
import type { StepProps } from "./wizard-state";

const DAY_OPTIONS = [2, 3, 4, 5, 6] as const;

/** Wochentage in UI-Reihenfolge Mo–So; Werte folgen JS-Konvention (0=So … 6=Sa). */
const WEEKDAYS = [
  { value: 1, label: "Mo" },
  { value: 2, label: "Di" },
  { value: 3, label: "Mi" },
  { value: 4, label: "Do" },
  { value: 5, label: "Fr" },
  { value: 6, label: "Sa" },
  { value: 0, label: "So" },
] as const;

export function StepSchedule({ state, update }: StepProps) {
  function toggleDay(day: number) {
    const next = state.preferredDays.includes(day)
      ? state.preferredDays.filter((d) => d !== day)
      : [...state.preferredDays, day];
    update({ preferredDays: next });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Wie viele Tage pro Woche willst du trainieren?</Label>
        <div className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map((days) => (
            <OptionChip
              key={days}
              selected={state.daysPerWeek === days}
              onSelect={() => update({ daysPerWeek: days })}
              label={`${days} Tage`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Wie viel Zeit hast du pro Training?</Label>
        <div className="flex flex-wrap gap-2">
          {MINUTES_OPTIONS.map((minutes) => (
            <OptionChip
              key={minutes}
              selected={state.minutesPerSession === minutes}
              onSelect={() => update({ minutesPerSession: minutes })}
              label={`${minutes} Min.`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Bevorzugte Trainingstage (optional)</Label>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => (
            <OptionChip
              key={day.value}
              selected={state.preferredDays.includes(day.value)}
              onSelect={() => toggleDay(day.value)}
              label={day.label}
            />
          ))}
        </div>
        <p className="text-xs text-dim">
          Hilft später bei der Wochenplanung — du kannst es leer lassen.
        </p>
      </div>
    </div>
  );
}
