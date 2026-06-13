import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Dumbbell, Ruler, Scale, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTodayBerlin } from "@/lib/utils/date";
import { getBodyProgress } from "@/lib/body/get-body-progress";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MeasurementSparkline,
  StreakBadge,
  WeightChart,
  WorkoutBarChart,
} from "@/components/body/progress-charts";

export const metadata: Metadata = { title: "Fortschritt" };

export default async function FortschrittPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = getTodayBerlin();
  const data = await getBodyProgress(user.id, today);

  const hasAnyBodyData =
    data.weightHistory.length > 0 ||
    data.waistHistory.length > 0 ||
    data.armHistory.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fortschritt"
        subtitle="Deine privaten Körperdaten, Streaks und Trainingswochen."
      />

      {!hasAnyBodyData && data.checkinStreak === 0 && (
        <div className="rounded-[var(--radius-sm)] border border-dashed border-border bg-surface/40 px-5 py-6 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            Noch keine Daten vorhanden
          </p>
          <p className="text-sm text-muted">
            Starte deinen ersten Check-in auf der Heute-Seite, um Gewicht und
            Umfänge zu tracken.
          </p>
          <Link
            href="/heute"
            className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
          >
            Zur Heute-Seite <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* Gewichtsverlauf */}
      <Card>
        <CardHeader className="flex-row items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[12px] bg-surface-3 text-muted">
            <Scale className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base">Gewichtsverlauf</CardTitle>
            <p className="text-xs text-muted">Letzte {data.weightHistory.length > 0 ? data.weightHistory.length : "—"} Einträge</p>
          </div>
        </CardHeader>
        <CardContent>
          <WeightChart entries={data.weightHistory} />
        </CardContent>
      </Card>

      {/* Umfänge */}
      <Card>
        <CardHeader className="flex-row items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[12px] bg-surface-3 text-muted">
            <Ruler className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base">Umfänge</CardTitle>
            <p className="text-xs text-muted">Bauch- und Armumfang im Verlauf</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <MeasurementSparkline
            entries={data.waistHistory}
            label="Bauchumfang"
          />
          <MeasurementSparkline
            entries={data.armHistory}
            label="Armumfang"
          />
        </CardContent>
      </Card>

      {/* Check-in-Streak */}
      <Card>
        <CardHeader className="flex-row items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[12px] bg-surface-3 text-muted">
            <TrendingUp className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base">Check-in Streak</CardTitle>
            <p className="text-xs text-muted">Wöchentliche Kontinuität</p>
          </div>
        </CardHeader>
        <CardContent>
          <StreakBadge streak={data.checkinStreak} />
          {data.checkinStreak > 0 && (
            <p className="mt-2 text-xs text-muted">
              {data.checkinDoneThisWeek
                ? "Diese Woche bereits erledigt — weiter so."
                : "Diese Woche noch offen — jetzt check-in machen, um den Streak fortzuführen."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Trainingswochen */}
      <Card>
        <CardHeader className="flex-row items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[12px] bg-surface-3 text-muted">
            <Dumbbell className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base">Trainingswochen</CardTitle>
            <p className="text-xs text-muted">Abgeschlossene Einheiten der letzten 8 Wochen</p>
          </div>
        </CardHeader>
        <CardContent>
          <WorkoutBarChart weeks={data.workoutWeeks} />
        </CardContent>
      </Card>
    </div>
  );
}
