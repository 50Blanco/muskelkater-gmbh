"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { reactToSocialEvent } from "@/app/(app)/heute/social-actions";
import type { ReactionCounts, SocialTargetType } from "@/lib/social/get-social-dashboard";
import type { SocialReactionType } from "@/lib/validation/social";

const REACTION_LABELS: Record<SocialReactionType, string> = {
  stark: "Stark",
  weiter_so: "Weiter so",
  respekt: "Respekt",
};

interface Props {
  groupId: string;
  targetType: SocialTargetType;
  targetId: string;
  reactions: ReactionCounts;
}

export function SocialReactionButtons({
  groupId,
  targetType,
  targetId,
  reactions,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleReact = (reactionType: SocialReactionType) => {
    startTransition(async () => {
      await reactToSocialEvent({ groupId, targetType, targetId, reactionType });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.entries(REACTION_LABELS) as [SocialReactionType, string][]).map(
        ([type, label]) => {
          const { count, mine } = reactions[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => handleReact(type)}
              disabled={isPending}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                mine
                  ? "border-accent/50 bg-accent-soft text-accent"
                  : "border-border bg-surface text-muted hover:bg-surface-3 hover:text-foreground",
                isPending && "opacity-50 cursor-not-allowed",
              )}
            >
              {label}
              {count > 0 && (
                <span className="tabular-nums">{count}</span>
              )}
            </button>
          );
        },
      )}
    </div>
  );
}
