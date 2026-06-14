import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCoachDashboard } from "@/lib/coach/get-coach-dashboard";
import { generateAllCoachHints } from "@/lib/coach/coach-rules";
import { PageHeader } from "@/components/layout/page-header";
import { CoachHintCard } from "@/components/coach/coach-hint-card";
import type { CoachSection } from "@/lib/coach/coach-rules";

export const metadata: Metadata = { title: "Coach" };

const SECTION_LABELS: Record<CoachSection, string> = {
  heute: "Jetzt wichtig",
  team: "Team",
  challenge: "Challenge",
  woche: "Woche",
};

const SECTION_ORDER: CoachSection[] = ["heute", "team", "challenge", "woche"];

export default async function CoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dashboard = await getCoachDashboard(user.id);
  const hints = generateAllCoachHints(dashboard);

  const hintsBySection = new Map<CoachSection, typeof hints>();
  for (const section of SECTION_ORDER) {
    hintsBySection.set(
      section,
      hints.filter((h) => h.section === section),
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Coach"
        subtitle="Deine täglichen Hinweise — regelbasiert, klar und ohne Druck."
      />

      {SECTION_ORDER.map((section) => {
        const sectionHints = hintsBySection.get(section) ?? [];
        if (sectionHints.length === 0) return null;

        return (
          <div key={section} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {SECTION_LABELS[section]}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-2">
              {sectionHints.map((hint) => (
                <CoachHintCard key={hint.id} hint={hint} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
