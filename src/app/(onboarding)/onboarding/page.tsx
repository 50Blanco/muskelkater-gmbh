import type { Metadata } from "next";
import { ArrowRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "@/app/(auth)/actions";
import { completeOnboardingTemporary } from "@/app/(onboarding)/actions";

export const metadata: Metadata = { title: "Onboarding" };

export default function OnboardingPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo />
        </div>

        <Card>
          <CardHeader className="items-center text-center">
            <span className="mb-2 grid size-12 place-items-center rounded-[14px] bg-accent-soft text-accent">
              <Sparkles className="size-6" />
            </span>
            <CardTitle className="text-xl">Willkommen bei Muskelkater</CardTitle>
            <p className="text-sm text-muted">
              In Phase 2 richten wir hier dein Profil und Ziel ein und erstellen
              deinen ersten Plan.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-[var(--radius-sm)] border border-dashed border-border bg-surface/40 px-4 py-3 text-sm text-dim">
              Das vollständige Onboarding ist noch nicht gebaut. Für den Moment
              kannst du direkt in die App springen.
            </p>

            <form action={completeOnboardingTemporary}>
              <Button type="submit" size="lg" className="w-full">
                Weiter zur App
                <ArrowRight className="size-4" />
              </Button>
            </form>

            <form action={signOut}>
              <Button type="submit" variant="ghost" className="w-full">
                Abmelden
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
