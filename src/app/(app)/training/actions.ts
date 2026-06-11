"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  customExercise,
  dailyMission,
  userExercisePreference,
  workoutSession,
  workoutSet,
} from "@/db/schema";
import {
  customExerciseSchema,
  finishWorkoutSchema,
} from "@/lib/validation/workout";
import {
  ensureActiveSession,
  getWorkoutDayForSession,
} from "@/lib/workout/session-data";
import { computeDurationMin } from "@/lib/workout/session-helpers";
import { isPainReason } from "@/lib/workout/reasons";

/** Lokales Datum als YYYY-MM-DD (für date-Spalten). */
function localDateString(date = new Date()): string {
  return date.toLocaleDateString("en-CA");
}

type ActionResult = { error: string } | { ok: true };

/* ------------------------------------------------------------------ */
/* Workout starten                                                    */
/* ------------------------------------------------------------------ */

/**
 * Startet ein Workout für einen Trainingstag: prüft die Eigentümerschaft,
 * legt (idempotent) eine aktive Session an und leitet zur Session-Seite.
 */
export async function startWorkout(formData: FormData): Promise<void> {
  const dayId = String(formData.get("dayId") ?? "");
  if (!z.uuid().safeParse(dayId).success) redirect("/training");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const day = await getWorkoutDayForSession(user.id, dayId);
  if (!day) redirect("/training"); // gehört nicht dem Nutzer oder existiert nicht

  await ensureActiveSession(user.id, dayId);
  redirect(`/training/session/${dayId}`);
}

/* ------------------------------------------------------------------ */
/* Workout abschließen                                                */
/* ------------------------------------------------------------------ */

/**
 * Speichert Sätze + Feedback, schließt die Session ab und hakt die
 * Workout-Tagesmission ab. Alles serverseitig validiert und user-scoped.
 */
export async function finishWorkout(rawInput: unknown): Promise<ActionResult> {
  const parsed = finishWorkoutSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingaben." };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Session muss dem Nutzer gehören.
  const [session] = await db
    .select()
    .from(workoutSession)
    .where(
      and(
        eq(workoutSession.id, input.sessionId),
        eq(workoutSession.userId, user.id),
      ),
    )
    .limit(1);
  if (!session) return { error: "Diese Trainingseinheit wurde nicht gefunden." };

  // P5: Cross-Check — Session muss zum gesendeten Tag gehören.
  if (session.workoutDayId !== input.dayId) {
    return { error: "Session passt nicht zu diesem Trainingstag." };
  }

  // P1: Idempotent — bereits abgeschlossene Session nicht nochmals schreiben.
  if (session.status === "completed") return { ok: true };

  // Nur aktive Sessions können abgeschlossen werden.
  if (session.status !== "active") {
    return { error: "Diese Trainingseinheit kann nicht mehr abgeschlossen werden." };
  }

  // Eigene Übungen in den Sätzen müssen wirklich dem Nutzer gehören.
  const customIds = [
    ...new Set(
      input.sets
        .map((s) => s.customExerciseId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (customIds.length > 0) {
    const owned = await db
      .select({ id: customExercise.id })
      .from(customExercise)
      .where(
        and(
          eq(customExercise.userId, user.id),
          inArray(customExercise.id, customIds),
        ),
      );
    const ownedIds = new Set(owned.map((o) => o.id));
    if (customIds.some((id) => !ownedIds.has(id))) {
      return { error: "Eine der eigenen Übungen ist ungültig." };
    }
  }

  const now = new Date();
  const today = localDateString(now);
  // Nur Sätze mit Inhalt speichern (leere Zeilen ignorieren).
  const setsToSave = input.sets.filter(
    (s) => s.reps !== null || s.weightKg !== null || s.completed,
  );

  try {
    await db.transaction(async (tx) => {
      // Idempotent: vorhandene Sätze dieser Session ersetzen.
      await tx
        .delete(workoutSet)
        .where(
          and(
            eq(workoutSet.sessionId, input.sessionId),
            eq(workoutSet.userId, user.id),
          ),
        );
      if (setsToSave.length > 0) {
        await tx.insert(workoutSet).values(
          setsToSave.map((s) => ({
            userId: user.id,
            sessionId: input.sessionId,
            exerciseId: s.exerciseId,
            customExerciseId: s.customExerciseId,
            setNumber: s.setNumber,
            weightKg: s.weightKg,
            reps: s.reps,
            completed: s.completed,
          })),
        );
      }

      // Session abschließen.
      await tx
        .update(workoutSession)
        .set({
          status: "completed",
          completedAt: now,
          durationMin: input.durationMin ?? computeDurationMin(session.startedAt, now),
          perceivedEffort: input.perceivedEffort,
          soreness: input.soreness,
          mood: input.mood,
          updatedAt: now,
        })
        .where(
          and(
            eq(workoutSession.id, input.sessionId),
            eq(workoutSession.userId, user.id),
          ),
        );

      // Übungs-Feedback (eine Zeile pro Nutzer+Übung, Upsert).
      for (const f of input.feedback) {
        const keepInPlan = f.preference !== "dislike";
        const painFlag = isPainReason(f.reason);
        await tx
          .insert(userExercisePreference)
          .values({
            userId: user.id,
            exerciseId: f.exerciseId,
            preference: f.preference,
            keepInPlan,
            avoidExercise: false,
            reason: f.reason,
            painFlag,
          })
          .onConflictDoUpdate({
            target: [
              userExercisePreference.userId,
              userExercisePreference.exerciseId,
            ],
            set: {
              preference: f.preference,
              keepInPlan,
              reason: f.reason,
              painFlag,
              updatedAt: now,
            },
          });
      }

      // Workout-Tagesmission für heute abhaken (falls vorhanden).
      await tx
        .update(dailyMission)
        .set({ status: "done", updatedAt: now })
        .where(
          and(
            eq(dailyMission.userId, user.id),
            eq(dailyMission.missionDate, today),
            eq(dailyMission.type, "workout"),
          ),
        );
    });
  } catch (err) {
    console.error(
      "finishWorkout: Transaktion fehlgeschlagen:",
      err instanceof Error ? err.message : err,
    );
    return {
      error: "Speichern hat nicht geklappt. Bitte versuche es gleich noch einmal.",
    };
  }

  revalidatePath("/heute");
  revalidatePath("/training");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Eigene Übung anlegen                                               */
/* ------------------------------------------------------------------ */

/** Legt eine eigene (user-scoped) Übung an. */
export async function createCustomExercise(
  rawInput: unknown,
): Promise<ActionResult> {
  const parsed = customExerciseSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingaben." };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  try {
    await db.insert(customExercise).values({
      userId: user.id,
      name: input.name,
      muscleGroup: input.muscleGroup,
      equipment: input.equipment,
      location: input.location,
      level: input.level,
      instructions: input.instructions || null,
      notes: input.notes || null,
    });
  } catch (err) {
    console.error(
      "createCustomExercise fehlgeschlagen:",
      err instanceof Error ? err.message : err,
    );
    return {
      error: "Speichern hat nicht geklappt. Bitte versuche es gleich noch einmal.",
    };
  }

  revalidatePath("/training");
  return { ok: true };
}
