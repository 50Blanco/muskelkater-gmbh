import type { Metadata } from "next";
import { LogOut, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { PageHeader } from "@/components/layout/page-header";
import { PhaseNote } from "@/components/layout/phase-note";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Profil"
        subtitle="Konto und Einstellungen."
      />

      <Card>
        <CardHeader>
          <CardTitle>Konto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3">
            <Mail className="size-4 text-dim" />
            <span className="text-sm text-foreground">{user?.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-dim">
            <ShieldCheck className="size-4 text-success" />
            Angemeldet — Session aktiv
          </div>
          <form action={signOut}>
            <Button type="submit" variant="secondary" className="w-full">
              <LogOut className="size-4" />
              Abmelden
            </Button>
          </form>
        </CardContent>
      </Card>

      <PhaseNote phase="Phase 2 (Profil/Ziel) & Phase 8 (Einstellungen)">
        Hier bearbeitest du bald dein Profil, dein Ziel und deine
        Trainingsdaten.
      </PhaseNote>
    </div>
  );
}
