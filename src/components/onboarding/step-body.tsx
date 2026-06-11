"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionChip } from "./option-card";
import type { StepProps } from "./wizard-state";

const SEX_OPTIONS = [
  { value: "male", label: "Männlich" },
  { value: "female", label: "Weiblich" },
  { value: "diverse", label: "Divers" },
  { value: "prefer_not_say", label: "Keine Angabe" },
] as const;

export function StepBody({ state, update }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Wie sollen wir dich nennen?</Label>
        <Input
          id="displayName"
          value={state.displayName}
          onChange={(e) => update({ displayName: e.target.value })}
          placeholder="z. B. Akram"
          autoComplete="given-name"
          maxLength={40}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Geschlecht</Label>
        <div className="flex flex-wrap gap-2">
          {SEX_OPTIONS.map((option) => (
            <OptionChip
              key={option.value}
              selected={state.sex === option.value}
              onSelect={() => update({ sex: option.value })}
              label={option.label}
            />
          ))}
        </div>
        <p className="text-xs text-dim">
          Optional — verbessert nur die Kalorienberechnung.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="birthDate">Geburtsdatum</Label>
        <Input
          id="birthDate"
          type="date"
          value={state.birthDate}
          onChange={(e) => update({ birthDate: e.target.value })}
          autoComplete="bday"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="heightCm">Größe (cm)</Label>
          <Input
            id="heightCm"
            inputMode="decimal"
            value={state.heightCm}
            onChange={(e) => update({ heightCm: e.target.value })}
            placeholder="z. B. 180"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="weightKg">Gewicht (kg)</Label>
          <Input
            id="weightKg"
            inputMode="decimal"
            value={state.weightKg}
            onChange={(e) => update({ weightKg: e.target.value })}
            placeholder="z. B. 82,5"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="waistCm">Bauchumfang (cm)</Label>
          <Input
            id="waistCm"
            inputMode="decimal"
            value={state.waistCm}
            onChange={(e) => update({ waistCm: e.target.value })}
            placeholder="z. B. 90"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="armCm">Armumfang (cm)</Label>
          <Input
            id="armCm"
            inputMode="decimal"
            value={state.armCm}
            onChange={(e) => update({ armCm: e.target.value })}
            placeholder="z. B. 35"
          />
        </div>
      </div>
      <p className="text-xs text-dim">
        Umfänge bitte entspannt messen — sie sind dein Startpunkt für den
        Fortschritt.
      </p>
    </div>
  );
}
