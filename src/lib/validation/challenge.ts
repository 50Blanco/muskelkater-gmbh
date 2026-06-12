import { z } from "zod";

/**
 * Validierung für Phase-9-Team-Challenge & manuelle Schritte.
 * Alle Eingaben (Server Actions) werden hiermit am Boundary geprüft.
 */

export const CHALLENGE_STATUSES = ["active", "completed", "cancelled"] as const;
export type ChallengeStatus = (typeof CHALLENGE_STATUSES)[number];

/** Maximalwerte als benannte Konstanten (keine Magic Numbers). */
export const CHALLENGE_TITLE_MIN = 2;
export const CHALLENGE_TITLE_MAX = 60;
export const STAKE_TEXT_MAX = 140;
export const STEPS_MIN = 0;
export const STEPS_MAX = 100_000;

/** ISO-Datum YYYY-MM-DD (matcht den `date`-Spaltentyp / Berlin-Helper). */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum (YYYY-MM-DD erwartet).");

export const challengeTitleSchema = z
  .string()
  .trim()
  .min(CHALLENGE_TITLE_MIN, `Titel zu kurz (min. ${CHALLENGE_TITLE_MIN} Zeichen).`)
  .max(CHALLENGE_TITLE_MAX, `Titel zu lang (max. ${CHALLENGE_TITLE_MAX} Zeichen).`);

/**
 * Einsatz ist optional und nur Freitext (z. B. „Verlierer gibt Essen aus").
 * Leerstring wird zu undefined normalisiert; keine Zahlungs-/Wettlogik.
 */
export const stakeTextSchema = z
  .string()
  .trim()
  .max(STAKE_TEXT_MAX, `Einsatz zu lang (max. ${STAKE_TEXT_MAX} Zeichen).`)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const stepsSchema = z
  .number({ error: "Schritte müssen eine Zahl sein." })
  .int("Schritte müssen ganzzahlig sein.")
  .min(STEPS_MIN, "Schritte dürfen nicht negativ sein.")
  .max(STEPS_MAX, `Maximal ${STEPS_MAX.toLocaleString("de-DE")} Schritte.`);

export const groupIdSchema = z.uuid("Ungültige Team-ID.");
export const memberIdSchema = z.uuid("Ungültige Mitglieds-ID.");

/**
 * Challenge-Anlage. Start muss <= Ende sein.
 * Datumsvergleich als String ist bei ISO-YYYY-MM-DD lexikografisch korrekt.
 */
export const createTeamChallengeSchema = z
  .object({
    groupId: groupIdSchema,
    title: challengeTitleSchema,
    startsOn: isoDateSchema,
    endsOn: isoDateSchema,
    stakeText: stakeTextSchema,
  })
  .refine((data) => data.startsOn <= data.endsOn, {
    error: "Das Startdatum muss vor oder am Enddatum liegen.",
    path: ["endsOn"],
  });

/** Manuelle Schritteingabe für einen Tag (Upsert). */
export const updateDailyStepsSchema = z.object({
  date: isoDateSchema,
  steps: stepsSchema,
});

export type CreateTeamChallengeInput = z.infer<typeof createTeamChallengeSchema>;
export type UpdateDailyStepsInput = z.infer<typeof updateDailyStepsSchema>;
