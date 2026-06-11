import { Clock, ListChecks } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { PlanDay } from "@/lib/training/get-active-plan";
import { ExerciseRow } from "./exercise-row";

interface DayCardProps {
  day: PlanDay;
  highlight?: boolean;
}

/** Ein Trainingstag als Karte: Titel, Fokus, Dauer, Übungsanzahl + Übungsliste. */
export function DayCard({ day, highlight = false }: DayCardProps) {
  const exerciseCount = day.exercises.length;

  return (
    <Card
      id={`day-${day.dayIndex}`}
      className={highlight ? "scroll-mt-24 border-accent/50" : "scroll-mt-24"}
    >
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dim">
              Tag {day.dayIndex + 1}
            </p>
            <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-foreground">
              {day.title}
            </h3>
            {day.focus && (
              <p className="text-sm text-muted">Fokus: {day.focus}</p>
            )}
          </div>
          {highlight && (
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
              Heute sinnvoll
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          {day.estMinutes ? (
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" /> ca. {day.estMinutes} Min.
            </span>
          ) : null}
          <span className="flex items-center gap-1.5">
            <ListChecks className="size-3.5" /> {exerciseCount}{" "}
            {exerciseCount === 1 ? "Übung" : "Übungen"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {exerciseCount === 0 ? (
          <p className="rounded-[var(--radius-sm)] border border-dashed border-border bg-surface/40 px-4 py-6 text-center text-sm text-dim">
            Für diesen Tag wurden keine Übungen hinterlegt.
          </p>
        ) : (
          <ul className="space-y-2">
            {day.exercises.map((ex, index) => (
              <ExerciseRow key={ex.id} ex={ex} position={index + 1} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
