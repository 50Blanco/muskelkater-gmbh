import { Construction } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PhaseNoteProps {
  phase: string;
  children: React.ReactNode;
}

/** Dezenter Platzhalter-Hinweis für Bereiche, die in späteren Phasen kommen. */
export function PhaseNote({ phase, children }: PhaseNoteProps) {
  return (
    <Card className="flex items-start gap-3 border-dashed bg-surface/40 p-4">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[10px] bg-accent-soft text-accent">
        <Construction className="size-4" />
      </span>
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{children}</p>
        <p className="text-xs text-dim">Geplant für {phase}.</p>
      </div>
    </Card>
  );
}
