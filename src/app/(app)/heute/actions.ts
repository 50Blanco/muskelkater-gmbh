"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { dailyHabitLog, dailyMission, habit } from "@/db/schema";
import { toggleHabitSchema } from "@/lib/validation/nutrition";
import { getTodayBerlin } from "@/lib/utils/date";

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
