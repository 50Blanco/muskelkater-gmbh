import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarDays, Droplets, Flame, Plus, UtensilsCrossed } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveNutritionTarget,
  getTodayNutritionLog,
  getTodayMealLogs,
  getWeekNutritionSummary,
} from "@/lib/nutrition/nutrition-data";
import { NutritionGoals } from "@/components/nutrition/nutrition-goals";
import { WaterTracker } from "@/components/nutrition/water-tracker";
import { MealLogForm } from "@/components/nutrition/meal-log-form";
import { MealLogList } from "@/components/nutrition/meal-log-list";
import { NutritionWeekHistory } from "@/components/nutrition/nutrition-week-history";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTodayBerlin } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Ernährung" };

export default async function ErnaehrungPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const todayStr = getTodayBerlin();

  const [target, log, meals, weekSummaries] = await Promise.all([
    getActiveNutritionTarget(user.id),
    getTodayNutritionLog(user.id),
    getTodayMealLogs(user.id),
    getWeekNutritionSummary(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ernährung"
        subtitle="Dein privater Tageslog."
      />

      {!target ? (
        <div className="rounded-[var(--radius)] border border-dashed border-border bg-surface/40 px-4 py-10 text-center">
          <UtensilsCrossed className="mx-auto mb-3 size-8 text-dim" />
          <p className="text-sm text-muted">
            Noch kein Ernährungsziel vorhanden.
          </p>
          <p className="mt-1 text-xs text-dim">
            Starte zuerst das Onboarding, um deine Ziele berechnen zu lassen.
          </p>
        </div>
      ) : (
        <>
          {/* Tagesziele + Fortschritt */}
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface-3 text-muted">
                <Flame className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">Tagesziele</CardTitle>
                <p className="text-xs text-muted">
                  Kalorien · Protein · Wasser
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <NutritionGoals target={target} log={log} />
            </CardContent>
          </Card>

          {/* Heutige Mahlzeiten */}
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface-3 text-muted">
                <Plus className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">Heute</CardTitle>
                <p className="text-xs text-muted">
                  Was hast du heute gegessen?
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <MealLogList entries={meals} />
              <MealLogForm />
            </CardContent>
          </Card>

          {/* Wasser */}
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface-3 text-muted">
                <Droplets className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">Wasser</CardTitle>
                <p className="text-xs text-muted">Heute getrunken.</p>
              </div>
            </CardHeader>
            <CardContent>
              <WaterTracker
                currentMl={log?.waterMl ?? 0}
                targetMl={target.waterMl}
              />
            </CardContent>
          </Card>

          {/* 7-Tage-Übersicht */}
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface-3 text-muted">
                <CalendarDays className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">Letzte 7 Tage</CardTitle>
                <p className="text-xs text-muted">
                  Geloggter Tag · Anzahl Mahlzeiten
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <NutritionWeekHistory
                summaries={weekSummaries}
                todayStr={todayStr}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
