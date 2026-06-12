import { Users2 } from "lucide-react";
import type { SocialGroupInfo } from "@/lib/social/get-social-dashboard";
import { InviteCode } from "./invite-code";

interface Props {
  group: SocialGroupInfo;
}

/** Kompakter Team-Header: Name, Mitgliederzahl, Einladungscode klein. */
export function TeamHeader({ group }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-surface-2/80 px-4 py-3 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-accent">
          <Users2 className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold text-foreground">
            {group.name}
          </p>
          <p className="text-xs text-muted">
            {group.memberCount}{" "}
            {group.memberCount === 1 ? "Mitglied" : "Mitglieder"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-dim">
        <span>Code</span>
        <InviteCode code={group.inviteCode} />
      </div>
    </div>
  );
}
