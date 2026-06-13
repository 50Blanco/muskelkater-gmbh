import { CheckCircle2, Circle, ClipboardCheck, Droplets, Dumbbell, Footprints, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemberDailyStatus } from "@/lib/social/challenge-scoring";

interface Props {
  status: MemberDailyStatus;
  weeklyCheckinDone?: boolean;
}

function formatSteps(steps: number | null): string {
  if (steps == null) return "—";
  return steps.toLocaleString("de-DE");
}

/** Kompakte Status-Pills für den heutigen Tag (Training/Essen/Wasser/Schritte) + wöchentlicher Check-in. */
export function MemberStatusPills({ status, weeklyCheckinDone }: Props) {
  const signals = [
    { key: "workout", label: "Training", done: status.workoutDone, Icon: Dumbbell },
    { key: "food", label: "Essen", done: status.nutritionLogged, Icon: Utensils },
    { key: "water", label: "Wasser", done: status.waterGoalReached, Icon: Droplets },
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {signals.map(({ key, label, done, Icon }) => (
        <span
          key={key}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            done
              ? "border-success/40 bg-success/10 text-success"
              : "border-border bg-surface text-dim",
          )}
        >
          {done ? (
            <CheckCircle2 className="size-3" />
          ) : (
            <Circle className="size-3" />
          )}
          <Icon className="size-3" />
          {label}
        </span>
      ))}
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums",
          status.stepsGoalReached
            ? "border-success/40 bg-success/10 text-success"
            : "border-border bg-surface text-muted",
        )}
      >
        <Footprints className="size-3" />
        {formatSteps(status.steps)}
      </span>
      {weeklyCheckinDone != null && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            weeklyCheckinDone
              ? "border-success/40 bg-success/10 text-success"
              : "border-border bg-surface text-dim",
          )}
        >
          {weeklyCheckinDone ? (
            <CheckCircle2 className="size-3" />
          ) : (
            <Circle className="size-3" />
          )}
          <ClipboardCheck className="size-3" />
          Check-in
        </span>
      )}
    </div>
  );
}
