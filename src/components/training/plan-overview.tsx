import { CalendarDays, MapPin, Target } from "lucide-react";
import {
  GOAL_TYPE_LABELS,
  LOCATION_LABELS,
} from "@/lib/training/labels";
import type { ActivePlan } from "@/lib/training/get-active-plan";
import { DayCard } from "./day-card";

interface PlanOverviewProps {
  plan: ActivePlan;
  highlightDayIndex: number | null;
}

interface MetaChip {
  icon: typeof Target;
  label: string;
}

/** Plan-Kopf (Ziel, Tage/Woche, Ort) + Liste aller Trainingstage. */
export function PlanOverview({ plan, highlightDayIndex }: PlanOverviewProps) {
  const chips: MetaChip[] = [];
  if (plan.goalType && GOAL_TYPE_LABELS[plan.goalType]) {
    chips.push({ icon: Target, label: GOAL_TYPE_LABELS[plan.goalType] });
  }
  if (plan.daysPerWeek) {
    chips.push({
      icon: CalendarDays,
      label: `${plan.daysPerWeek}× pro Woche`,
    });
  }
  if (plan.location && LOCATION_LABELS[plan.location]) {
    chips.push({ icon: MapPin, label: LOCATION_LABELS[plan.location] });
  }

  return (
    <div className="space-y-6">
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted"
            >
              <chip.icon className="size-3.5 text-accent" />
              {chip.label}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {plan.days.map((day) => (
          <DayCard
            key={day.id}
            day={day}
            highlight={day.dayIndex === highlightDayIndex}
          />
        ))}
      </div>
    </div>
  );
}
