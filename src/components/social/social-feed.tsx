import { Dumbbell, CheckCircle2, Heart, Repeat2 } from "lucide-react";
import type { FeedEvent, SocialTargetType } from "@/lib/social/get-social-dashboard";
import { SocialReactionButtons } from "./social-reaction-buttons";

const EVENT_ICONS: Record<SocialTargetType, React.ElementType> = {
  workout_session: Dumbbell,
  daily_mission: CheckCircle2,
  daily_habit_log: Repeat2,
  member_week: Heart,
};

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Std.`;
  const diffD = Math.floor(diffH / 24);
  return `vor ${diffD} ${diffD === 1 ? "Tag" : "Tagen"}`;
}

interface Props {
  events: FeedEvent[];
  groupId: string;
}

export function SocialFeed({ events, groupId }: Props) {
  if (events.length === 0) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-dashed border-border bg-surface/40 px-4 py-3 text-center text-sm text-dim">
        Noch keine Aktivitäten — starte dein erstes Event.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {events.map((event) => {
        const Icon = EVENT_ICONS[event.eventType];
        return (
          <li
            key={`${event.eventType}-${event.id}`}
            className="rounded-[var(--radius-sm)] border border-border bg-surface px-3.5 py-3 space-y-2"
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-surface-3 text-muted">
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{event.displayName}</span>{" "}
                  {event.eventText}
                </p>
                <p className="mt-0.5 text-xs text-dim">
                  {formatRelativeTime(event.occurredAt)}
                </p>
              </div>
            </div>
            <SocialReactionButtons
              groupId={groupId}
              targetType={event.eventType}
              targetId={event.id}
              reactions={event.reactions}
            />
          </li>
        );
      })}
    </ul>
  );
}
