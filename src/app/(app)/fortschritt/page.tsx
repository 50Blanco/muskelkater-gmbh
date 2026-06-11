import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PhaseNote } from "@/components/layout/phase-note";

export const metadata: Metadata = { title: "Fortschritt" };

export default function FortschrittPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Fortschritt"
        subtitle="Gewicht, Umfänge und deine erledigten Workouts."
      />
      <PhaseNote phase="Phase 6">
        Hier siehst du deine Gewichtskurve, Körpermaße, Streaks und absolvierte
        Workouts als Verlauf.
      </PhaseNote>
    </div>
  );
}
