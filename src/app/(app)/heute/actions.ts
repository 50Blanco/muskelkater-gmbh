"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  bodyMeasurement,
  bodyMetrics,
  dailyHabitLog,
  dailyMission,
  habit,
  weeklyBodyCheckin,
} from "@/db/schema";
import { toggleHabitSchema } from "@/lib/validation/nutrition";
import { bodyCheckinSchema } from "@/lib/validation/body";
import { getTodayBerlin, getWeekMondayIso } from "@/lib/utils/date";

type ActionResult = { error: string } | { ok: true };

/**
 * Hakt einen Habit für heute an oder ab.
 * Prüft Ownership vor dem Schreiben — user_id kommt aus Auth, nie vom Client.
 */
export async function toggleHabitLog(rawInput: unknown): Promise<ActionResult> {
  const parsed = toggleHabitSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const { habitId, completed } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ownership-Check: Habit muss dem eingeloggten Nutzer gehören.
  const [owned] = await db
    .select({ id: habit.id })
    .from(habit)
    .where(
      and(
        eq(habit.id, habitId),
        eq(habit.userId, user.id),
        eq(habit.active, true),
      ),
    )
    .limit(1);
  if (!owned) return { error: "Gewohnheit nicht gefunden." };

  const today = getTodayBerlin();
  const now = new Date();

  try {
    await db
      .insert(dailyHabitLog)
      .values({ userId: user.id, habitId, logDate: today, completed })
      .onConflictDoUpdate({
        target: [dailyHabitLog.habitId, dailyHabitLog.logDate],
        set: { completed, updatedAt: now },
      });

    if (completed) {
      await db
        .update(dailyMission)
        .set({ status: "done", updatedAt: now })
        .where(
          and(
            eq(dailyMission.userId, user.id),
            eq(dailyMission.missionDate, today),
            eq(dailyMission.type, "habit"),
            eq(dailyMission.status, "open"),
          ),
        );
    }
  } catch (err) {
    console.error(
      "toggleHabitLog fehlgeschlagen:",
      err instanceof Error ? err.message : err,
    );
    return { error: "Speichern hat nicht geklappt. Bitte versuche es gleich noch einmal." };
  }

  revalidatePath("/heute");
  return { ok: true };
}

/**
 * Wöchentlicher Körper-Check-in: Gewicht, Bauchumfang, Armumfang.
 * Mindestens ein Wert muss angegeben sein (per Zod erzwungen).
 * userId kommt immer aus auth.getUser() — niemals vom Client.
 * Messwerte landen in bodyMetrics / bodyMeasurement (nur eigene Daten, RLS).
 * Completion-Status landet in weeklyBodyCheckin (Team-Layer sieht NUR diesen Record).
 */
export async function submitBodyCheckin(rawInput: unknown): Promise<ActionResult> {
  const parsed = bodyCheckinSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe.",
    };
  }
  const { weightKg, waistCm, armCm } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = getTodayBerlin();
  const thisWeekMonday = getWeekMondayIso(today);
  const now = new Date();

  try {
    if (weightKg != null) {
      await db
        .insert(bodyMetrics)
        .values({ userId: user.id, measuredOn: today, weightKg })
        .onConflictDoUpdate({
          target: [bodyMetrics.userId, bodyMetrics.measuredOn],
          set: { weightKg, updatedAt: now },
        });
    }

    if (waistCm != null) {
      await db
        .insert(bodyMeasurement)
        .values({ userId: user.id, measuredOn: today, type: "waist", valueCm: waistCm })
        .onConflictDoUpdate({
          target: [bodyMeasurement.userId, bodyMeasurement.measuredOn, bodyMeasurement.type],
          set: { valueCm: waistCm, updatedAt: now },
        });
    }

    if (armCm != null) {
      await db
        .insert(bodyMeasurement)
        .values({ userId: user.id, measuredOn: today, type: "arm", valueCm: armCm })
        .onConflictDoUpdate({
          target: [bodyMeasurement.userId, bodyMeasurement.measuredOn, bodyMeasurement.type],
          set: { valueCm: armCm, updatedAt: now },
        });
    }

    await db
      .insert(weeklyBodyCheckin)
      .values({ userId: user.id, weekDate: thisWeekMonday })
      .onConflictDoNothing();
  } catch (err) {
    console.error(
      "submitBodyCheckin fehlgeschlagen:",
      err instanceof Error ? err.message : err,
    );
    return {
      error: "Speichern hat nicht geklappt. Bitte versuche es gleich noch einmal.",
    };
  }

  revalidatePath("/heute");
  revalidatePath("/fortschritt");
  return { ok: true };
}
