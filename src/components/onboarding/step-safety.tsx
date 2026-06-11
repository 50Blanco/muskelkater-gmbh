"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { DISCLAIMER_TEXT } from "@/lib/safety/disclaimer";
import { detectDangerSymptoms, MEDICAL_WARNING } from "@/lib/safety/symptoms";
import { OptionCard } from "./option-card";
import type { StepProps } from "./wizard-state";

export function StepSafety({ state, update }: StepProps) {
  // Rein visuelle Markierung; verhält sich wie "keine Einschränkungen".
  const [isRachid, setIsRachid] = useState(false);

  const symptoms = state.hasLimitations
    ? detectDangerSymptoms(state.limitations)
    : [];

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Hast du Verletzungen oder Einschränkungen?</Label>
        <div className="grid gap-2">
          <OptionCard
            selected={state.hasLimitations === false && !isRachid}
            onSelect={() => {
              setIsRachid(false);
              update({ hasLimitations: false, limitations: "" });
            }}
            title="Nein"
            description="Keine bekannten Einschränkungen."
          />
          <OptionCard
            selected={state.hasLimitations === true}
            onSelect={() => {
              setIsRachid(false);
              update({ hasLimitations: true });
            }}
            title="Ja"
            description="Ich beschreibe es kurz."
          />
          <OptionCard
            selected={isRachid}
            onSelect={() => {
              setIsRachid(true);
              update({ hasLimitations: false, limitations: "" });
            }}
            title="Ich bin Rachid"
            description="Training? - Was?"
          />
        </div>
      </div>

      {state.hasLimitations && (
        <div className="space-y-1.5">
          <Label htmlFor="limitations">Was sollten wir wissen?</Label>
          <textarea
            id="limitations"
            value={state.limitations}
            onChange={(e) => update({ limitations: e.target.value })}
            placeholder="z. B. Knieprobleme, Rückenschmerzen, frühere Verletzung …"
            rows={3}
            maxLength={500}
            className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-dim transition-colors focus-visible:border-accent focus-visible:outline-none"
          />
        </div>
      )}

      {symptoms.length > 0 && (
        <div className="flex gap-3 rounded-[var(--radius-sm)] border border-warning/40 bg-warning/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <p className="text-sm text-foreground">
            {MEDICAL_WARNING}{" "}
            <span className="text-muted">
              (Erkannt: {symptoms.join(", ")})
            </span>
          </p>
        </div>
      )}

      <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius)] border border-border bg-surface px-4 py-3.5">
        <input
          type="checkbox"
          checked={state.disclaimerAccepted}
          onChange={(e) => update({ disclaimerAccepted: e.target.checked })}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--color-accent)]"
        />
        <span className="text-sm text-muted">{DISCLAIMER_TEXT}</span>
      </label>
    </div>
  );
}
