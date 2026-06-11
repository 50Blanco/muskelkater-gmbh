import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Droplets, Flame, Utensils, UtensilsCrossed } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveNutritionTarget,
  getTodayNutritionLog,
} from "@/lib/nutrition/nutrition-data";
import { NutritionGoals } from "@/components/nutrition/nutrition-goals";
import { ProteinLog } from "@/components/nutrition/protein-log";
import { WaterTracker } from "@/components/nutrition/water-tracker";
import { MealChecklist } from "@/components/nutrition/meal-checklist";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Ernährung" };

export default async function ErnaehrungPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [target, log] = await Promise.all([
    getActiveNutritionTarget(user.id),
    getTodayNutritionLog(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ernährung"
        subtitle="Dein Tagesrahmen — einfach geloggt."
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
                <p className="text-xs text-muted">Dein berechneter Rahmen.</p>
              </div>
            </CardHeader>
            <CardContent>
              <NutritionGoals target={target} log={log} />
            </CardContent>
          </Card>

          {/* Protein */}
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface-3 text-muted">
                <Utensils className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">Protein eintragen</CardTitle>
                <p className="text-xs text-muted">
                  Tageswert in Gramm — einfach aktualisieren.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ProteinLog currentG={log?.proteinG ?? null} />
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

          {/* Mahlzeiten */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mahlzeiten</CardTitle>
              <p className="text-xs text-muted">Was hast du heute gegessen?</p>
            </CardHeader>
            <CardContent>
              <MealChecklist
                initialStatus={
                  (log?.mealsStatus ?? {}) as Record<string, boolean>
                }
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
