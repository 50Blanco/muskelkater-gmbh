"use client";

import { Building2, Home, Shuffle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { OptionCard, OptionChip } from "./option-card";
import type { StepProps } from "./wizard-state";

const LOCATION_OPTIONS = [
  {
    value: "gym",
    title: "Im Gym",
    description: "Voller Gerätepark und freie Gewichte.",
    icon: <Building2 className="size-5" />,
  },
  {
    value: "home",
    title: "Zuhause",
    description: "Training in den eigenen vier Wänden.",
    icon: <Home className="size-5" />,
  },
  {
    value: "both",
    title: "Beides",
    description: "Flexibel — mal Gym, mal zuhause.",
    icon: <Shuffle className="size-5" />,
  },
] as const;

const EQUIPMENT_OPTIONS = [
  { value: "none", label: "Ohne Geräte" },
  { value: "dumbbells", label: "Kurzhanteln" },
  { value: "bands", label: "Widerstandsbänder" },
] as const;

export function StepLocation({ state, update }: StepProps) {
  const showEquipment =
    state.trainingLocation === "home" || state.trainingLocation === "both";

  return (
    <div className="space-y-5">
      <div className="grid gap-2">
        {LOCATION_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            selected={state.trainingLocation === option.value}
            onSelect={() =>
              update({
                trainingLocation: option.value,
                // Default für zuhause: ohne Geräte (sichere Annahme).
                homeEquipment:
                  option.value === "gym"
                    ? null
                    : (state.homeEquipment ?? "none"),
              })
            }
            title={option.title}
            description={option.description}
            icon={option.icon}
          />
        ))}
      </div>

      {showEquipment && (
        <div className="space-y-1.5">
          <Label>Was hast du zuhause?</Label>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((option) => (
              <OptionChip
                key={option.value}
                selected={state.homeEquipment === option.value}
                onSelect={() => update({ homeEquipment: option.value })}
                label={option.label}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
