"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { dailyStepLog, socialGroupMember, teamChallenge } from "@/db/schema";
import {
  createTeamChallengeSchema,
  updateDailyStepsSchema,
} from "@/lib/validation/challenge";

type ActionResult = { error: string } | { ok: true };
type CreateChallengeResult = { error: string } | { ok: true; challengeId: string };

/**
 * Erstellt eine neue Team-Challenge.
 * Auth Pflicht; nur Mitglieder des Teams dürfen erstellen (Server-Prüfung +
 * RLS). MVP-Regel: pro Team ist nur eine aktive Challenge relevant — vorherige
 * aktive Challenges werden auf „completed" gesetzt. Einsatz ist nur Freitext.
 */
export async function createTeamChallenge(
  rawInput: unknown,
): Promise<CreateChallengeResult> {
  const parsed = createTeamChallengeSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const { groupId, title, startsOn, endsOn, stakeText } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Membership-Prüfung serverseitig (Defense-in-Depth zusätzlich zur RLS).
  const [membership] = await db
    .select({ id: socialGroupMember.id })
    .from(socialGroupMember)
    .where(
      and(
        eq(socialGroupMember.groupId, groupId),
        eq(socialGroupMember.userId, user.id),
      ),
    )
    .limit(1);

  if (!membership) return { error: "Du bist kein Mitglied dieses Teams." };

  let challengeId = "";
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(teamChallenge)
        .set({ status: "completed", updatedAt: new Date() })
        .where(
          and(
            eq(teamChallenge.groupId, groupId),
            eq(teamChallenge.status, "active"),
          ),
        );

      const [created] = await tx
        .insert(teamChallenge)
        .values({
          groupId,
          createdByUserId: user.id,
          title,
          stakeText: stakeText ?? null,
          startsOn,
          endsOn,
          status: "active",
        })
        .returning({ id: teamChallenge.id });

      challengeId = created.id;
    });
  } catch (err) {
    console.error(
      "createTeamChallenge:",
      err instanceof Error ? err.message : err,
    );
    return {
      error: "Challenge konnte nicht erstellt werden. Bitte versuche es erneut.",
    };
  }

  revalidatePath("/team");
  revalidatePath("/heute");
  return { ok: true, challengeId };
}

/**
 * Trägt die eigenen Schritte für einen Tag ein (Upsert).
 * Auth Pflicht; user_id kommt aus der Session, nie vom Client.
 */
export async function updateMyDailySteps(
  rawInput: unknown,
): Promise<ActionResult> {
  const parsed = updateDailyStepsSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const { date, steps } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  try {
    await db
      .insert(dailyStepLog)
      .values({ userId: user.id, logDate: date, steps })
      .onConflictDoUpdate({
        target: [dailyStepLog.userId, dailyStepLog.logDate],
        set: { steps, updatedAt: now },
      });
  } catch (err) {
    console.error(
      "updateMyDailySteps:",
      err instanceof Error ? err.message : err,
    );
    return {
      error: "Schritte konnten nicht gespeichert werden. Bitte versuche es erneut.",
    };
  }

  revalidatePath("/team");
  revalidatePath("/heute");
  return { ok: true };
}
