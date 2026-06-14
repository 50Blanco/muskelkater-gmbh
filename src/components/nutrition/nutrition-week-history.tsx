import { CheckCircle2, Circle } from "lucide-react";
import type { DayNutritionSummary } from "@/lib/nutrition/nutrition-data";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00Z");
  return DAY_LABELS[date.getUTCDay() === 0 ? 6 : date.getUTCDay() - 1] ?? "–";
}

function isToday(dateStr: string, todayStr: string): boolean {
  return dateStr === todayStr;
}

interface Props {
  summaries: DayNutritionSummary[];
  todayStr: string;
}

export function NutritionWeekHistory({ summaries, todayStr }: Props) {
  if (summaries.length === 0) return null;

  return (
    <div className="grid grid-cols-7 gap-1">
      {summaries.map((s) => {
        const logged =
          s.mealCount > 0 ||
          (s.proteinG != null && s.proteinG > 0) ||
          (s.caloriesKcal != null && s.caloriesKcal > 0);
        const today = isToday(s.logDate, todayStr);

        return (
          <div
            key={s.logDate}
            className={cn(
              "flex flex-col items-center gap-1 rounded-[var(--radius-sm)] py-2",
              today && "bg-surface-2",
            )}
          >
            <span
              className={cn(
                "text-xs",
                today ? "font-semibold text-foreground" : "text-dim",
              )}
            >
              {getDayLabel(s.logDate)}
            </span>
            {logged ? (
              <CheckCircle2 className="size-4 text-success" />
            ) : (
              <Circle className="size-4 text-dim" />
            )}
            {s.mealCount > 0 && (
              <span className="text-xs text-dim">{s.mealCount}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
