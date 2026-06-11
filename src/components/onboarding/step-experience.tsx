"use client";

import { OptionCard } from "./option-card";
import type { StepProps } from "./wizard-state";

const EXPERIENCE_OPTIONS = [
  {
    value: "beginner",
    title: "Anfänger",
    description: "Neu dabei oder längere Pause — wir starten ruhig.",
  },
  {
    value: "intermediate",
    title: "Mittel",
    description: "Du trainierst schon eine Weile regelmäßig.",
  },
  {
    value: "advanced",
    title: "Fortgeschritten",
    description: "Training ist fester Teil deines Lebens.",
  },
] as const;

export function StepExperience({ state, update }: StepProps) {
  return (
    <div className="grid gap-2">
      {EXPERIENCE_OPTIONS.map((option) => (
        <OptionCard
          key={option.value}
          selected={state.experienceLevel === option.value}
          onSelect={() => update({ experienceLevel: option.value })}
          title={option.title}
          description={option.description}
        />
      ))}
    </div>
  );
}
