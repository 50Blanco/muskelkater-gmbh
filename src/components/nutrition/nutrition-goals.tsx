import { getProgressPct } from "@/lib/validation/nutrition";
import { cn } from "@/lib/utils";
import type { NutritionLogRow, NutritionTargetRow } from "@/lib/nutrition/nutrition-data";

interface Props {
  target: NutritionTargetRow | null;
  log: NutritionLogRow | null;
}

function formatLiters(ml: number): string {
  return `${(ml / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} l`;
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = getProgressPct(value, max);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
      <div
        className="h-1.5 rounded-full bg-accent transition-all duration-300"
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemax={max}
        aria-valuemin={0}
      />
    </div>
  );
}

export function NutritionGoals({ target, log }: Props) {
  if (!target) {
    return (
      <p className="text-sm text-dim">
        Noch kein Ernährungsziel vorhanden. Starte zuerst das Onboarding.
      </p>
    );
  }

  const currentCalories = log?.caloriesKcal ?? 0;
  const currentProtein = log?.proteinG ?? 0;
  const currentWater = log?.waterMl ?? 0;
  const caloriesDone = currentCalories >= target.caloriesKcal;
  const proteinDone = currentProtein >= target.proteinG;
  const waterDone = currentWater >= target.waterMl;

  return (
    <dl className="space-y-4">
      {/* Kalorien */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <dt className="text-sm text-muted">Kalorien</dt>
          <dd className="font-display text-sm font-semibold">
            {currentCalories > 0 ? (
              <>
                <span className={cn(caloriesDone ? "text-success" : "text-foreground")}>
                  {currentCalories.toLocaleString("de-DE")}
                </span>
                <span className="text-dim">
                  {" "}/ {target.caloriesKcal.toLocaleString("de-DE")} kcal
                </span>
              </>
            ) : (
              <span className="text-dim">
                Ziel: {target.caloriesKcal.toLocaleString("de-DE")} kcal
              </span>
            )}
          </dd>
        </div>
        {currentCalories > 0 && (
          <ProgressBar value={currentCalories} max={target.caloriesKcal} />
        )}
      </div>

      {/* Protein */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <dt className="text-sm text-muted">Protein</dt>
          <dd className="font-display text-sm font-semibold">
            <span className={cn(proteinDone ? "text-success" : "text-foreground")}>
              {currentProtein}
            </span>
            <span className="text-dim"> / {target.proteinG} g</span>
          </dd>
        </div>
        <ProgressBar value={currentProtein} max={target.proteinG} />
      </div>

      {/* Wasser */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <dt className="text-sm text-muted">Wasser</dt>
          <dd className="font-display text-sm font-semibold">
            <span className={cn(waterDone ? "text-success" : "text-foreground")}>
              {formatLiters(currentWater)}
            </span>
            <span className="text-dim"> / {formatLiters(target.waterMl)}</span>
          </dd>
        </div>
        <ProgressBar value={currentWater} max={target.waterMl} />
      </div>
    </dl>
  );
}
