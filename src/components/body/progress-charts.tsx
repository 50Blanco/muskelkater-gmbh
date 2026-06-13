import { cn } from "@/lib/utils";
import type {
  MeasurementEntry,
  WeightEntry,
  WorkoutWeek,
} from "@/lib/body/get-body-progress";

/* ------------------------------------------------------------------ */
/* Gewichtsverlauf                                                    */
/* ------------------------------------------------------------------ */

interface WeightChartProps {
  entries: WeightEntry[];
}

export function WeightChart({ entries }: WeightChartProps) {
  if (entries.length === 0) {
    return <EmptyState label="Noch keine Gewichtseinträge" />;
  }

  const values = entries.map((e) => e.weightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 320;
  const H = 80;
  const PAD = 8;
  const innerW = W - 2 * PAD;
  const innerH = H - 2 * PAD;

  const points = entries.map((e, i) => {
    const x = PAD + (i / Math.max(entries.length - 1, 1)) * innerW;
    const y = PAD + (1 - (e.weightKg - min) / range) * innerH;
    return { x, y, entry: e };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  const first = entries[0];
  const last = entries[entries.length - 1];

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        aria-label="Gewichtsverlauf"
        role="img"
      >
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="var(--color-accent)"
          />
        ))}
      </svg>
      <div className="flex items-center justify-between text-[11px] text-muted">
        <span>{formatDate(first.date)}</span>
        <span className="font-semibold text-foreground tabular-nums">
          {last.weightKg.toLocaleString("de-DE", { minimumFractionDigits: 1 })} kg
        </span>
        <span>{formatDate(last.date)}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Umfang-Sparkline                                                   */
/* ------------------------------------------------------------------ */

interface SparklineProps {
  entries: MeasurementEntry[];
  label: string;
  unit?: string;
}

export function MeasurementSparkline({ entries, label, unit = "cm" }: SparklineProps) {
  if (entries.length === 0) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-xs text-dim">Noch keine Einträge</p>
      </div>
    );
  }

  const values = entries.map((e) => e.valueCm);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const last = entries[entries.length - 1];

  const W = 160;
  const H = 40;
  const PAD = 4;
  const innerW = W - 2 * PAD;
  const innerH = H - 2 * PAD;

  const points = entries.map((e, i) => {
    const x = PAD + (i / Math.max(entries.length - 1, 1)) * innerW;
    const y = PAD + (1 - (e.valueCm - min) / range) * innerH;
    return `${x},${y}`;
  });

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-xs font-semibold tabular-nums text-foreground">
          {last.valueCm.toLocaleString("de-DE", { minimumFractionDigits: 1 })} {unit}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        aria-label={label}
        role="img"
      >
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Workout-Wochen-Balken                                              */
/* ------------------------------------------------------------------ */

interface WorkoutBarChartProps {
  weeks: WorkoutWeek[];
}

export function WorkoutBarChart({ weeks }: WorkoutBarChartProps) {
  const maxCount = Math.max(...weeks.map((w) => w.count), 1);

  return (
    <div className="flex items-end gap-1.5" aria-label="Trainingseinheiten pro Woche">
      {weeks.map((w) => (
        <div key={w.weekMonday} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={cn(
              "w-full rounded-t-sm transition-all",
              w.count > 0 ? "bg-accent" : "bg-surface-3",
            )}
            style={{ height: `${Math.max((w.count / maxCount) * 64, w.count > 0 ? 8 : 4)}px` }}
            title={`${formatWeekLabel(w.weekMonday)}: ${w.count} Einheit${w.count === 1 ? "" : "en"}`}
          />
          <span className="text-[9px] tabular-nums text-dim leading-none">
            {w.count > 0 ? w.count : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Check-in-Streak                                                    */
/* ------------------------------------------------------------------ */

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak === 0) {
    return (
      <p className="text-sm text-muted">
        Noch kein Check-in erledigt — starte diese Woche.
      </p>
    );
  }
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-4xl font-bold tabular-nums text-foreground">
        {streak}
      </span>
      <span className="text-sm text-muted">
        {streak === 1 ? "Woche in Folge" : "Wochen in Folge"}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-20 items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-border bg-surface/40 text-xs text-dim">
      {label}
    </div>
  );
}

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "short",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

function formatWeekLabel(isoMonday: string): string {
  const [y, m, d] = isoMonday.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}
