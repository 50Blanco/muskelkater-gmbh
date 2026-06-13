import Link from "next/link";
import { ArrowRight, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamMemberCard } from "@/lib/social/get-team-dashboard";

interface Props {
  member: TeamMemberCard;
}

/** Klickbare Mitglieder-Karte → /team/[memberId]. Support-Hinweis statt Tadel. */
export function MemberCard({ member }: Props) {
  return (
    <Link
      href={`/team/${member.userId}`}
      className={cn(
        "group block rounded-[var(--radius-sm)] border bg-surface px-3.5 py-3 transition-colors hover:bg-surface-3",
        member.isCurrentUser
          ? "border-accent/40 bg-accent-soft/40"
          : "border-border",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-3 text-[11px] font-semibold tabular-nums text-muted">
            {member.rank}
          </span>
          <span className="truncate text-sm font-medium text-foreground">
            {member.displayName}
            {member.isCurrentUser && (
              <span className="text-muted"> (Du)</span>
            )}
          </span>
          {member.role === "owner" && (
            <Crown className="size-3.5 shrink-0 text-accent" />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {member.weeklyScore}
            <span className="ml-1 text-xs font-normal text-muted">Pkt</span>
          </span>
          <ArrowRight className="size-4 text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
        </div>
      </div>

      <div className="mt-2.5 space-y-1">
        {member.status.dailyScore > 0 ? (
          <p className="text-xs font-semibold text-accent">
            Heute: +{member.status.dailyScore} Punkte
          </p>
        ) : (
          <p className="text-xs text-dim">Heute noch keine Punkte</p>
        )}
        <p className="text-[11px] text-dim">
          {member.status.openSources.length === 0
            ? "Alles erledigt heute"
            : member.status.openSources.map((s) => `${s.label} offen`).join(" · ")}
        </p>
      </div>
    </Link>
  );
}
