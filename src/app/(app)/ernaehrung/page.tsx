import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PhaseNote } from "@/components/layout/phase-note";

export const metadata: Metadata = { title: "Ernährung" };

export default function ErnaehrungPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Ernährung"
        subtitle="Kalorien, Protein und Wasser — einfach im Blick."
      />
      <PhaseNote phase="Phase 5">
        Hier trackst du dein Kalorien- und Proteinziel, dein Wasser und deine
        Mahlzeiten.
      </PhaseNote>
    </div>
  );
}
