import type { Metadata } from "next";
import { Dumbbell, Flame, Sparkles, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Heute" };

function greetingName(email?: string | null): string {
  if (!email) return "Athlet";
  const handle = email.split("@")[0] ?? "Athlet";
  return handle.charAt(0).toUpperCase() + handle.slice(1);
}

export default async function HeutePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={today}
        title={`Servus, ${greetingName(user?.email)}.`}
        subtitle="Dein nächster sinnvoller Schritt — sobald dein Plan steht."
      />

      {/* Bento-Skelett für das spätere Dashboard */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="sm:col-span-2">
          <CardHeader className="flex-row items-center gap-3">
            <span className="grid size-10 place-items-center rounded-[12px] bg-accent text-accent-foreground">
              <Dumbbell className="size-5" />
            </span>
            <div>
              <CardTitle>Heutiges Workout</CardTitle>
              <p className="text-sm text-muted">
                Wird nach dem Onboarding automatisch geplant.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-[var(--radius-sm)] border border-dashed border-border bg-surface/40 px-4 py-8 text-center text-sm text-dim">
              Noch kein Plan — kommt in Phase 3.
            </div>
          </CardContent>
        </Card>

        <StatTile
          icon={<Flame className="size-5" />}
          title="Ernährung"
          hint="Kalorien · Protein · Wasser"
          phase="Phase 5"
        />
        <StatTile
          icon={<Target className="size-5" />}
          title="Gewohnheiten"
          hint="Tägliche Streaks"
          phase="Phase 5"
        />
        <Card className="sm:col-span-2">
          <CardHeader className="flex-row items-center gap-3">
            <span className="grid size-10 place-items-center rounded-[12px] bg-accent-soft text-accent">
              <Sparkles className="size-5" />
            </span>
            <div>
              <CardTitle>Coach</CardTitle>
              <p className="text-sm text-muted">
                Kurze, klare Empfehlungen — regelbasiert.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-[var(--radius-sm)] border border-dashed border-border bg-surface/40 px-4 py-6 text-center text-sm text-dim">
              Der Coach meldet sich ab Phase 7.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatTile({
  icon,
  title,
  hint,
  phase,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  phase: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <span className="grid size-10 place-items-center rounded-[12px] bg-surface-3 text-muted">
          {icon}
        </span>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-xs text-muted">{hint}</p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-dim">Aktiv ab {phase}.</p>
      </CardContent>
    </Card>
  );
}
