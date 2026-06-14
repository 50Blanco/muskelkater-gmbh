"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fitnessGoal, userPrivacySettings, userProfile } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import {
  updateDisplayNameSchema,
  updateFitnessGoalSchema,
  updatePrivacySettingsSchema,
} from "@/lib/validation/profile";

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Nicht authentifiziert");
  return user.id;
}

export async function updateDisplayName(
  _prev: { error?: string; success?: boolean },
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const userId = await getAuthUserId();

  const parsed = updateDisplayNameSchema.safeParse({
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  await db
    .update(userProfile)
    .set({ displayName: parsed.data.displayName, updatedAt: new Date() })
    .where(eq(userProfile.userId, userId));

  revalidatePath("/profil");
  revalidatePath("/team");
  return { success: true };
}

export async function updateFitnessGoal(
  _prev: { error?: string; success?: boolean },
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const userId = await getAuthUserId();

  const parsed = updateFitnessGoalSchema.safeParse({
    goalType: formData.get("goalType"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  // Vorhandenes aktives Ziel updaten, sonst neu anlegen
  const [existing] = await db
    .select({ id: fitnessGoal.id })
    .from(fitnessGoal)
    .where(eq(fitnessGoal.userId, userId))
    .orderBy(fitnessGoal.createdAt)
    .limit(1);

  if (existing) {
    await db
      .update(fitnessGoal)
      .set({ goalType: parsed.data.goalType, updatedAt: new Date() })
      .where(eq(fitnessGoal.id, existing.id));
  } else {
    await db.insert(fitnessGoal).values({
      userId,
      goalType: parsed.data.goalType,
      active: true,
    });
  }

  revalidatePath("/profil");
  return { success: true };
}

export async function updatePrivacySettings(
  _prev: { error?: string; success?: boolean },
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const userId = await getAuthUserId();

  const parsed = updatePrivacySettingsSchema.safeParse({
    showTraining: formData.get("showTraining") === "true",
    showSteps: formData.get("showSteps") === "true",
    showNutrition: formData.get("showNutrition") === "true",
    showWater: formData.get("showWater") === "true",
    showHabits: formData.get("showHabits") === "true",
    showWeeklyCheckinStatus: formData.get("showWeeklyCheckinStatus") === "true",
    showInRanking: formData.get("showInRanking") === "true",
  });
  if (!parsed.success) {
    return { error: "Ungültige Eingabe" };
  }

  await db
    .insert(userPrivacySettings)
    .values({ userId, ...parsed.data })
    .onConflictDoUpdate({
      target: userPrivacySettings.userId,
      set: { ...parsed.data, updatedAt: new Date() },
    });

  revalidatePath("/profil");
  revalidatePath("/team");
  return { success: true };
}
