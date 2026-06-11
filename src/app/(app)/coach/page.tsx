import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PhaseNote } from "@/components/layout/phase-note";

export const metadata: Metadata = { title: "Coach" };

export default function CoachPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Coach"
        subtitle="Kurze, klare Empfehlungen für deinen Alltag."
      />
      <PhaseNote phase="Phase 7">
        Hier reagiert dein regelbasierter Coach auf Zeit, Müdigkeit, Muskelkater,
        verpasste Workouts und mehr — mit Sicherheitslogik.
      </PhaseNote>
    </div>
  );
}
