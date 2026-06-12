import { Clock, Flame, Activity, User } from "lucide-react";
import {
  formatDuration,
  formatSessionDate,
  rpeLabel,
} from "@/lib/training/history-helpers";
import { MuscleBadge } from "./muscle-badge";
import { SetRow } from "./set-row";
import type { WorkoutSessionDetail } from "@/lib/training/get-workout-history";

interface WorkoutSessionDetailViewProps {
  session: WorkoutSessionDetail;
}

/** Detailansicht einer abgeschlossenen Trainingseinheit (read-only). */
export function WorkoutSessionDetailView({
  session,
}: WorkoutSessionDetailViewProps) {
  const title = session.dayTitle ?? "Freies Training";
  const rpe = rpeLabel(session.perceivedEffort);
  const hasSoreness = session.soreness !== null && session.soreness > 0;

  return (
    <div className="space-y-6">
      {/* Kopf */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {formatSessionDate(session.completedAt)}
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {session.dayFocus && (
          <p className="text-sm text-muted">{session.dayFocus}</p>
        )}
      </div>

      {/* Session-Meta */}
      <div className="flex flex-wrap gap-2">
        <MetaChip icon={<Clock className="size-3.5" />} text={formatDuration(session.durationMin)} />
        {rpe && (
          <MetaChip
            icon={<Flame className="size-3.5" />}
            text={`RPE ${session.perceivedEffort} · ${rpe}`}
          />
        )}
        {hasSoreness && (
          <MetaChip
            icon={<Activity className="size-3.5" />}
            text={`Muskelkater ${session.soreness}/10`}
          />
        )}
      </div>

      {/* Übungen */}
      {session.exercises.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-dashed border-border bg-surface/40 px-4 py-8 text-center">
          <p className="text-sm text-dim">
            Für diese Einheit wurden keine Sätze gespeichert.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {session.exercises.map((group) => (
            <section
              key={group.uid}
              className="rounded-[var(--radius)] border border-border bg-surface px-4 py-3.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{group.name}</span>
                <MuscleBadge muscleGroup={group.muscleGroup} />
                {group.isCustom && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                    <User className="size-3" />
                    Eigene Übung
                  </span>
                )}
              </div>
              <div className="mt-2 divide-y divide-border/60">
                {group.sets.map((set, i) => (
                  <SetRow key={`${group.uid}-${set.setNumber}-${i}`} set={set} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function MetaChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
      {icon}
      {text}
    </span>
  );
}
