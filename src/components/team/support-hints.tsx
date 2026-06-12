import { Heart, Sparkles } from "lucide-react";
import type { SupportHint } from "@/lib/social/challenge-scoring";

interface Props {
  hints: SupportHint[];
}

/** „Wer braucht heute einen Schubs?" — unterstützend, nie beschämend. */
export function SupportHints({ hints }: Props) {
  if (hints.length === 0) return null;

  return (
    <ul className="space-y-2">
      {hints.map((hint) => (
        <li
          key={hint.userId}
          className="flex items-start gap-2.5 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2.5"
        >
          {hint.tone === "celebrate" ? (
            <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" />
          ) : (
            <Heart className="mt-0.5 size-4 shrink-0 text-accent" />
          )}
          <span className="text-sm text-muted">{hint.message}</span>
        </li>
      ))}
    </ul>
  );
}
