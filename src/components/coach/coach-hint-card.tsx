import { CheckCircle2, Calendar, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoachHint, CoachSection, CoachTone } from "@/lib/coach/coach-rules";

const SECTION_ICONS: Record<CoachSection, React.ElementType> = {
  heute: CheckCircle2,
  team: Users,
  challenge: Trophy,
  woche: Calendar,
};

const TONE_CLASSES: Record<CoachTone, string> = {
  positive:
    "border-success/30 bg-success/8 text-success-foreground [&_svg]:text-success",
  neutral:
    "border-border bg-surface text-foreground [&_svg]:text-muted-foreground",
  nudge:
    "border-accent/30 bg-accent/8 text-foreground [&_svg]:text-accent",
};

type Props = {
  hint: CoachHint;
};

export function CoachHintCard({ hint }: Props) {
  const Icon = SECTION_ICONS[hint.section];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-sm)] border px-4 py-3.5 transition-colors",
        TONE_CLASSES[hint.tone],
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 opacity-70" />
      <p className="text-sm leading-relaxed">{hint.text}</p>
    </div>
  );
}
