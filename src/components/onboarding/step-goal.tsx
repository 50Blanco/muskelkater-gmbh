"use client";

import { Dumbbell, Flame, Heart, Scale, TrendingUp, Zap } from "lucide-react";
import type { GoalChoice } from "@/lib/validation/onboarding";
import { OptionCard } from "./option-card";
import type { StepProps } from "./wizard-state";

const GOAL_OPTIONS: {
  value: GoalChoice;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "build_muscle",
    title: "Muskeln aufbauen",
    description: "Mehr Kraft und sichtbare Muskulatur.",
    icon: <Dumbbell className="size-5" />,
  },
  {
    value: "lose_fat",
    title: "Fett verlieren",
    description: "Nachhaltig abnehmen, ohne Crash-Diät.",
    icon: <Flame className="size-5" />,
  },
  {
    value: "get_fit",
    title: "Fitter werden",
    description: "Mehr Energie und Ausdauer im Alltag.",
    icon: <Zap className="size-5" />,
  },
  {
    value: "health",
    title: "Gesundheit verbessern",
    description: "Beweglich und belastbar bleiben.",
    icon: <Heart className="size-5" />,
  },
  {
    value: "performance",
    title: "Sportleistung verbessern",
    description: "Stärker werden für deinen Sport.",
    icon: <TrendingUp className="size-5" />,
  },
  {
    value: "maintain",
    title: "Gewicht halten",
    description: "Form halten mit klarer Routine.",
    icon: <Scale className="size-5" />,
  },
];

export function StepGoal({ state, update }: StepProps) {
  return (
    <div className="grid gap-2">
      {GOAL_OPTIONS.map((option) => (
        <OptionCard
          key={option.value}
          selected={state.goalChoice === option.value}
          onSelect={() => update({ goalChoice: option.value })}
          title={option.title}
          description={option.description}
          icon={option.icon}
        />
      ))}
    </div>
  );
}
