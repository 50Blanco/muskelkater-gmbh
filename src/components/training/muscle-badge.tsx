import { cn } from "@/lib/utils";
import { MUSCLE_GROUP_LABELS } from "@/lib/training/labels";

interface MuscleBadgeProps {
  muscleGroup: string;
  className?: string;
}

const MUSCLE_COLORS: Record<string, string> = {
  chest: "bg-blue-950/60 text-blue-300",
  back: "bg-emerald-950/60 text-emerald-300",
  legs: "bg-violet-950/60 text-violet-300",
  hamstrings: "bg-violet-950/60 text-violet-300",
  glutes: "bg-pink-950/60 text-pink-300",
  shoulders: "bg-sky-950/60 text-sky-300",
  biceps: "bg-amber-950/60 text-amber-300",
  triceps: "bg-orange-950/60 text-orange-300",
  core: "bg-red-950/60 text-red-300",
  cardio: "bg-teal-950/60 text-teal-300",
};

const DEFAULT_COLOR = "bg-surface-2 text-muted";

export function MuscleBadge({ muscleGroup, className }: MuscleBadgeProps) {
  const key = muscleGroup.trim().toLowerCase();
  const label = MUSCLE_GROUP_LABELS[key] ?? muscleGroup;
  const color = MUSCLE_COLORS[key] ?? DEFAULT_COLOR;

  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
        color,
        className,
      )}
    >
      {label}
    </span>
  );
}
