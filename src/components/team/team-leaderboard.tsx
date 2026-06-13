import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/social/challenge-scoring";

interface Props {
  entries: LeaderboardEntry[];
}

/**
 * Soft-Ranking: zeigt Punkte je Mitglied, hebt den eigenen Eintrag hervor.
 * Bewusst keine „Verlierer"-Markierung — Gleichstand teilt den Rang.
 */
export function TeamLeaderboard({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-dim">
        Noch keine Punkte diese Woche — der erste Eintrag zählt.
      </p>
    );
  }

  return (
    <ol className="space-y-1.5">
      {entries.map((entry) => (
        <li
          key={entry.userId}
          className={cn(
            "flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border px-3 py-2",
            entry.isCurrentUser
              ? "border-accent/40 bg-accent-soft"
              : "border-border bg-surface",
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-semibold tabular-nums text-muted">
              {entry.rank}
            </span>
            <span className="truncate text-sm text-foreground">
              {entry.displayName}
              {entry.isCurrentUser && <span className="text-muted"> (Du)</span>}
            </span>
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
            {entry.score}
            <span className="ml-1 text-xs font-normal text-muted">Pkt</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
