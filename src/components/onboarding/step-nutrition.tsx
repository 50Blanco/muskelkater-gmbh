"use client";

import { Label } from "@/components/ui/label";
import { OptionCard } from "./option-card";
import type { StepProps } from "./wizard-state";

const STYLE_OPTIONS = [
  { value: "normal", title: "Normal", description: "Keine Besonderheiten." },
  {
    value: "vegetarian",
    title: "Vegetarisch",
    description: "Ohne Fleisch und Fisch.",
  },
  { value: "vegan", title: "Vegan", description: "Rein pflanzlich." },
  { value: "halal", title: "Halal", description: "Nach halal-Richtlinien." },
  {
    value: "no_preference",
    title: "Keine Angabe",
    description: "Später festlegen.",
  },
] as const;

const TRACKING_OPTIONS = [
  {
    value: "simple",
    title: "Einfach",
    description: "Mahlzeiten abhaken, Protein & Wasser im Blick. Empfohlen.",
  },
  {
    value: "precise",
    title: "Genau",
    description: "Kalorien und Protein in Zahlen tracken.",
  },
] as const;

export function StepNutrition({ state, update }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Wie ernährst du dich?</Label>
        <div className="grid gap-2">
          {STYLE_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              selected={state.nutritionStyle === option.value}
              onSelect={() => update({ nutritionStyle: option.value })}
              title={option.title}
              description={option.description}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Wie willst du deine Ernährung verfolgen?</Label>
        <div className="grid gap-2">
          {TRACKING_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              selected={state.trackingMode === option.value}
              onSelect={() => update({ trackingMode: option.value })}
              title={option.title}
              description={option.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
