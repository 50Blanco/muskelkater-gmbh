import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PhaseNote } from "@/components/layout/phase-note";

export const metadata: Metadata = { title: "Training" };

export default function TrainingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Training"
        subtitle="Dein Wochenplan und alle Workouts an einem Ort."
      />
      <PhaseNote phase="Phase 3 (Plan) & Phase 4 (Session-Tracking)">
        Hier erscheint dein persönlicher Trainingsplan mit Tagen, Übungen und
        Satz-Tracking.
      </PhaseNote>
    </div>
  );
}
