import { z } from "zod";
import { PLAUSIBILITY, isPlausibleBirthDate } from "@/lib/safety/limits";

/**
 * Onboarding-Validierung (Zod) — wird client- UND serverseitig benutzt.
 * Zahlenfelder akzeptieren Strings mit Komma ("82,5") aus den Formularen.
 */

/* UI-Zielauswahl (6 Optionen) → DB-Enum goal_type (5 Werte). */
export const GOAL_CHOICES = [
  "build_muscle",
  "lose_fat",
  "get_fit",
  "health",
  "performance",
  "maintain",
] as const;
export type GoalChoice = (typeof GOAL_CHOICES)[number];

export const GOAL_CHOICE_TO_GOAL_TYPE = {
  build_muscle: "build_muscle",
  lose_fat: "lose_fat",
  get_fit: "get_fit",
  health: "get_fit",
  performance: "strength",
  maintain: "maintain",
} as const satisfies Record<
  GoalChoice,
  "build_muscle" | "lose_fat" | "get_fit" | "strength" | "maintain"
>;

export const MINUTES_OPTIONS = [20, 30, 45, 60] as const;

/** Zahlenfeld mit Komma-Unterstützung und Plausibilitätsgrenzen. */
function numberField(min: number, max: number, message: string) {
  return z.preprocess(
    (value) => {
      if (typeof value === "number") return value;
      if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value.trim().replace(",", "."));
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    },
    z.number(message).min(min, message).max(max, message),
  );
}

const onboardingBase = z.object({
  /* Step 1 — Ziel */
  goalChoice: z.enum(GOAL_CHOICES, "Bitte wähle dein Hauptziel aus."),

  /* Step 2 — Körperdaten */
  displayName: z
    .string("Bitte gib einen Anzeigenamen an.")
    .trim()
    .min(2, "Der Name braucht mindestens 2 Zeichen.")
    .max(40, "Der Name darf höchstens 40 Zeichen haben."),
  sex: z
    .enum(["male", "female", "diverse", "prefer_not_say"])
    .default("prefer_not_say"),
  birthDate: z
    .string("Bitte gib dein Geburtsdatum an.")
    .refine(
      isPlausibleBirthDate,
      `Bitte gib ein gültiges Geburtsdatum an (Alter ${PLAUSIBILITY.ageYears.min}–${PLAUSIBILITY.ageYears.max}).`,
    ),
  heightCm: numberField(
    PLAUSIBILITY.heightCm.min,
    PLAUSIBILITY.heightCm.max,
    `Bitte gib deine Größe in cm an (${PLAUSIBILITY.heightCm.min}–${PLAUSIBILITY.heightCm.max}).`,
  ),
  weightKg: numberField(
    PLAUSIBILITY.weightKg.min,
    PLAUSIBILITY.weightKg.max,
    `Bitte gib dein Gewicht in kg an (${PLAUSIBILITY.weightKg.min}–${PLAUSIBILITY.weightKg.max}).`,
  ),
  waistCm: numberField(
    PLAUSIBILITY.waistCm.min,
    PLAUSIBILITY.waistCm.max,
    `Bitte gib deinen Bauchumfang in cm an (${PLAUSIBILITY.waistCm.min}–${PLAUSIBILITY.waistCm.max}).`,
  ),
  armCm: numberField(
    PLAUSIBILITY.armCm.min,
    PLAUSIBILITY.armCm.max,
    `Bitte gib deinen Armumfang in cm an (${PLAUSIBILITY.armCm.min}–${PLAUSIBILITY.armCm.max}).`,
  ),

  /* Step 3 — Erfahrung */
  experienceLevel: z.enum(
    ["beginner", "intermediate", "advanced"],
    "Bitte wähle deine Trainingserfahrung.",
  ),

  /* Step 4 — Trainingsort */
  trainingLocation: z.enum(
    ["gym", "home", "both"],
    "Bitte wähle deinen Trainingsort.",
  ),
  homeEquipment: z.enum(["none", "dumbbells", "bands"]).nullable().default(null),

  /* Step 5 — Zeit & Woche */
  daysPerWeek: numberField(
    PLAUSIBILITY.daysPerWeek.min,
    PLAUSIBILITY.daysPerWeek.max,
    "Bitte wähle, wie oft du pro Woche trainieren willst (2–6 Tage).",
  ).refine(Number.isInteger, "Bitte wähle ganze Trainingstage."),
  minutesPerSession: numberField(
    20,
    60,
    "Bitte wähle, wie viel Zeit du pro Training hast.",
  ).refine(
    (v) => (MINUTES_OPTIONS as readonly number[]).includes(v),
    "Bitte wähle eine der Zeitoptionen (20, 30, 45 oder 60 Minuten).",
  ),
  preferredDays: z
    .array(z.number().int().min(0).max(6))
    .max(7)
    .default([]),

  /* Step 6 — Ernährung */
  nutritionStyle: z.enum(
    ["normal", "vegetarian", "vegan", "halal", "no_preference"],
    "Bitte wähle deinen Ernährungsstil.",
  ),
  trackingMode: z.enum(["simple", "precise"]).default("simple"),

  /* Step 7 — Sicherheit */
  hasLimitations: z.boolean(
    "Bitte beantworte die Frage zu Verletzungen oder Einschränkungen.",
  ),
  limitations: z
    .string()
    .trim()
    .max(500, "Bitte beschreibe es kürzer (max. 500 Zeichen).")
    .default(""),
  disclaimerAccepted: z
    .boolean()
    .refine((v) => v === true, "Bitte bestätige den Sicherheitshinweis."),
});

/** Pflicht-Beschreibung, wenn Einschränkungen angegeben wurden. */
function requireLimitationText(
  data: { hasLimitations: boolean; limitations: string },
  ctx: z.RefinementCtx,
) {
  if (data.hasLimitations && data.limitations.length < 3) {
    ctx.addIssue({
      code: "custom",
      message: "Bitte beschreibe deine Einschränkung kurz.",
      path: ["limitations"],
    });
  }
}

export const onboardingSchema = onboardingBase.superRefine(
  requireLimitationText,
);
export type OnboardingInput = z.infer<typeof onboardingSchema>;

/** Schemas je Wizard-Step (für die Schritt-Validierung im Client). */
export const onboardingStepSchemas = {
  goal: onboardingBase.pick({ goalChoice: true }),
  body: onboardingBase.pick({
    displayName: true,
    sex: true,
    birthDate: true,
    heightCm: true,
    weightKg: true,
    waistCm: true,
    armCm: true,
  }),
  experience: onboardingBase.pick({ experienceLevel: true }),
  location: onboardingBase.pick({
    trainingLocation: true,
    homeEquipment: true,
  }),
  schedule: onboardingBase.pick({
    daysPerWeek: true,
    minutesPerSession: true,
    preferredDays: true,
  }),
  nutrition: onboardingBase.pick({
    nutritionStyle: true,
    trackingMode: true,
  }),
  safety: onboardingBase
    .pick({
      hasLimitations: true,
      limitations: true,
      disclaimerAccepted: true,
    })
    .superRefine(requireLimitationText),
} as const;

export type OnboardingStepKey = keyof typeof onboardingStepSchemas;
