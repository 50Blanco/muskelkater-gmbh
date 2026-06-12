"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { socialGroup, socialGroupMember, socialReaction } from "@/db/schema";
import {
  createSocialGroupSchema,
  joinSocialGroupSchema,
  reactToSocialEventSchema,
  type SocialReactionType,
  type SocialTargetType,
} from "@/lib/validation/social";

type ActionResult = { error: string } | { ok: true };
type CreateGroupResult =
  | { error: string }
  | { ok: true; groupId: string; inviteCode: string };

/** Generiert einen 8-stelligen alphanumerischen Einladungscode. */
function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from(randomBytes(8))
    .map((b) => alphabet[b % alphabet.length])
    .join("");
}

/**
 * Erstellt eine neue Crew-Gruppe.
 * Owner wird automatisch als erstes Mitglied eingetragen.
 * user_id kommt aus Auth, nie vom Client.
 */
export async function createSocialGroup(
  rawInput: unknown,
): Promise<CreateGroupResult> {
  const parsed = createSocialGroupSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const { name } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const inviteCode = generateInviteCode();

  try {
    const [group] = await db
      .insert(socialGroup)
      .values({ ownerUserId: user.id, name, inviteCode })
      .returning({ id: socialGroup.id });

    await db.insert(socialGroupMember).values({
      groupId: group.id,
      userId: user.id,
      role: "owner",
    });
  } catch (err) {
    console.error("createSocialGroup:", err instanceof Error ? err.message : err);
    return { error: "Gruppe konnte nicht erstellt werden. Bitte versuche es erneut." };
  }

  revalidatePath("/heute");
  return { ok: true, groupId: "", inviteCode };
}

/**
 * Tritt einer Gruppe per Einladungscode bei.
 * Idempotent: bestehende Mitgliedschaft wird nicht dupliziert.
 */
export async function joinSocialGroupByCode(
  rawInput: unknown,
): Promise<ActionResult> {
  const parsed = joinSocialGroupSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültiger Einladungscode." };
  }
  const { inviteCode } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [group] = await db
    .select({ id: socialGroup.id })
    .from(socialGroup)
    .where(eq(socialGroup.inviteCode, inviteCode))
    .limit(1);

  if (!group) return { error: "Einladungscode nicht gefunden." };

  const [existing] = await db
    .select({ id: socialGroupMember.id })
    .from(socialGroupMember)
    .where(
      and(
        eq(socialGroupMember.groupId, group.id),
        eq(socialGroupMember.userId, user.id),
      ),
    )
    .limit(1);

  if (existing) {
    revalidatePath("/heute");
    return { ok: true };
  }

  try {
    await db.insert(socialGroupMember).values({
      groupId: group.id,
      userId: user.id,
      role: "member",
    });
  } catch (err) {
    console.error("joinSocialGroupByCode:", err instanceof Error ? err.message : err);
    return { error: "Beitreten hat nicht geklappt. Bitte versuche es erneut." };
  }

  revalidatePath("/heute");
  return { ok: true };
}

/**
 * Toggle-Reaktion auf ein Feed-Event.
 * User muss Mitglied der Gruppe sein.
 * Existiert die Reaktion bereits → löschen. Sonst → einfügen.
 */
export async function reactToSocialEvent(
  rawInput: unknown,
): Promise<ActionResult> {
  const parsed = reactToSocialEventSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const { groupId, targetType, targetId, reactionType } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  if (!membership) return { error: "Du bist kein Mitglied dieser Gruppe." };

  const [existing] = await db
    .select({ id: socialReaction.id })
    .from(socialReaction)
    .where(
      and(
        eq(socialReaction.groupId, groupId),
        eq(socialReaction.userId, user.id),
        eq(socialReaction.targetType, targetType as SocialTargetType),
        eq(socialReaction.targetId, targetId),
        eq(socialReaction.reactionType, reactionType as SocialReactionType),
      ),
    )
    .limit(1);

  try {
    if (existing) {
      await db
        .delete(socialReaction)
        .where(eq(socialReaction.id, existing.id));
    } else {
      await db.insert(socialReaction).values({
        groupId,
        userId: user.id,
        targetType: targetType as SocialTargetType,
        targetId,
        reactionType: reactionType as SocialReactionType,
      });
    }
  } catch (err) {
    console.error("reactToSocialEvent:", err instanceof Error ? err.message : err);
    return { error: "Reaktion konnte nicht gespeichert werden." };
  }

  revalidatePath("/heute");
  return { ok: true };
}
