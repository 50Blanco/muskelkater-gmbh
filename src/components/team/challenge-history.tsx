import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChallengeHistoryEntry } from "@/lib/social/team-queries";

interface Props {
  challenges: ChallengeHistoryEntry[];
}

function statusLabel(status: ChallengeHistoryEntry["status"]): string {
  if (status === "completed") return "Abgeschlossen";
  if (status === "cancelled") return "Abgebrochen";
  return status;
}

function formatDateRange(startsOn: string, endsOn: string): string {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${parseInt(d)}.${parseInt(m)}.`;
  };
  return `${fmt(startsOn)} – ${fmt(endsOn)}`;
}

/** Kompakte Liste vergangener Team-Challenges mit Link zur Detailseite. */
export function ChallengeHistory({ challenges }: Props) {
  if (challenges.length === 0) return null;

  return (
    <ul className="space-y-2">
      {challenges.map((c) => (
        <li key={c.id}>
          <Link
            href={`/team/challenges/${c.id}`}
            className="group flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2.5 transition-colors hover:bg-surface-3"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full",
                  c.status === "completed"
                    ? "bg-success/15 text-success"
                    : "bg-surface-3 text-dim",
                )}
              >
                {c.status === "completed" ? (
                  <CheckCircle2 className="size-3.5" />
                ) : (
                  <Clock className="size-3.5" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {c.title}
                </p>
                <p className="text-[11px] text-dim">
                  {formatDateRange(c.startsOn, c.endsOn)} ·{" "}
                  {statusLabel(c.status)}
                </p>
              </div>
            </div>
            <ArrowRight className="size-3.5 shrink-0 text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Kompakte Anzeige einer einzelnen Challenge als Badge (für Rangliste etc.). */
export function ChallengeBadge({ status }: { status: ChallengeHistoryEntry["status"] }) {
  const isCompleted = status === "completed";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        isCompleted
          ? "border-success/40 bg-success/10 text-success"
          : "border-border bg-surface text-dim",
      )}
    >
      {isCompleted ? (
        <CheckCircle2 className="size-3" />
      ) : (
        <Trophy className="size-3" />
      )}
      {statusLabel(status)}
    </span>
  );
}
