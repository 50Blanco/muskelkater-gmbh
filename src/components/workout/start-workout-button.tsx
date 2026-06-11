import { Play } from "lucide-react";
import { startWorkout } from "@/app/(app)/training/actions";
import { Button } from "@/components/ui/button";

interface StartWorkoutButtonProps {
  dayId: string;
  label?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * „Workout starten" als Server-Action-Form: legt (idempotent) eine aktive
 * Session an und leitet zur Session-Seite. Funktioniert ohne Client-JS.
 */
export function StartWorkoutButton({
  dayId,
  label = "Workout starten",
  variant = "primary",
  size = "md",
  className,
}: StartWorkoutButtonProps) {
  return (
    <form action={startWorkout} className={className}>
      <input type="hidden" name="dayId" value={dayId} />
      <Button type="submit" variant={variant} size={size}>
        <Play className="size-4" />
        {label}
      </Button>
    </form>
  );
}
