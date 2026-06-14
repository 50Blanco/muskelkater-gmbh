import type { Metadata } from "next";
import { LogOut, Mail, ShieldCheck, User } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fitnessGoal, userPrivacySettings, userProfile } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_PRIVACY } from "@/lib/social/get-user-privacy";
import { GOAL_TYPE_LABELS } from "@/lib/validation/profile";
import { ProfileForm } from "./profile-form";
import { PrivacySettingsForm } from "./privacy-settings-form";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profileRow, goalRow, privacyRow] = await Promise.all([
    db
      .select({
        displayName: userProfile.displayName,
        experienceLevel: userProfile.experienceLevel,
        trainingLocation: userProfile.trainingLocation,
      })
      .from(userProfile)
      .where(eq(userProfile.userId, user.id))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select({ goalType: fitnessGoal.goalType })
      .from(fitnessGoal)
      .where(eq(fitnessGoal.userId, user.id))
      .orderBy(fitnessGoal.createdAt)
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select({
        showTraining: userPrivacySettings.showTraining,
        showSteps: userPrivacySettings.showSteps,
        showNutrition: userPrivacySettings.showNutrition,
        showWater: userPrivacySettings.showWater,
        showHabits: userPrivacySettings.showHabits,
        showWeeklyCheckinStatus: userPrivacySettings.showWeeklyCheckinStatus,
        showInRanking: userPrivacySettings.showInRanking,
      })
      .from(userPrivacySettings)
      .where(eq(userPrivacySettings.userId, user.id))
      .limit(1)
      .then((r) => r[0] ?? null),
  ]);

  const currentPrivacy = privacyRow ?? { ...DEFAULT_PRIVACY };
  const currentGoalType = goalRow?.goalType ?? null;

  return (
    <div className="space-y-8">
      <PageHeader title="Profil" subtitle="Konto, Ziele und Datenschutz." />

      {/* Konto */}
      <Card>
        <CardHeader>
          <CardTitle>Konto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3">
            <Mail className="size-4 text-dim" />
            <span className="text-sm text-foreground">{user.email}</span>
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

      {/* Profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Mein Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {profileRow?.experienceLevel && (
            <p className="text-xs text-dim">
              Level:{" "}
              <span className="text-foreground capitalize">
                {profileRow.experienceLevel}
              </span>
              {profileRow.trainingLocation && (
                <>
                  {" "}
                  · Ort:{" "}
                  <span className="text-foreground capitalize">
                    {profileRow.trainingLocation}
                  </span>
                </>
              )}
            </p>
          )}
          {currentGoalType && (
            <p className="text-xs text-dim">
              Aktuelles Ziel:{" "}
              <span className="text-foreground">
                {GOAL_TYPE_LABELS[currentGoalType] ?? currentGoalType}
              </span>
            </p>
          )}
          <div className="pt-4">
            <ProfileForm
              currentDisplayName={profileRow?.displayName ?? null}
              currentGoalType={currentGoalType}
            />
          </div>
        </CardContent>
      </Card>

      {/* Datenschutz */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            Datenschutz & Sichtbarkeit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-dim">
            Steuere, was dein Team über deine tägliche Aktivität sehen kann.
            Körperwerte (Gewicht, Maße) sind immer privat und nicht betroffen.
          </p>
          <PrivacySettingsForm current={currentPrivacy} />
        </CardContent>
      </Card>
    </div>
  );
}
