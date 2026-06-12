import { z } from "zod";

export const SOCIAL_REACTION_TYPES = ["stark", "weiter_so", "respekt"] as const;
export const SOCIAL_TARGET_TYPES = [
  "workout_session",
  "daily_mission",
  "daily_habit_log",
] as const;

export type SocialReactionType = (typeof SOCIAL_REACTION_TYPES)[number];
export type SocialTargetType = (typeof SOCIAL_TARGET_TYPES)[number];

export const reactionTypeSchema = z.enum(SOCIAL_REACTION_TYPES, {
  error: "Ungültige Reaktion.",
});

export const targetTypeSchema = z.enum(SOCIAL_TARGET_TYPES, {
  error: "Ungültiger Zieltyp.",
});

export const groupNameSchema = z
  .string()
  .trim()
  .min(2, "Name zu kurz (min. 2 Zeichen).")
  .max(50, "Name zu lang (max. 50 Zeichen).");

/** Normalisiert Leerzeichen, Bindestriche und wandelt in Großbuchstaben um. */
export const inviteCodeSchema = z.preprocess(
  (v) =>
    typeof v === "string"
      ? v.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
      : v,
  z
    .string()
    .length(8, "Einladungscode muss 8 Zeichen lang sein.")
    .regex(/^[A-Z0-9]{8}$/, "Ungültiger Einladungscode."),
);

export const createSocialGroupSchema = z.object({
  name: groupNameSchema,
});

export const joinSocialGroupSchema = z.object({
  inviteCode: inviteCodeSchema,
});

export const reactToSocialEventSchema = z.object({
  groupId: z.uuid("Ungültige Gruppen-ID."),
  targetType: targetTypeSchema,
  targetId: z.uuid("Ungültige Ziel-ID."),
  reactionType: reactionTypeSchema,
});

export type CreateSocialGroupInput = z.infer<typeof createSocialGroupSchema>;
export type JoinSocialGroupInput = z.infer<typeof joinSocialGroupSchema>;
export type ReactToSocialEventInput = z.infer<typeof reactToSocialEventSchema>;
