"use client";

import { useState } from "react";
import { Check, Copy, Users } from "lucide-react";
import type { GroupMemberInfo, SocialGroupInfo } from "@/lib/social/get-social-dashboard";

interface Props {
  group: SocialGroupInfo;
  members: GroupMemberInfo[];
  currentUserId: string;
}

export function GroupMembers({ group, members, currentUserId }: Props) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <Users className="size-3.5" />
          {members.length} {members.length === 1 ? "Mitglied" : "Mitglieder"}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => (
            <span
              key={m.userId}
              className={
                "rounded-full border px-2.5 py-0.5 text-xs " +
                (m.userId === currentUserId
                  ? "border-accent/40 bg-accent-soft text-accent"
                  : "border-border bg-surface-2 text-muted")
              }
            >
              {m.displayName}
              {m.userId === currentUserId && " (Du)"}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-dim">Einladungscode:</span>
        <code className="rounded-[var(--radius-sm)] border border-border bg-surface-2 px-2 py-0.5 font-mono text-xs tracking-widest text-foreground">
          {group.inviteCode}
        </code>
        <button
          type="button"
          onClick={copyCode}
          className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
          aria-label="Code kopieren"
        >
          {copied ? (
            <Check className="size-3.5 text-success" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? "Kopiert" : "Kopieren"}
        </button>
      </div>
    </div>
  );
}
