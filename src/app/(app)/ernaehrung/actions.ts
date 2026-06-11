"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { dailyMission, dailyNutritionLog } from "@/db/schema";
import {
  logProteinSchema,
  addWaterSchema,
  toggleMealSchema,
} from "@/lib/validation/nutrition";
import { getTodayBerlin } from "@/lib/utils/date";

type ActionResult = { error: string } | { ok: true };

/* ------------------------------------------------------------------ */
/* Interner Helper                                                    */
/* ------------------------------------------------------------------ */

/**
 * Setzt die Nutrition-Mission für heute auf „done", wenn sie noch offen ist.
 * Wirft keine Fehler, wenn keine Mission existiert (0 affected rows ist ok).
 */
async function markNutritionMissionDone(
  userId: string,
  today: string,
): Promise<void> {
  await db
    .update(dailyMission)
    .set({ status: "done", updatedAt: new Date() })
    .where(
      and(
        eq(dailyMission.userId, userId),
        eq(dailyMission.missionDate, today),
        eq(dailyMission.type, "nutrition"),
        eq(dailyMission.status, "open"),
      ),
    );
}

/* ------------------------------------------------------------------ */
/* Protein loggen                                                     */
/* ------------------------------------------------------------------ */

/**
 * Setzt den Protein-Tageswert (Absolutwert, kein Increment).
 * Überschreibt ausschließlich proteinG — andere Spalten bleiben unberührt.
 */
export async function logProtein(rawInput: unknown): Promise<ActionResult> {
  const parsed = logProteinSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const { proteinG } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = getTodayBerlin();
  const now = new Date();

  try {
    await db
      .insert(dailyNutritionLog)
      .values({ userId: user.id, logDate: today, waterMl: 0, proteinG })
      .onConflictDoUpdate({
        target: [dailyNutritionLog.userId, dailyNutritionLog.logDate],
        set: { proteinG, updatedAt: now },
      });

    await markNutritionMissionDone(user.id, today);
  } catch (err) {
    console.error(
      "logProtein fehlgeschlagen:",
      err instanceof Error ? err.message : err,
    );
    return { error: "Speichern hat nicht geklappt. Bitte versuche es gleich noch einmal." };
  }

  revalidatePath("/ernaehrung");
  revalidatePath("/heute");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Wasser loggen (atomar)                                            */
/* ------------------------------------------------------------------ */

/**
 * Erhöht Wasser kumulativ und atomar.
 * SQL-Increment statt App-Level read+write → race-condition-safe.
 */
export async function addWater(rawInput: unknown): Promise<ActionResult> {
  const parsed = addWaterSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültiger Wert." };
  }
  const { addMl } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = getTodayBerlin();
  const now = new Date();

  try {
    await db
      .insert(dailyNutritionLog)
      .values({ userId: user.id, logDate: today, waterMl: addMl })
      .onConflictDoUpdate({
        target: [dailyNutritionLog.userId, dailyNutritionLog.logDate],
        set: {
          waterMl: sql`${dailyNutritionLog.waterMl} + ${addMl}`,
          updatedAt: now,
        },
      });

    await markNutritionMissionDone(user.id, today);
  } catch (err) {
    console.error(
      "addWater fehlgeschlagen:",
      err instanceof Error ? err.message : err,
    );
    return { error: "Speichern hat nicht geklappt. Bitte versuche es gleich noch einmal." };
  }

  revalidatePath("/ernaehrung");
  revalidatePath("/heute");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Mahlzeit abhaken                                                  */
/* ------------------------------------------------------------------ */

/**
 * Toggled eine Mahlzeit im JSONB-Feld per atomarem SQL-Merge.
 * Nur erlaubte Keys (Enum); kein freies JSON vom Client.
 */
export async function toggleMeal(rawInput: unknown): Promise<ActionResult> {
  const parsed = toggleMealSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const { mealKey, done } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = getTodayBerlin();
  const now = new Date();
  const patch = JSON.stringify({ [mealKey]: done });

  try {
    await db
      .insert(dailyNutritionLog)
      .values({
        userId: user.id,
        logDate: today,
        waterMl: 0,
        mealsStatus: { [mealKey]: done },
      })
      .onConflictDoUpdate({
        target: [dailyNutritionLog.userId, dailyNutritionLog.logDate],
        set: {
          mealsStatus: sql`COALESCE(${dailyNutritionLog.mealsStatus}, '{}'::jsonb) || ${patch}::jsonb`,
          updatedAt: now,
        },
      });

    await markNutritionMissionDone(user.id, today);
  } catch (err) {
    console.error(
      "toggleMeal fehlgeschlagen:",
      err instanceof Error ? err.message : err,
    );
    return { error: "Speichern hat nicht geklappt. Bitte versuche es gleich noch einmal." };
  }

  revalidatePath("/ernaehrung");
  revalidatePath("/heute");
  return { ok: true };
}
