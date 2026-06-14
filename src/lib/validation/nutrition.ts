import { z } from "zod";

/**
 * Validierung für Phase 5 (Ernährungs-Log, Wasser, Mahlzeiten, Habits).
 * Wird client- UND serverseitig benutzt.
 */

/* ------------------------------------------------------------------ */
/* Mahlzeiten                                                         */
/* ------------------------------------------------------------------ */

export const MEAL_KEYS = [
  "fruehstueck",
  "mittagessen",
  "abendessen",
  "snack",
] as const;
export type MealKey = (typeof MEAL_KEYS)[number];

export const MEAL_LABELS: Record<MealKey, string> = {
  fruehstueck: "Frühstück",
  mittagessen: "Mittagessen",
  abendessen: "Abendessen",
  snack: "Snack",
};

/* ------------------------------------------------------------------ */
/* Wasser-Quick-Add                                                   */
/* ------------------------------------------------------------------ */

export const WATER_STEPS = [100, 200, 500, 750, 1000] as const;
type WaterStep = (typeof WATER_STEPS)[number];

/* ------------------------------------------------------------------ */
/* Schemas                                                            */
/* ------------------------------------------------------------------ */

export const logProteinSchema = z.object({
  proteinG: z
    .number()
    .int("Bitte eine ganze Zahl eingeben.")
    .min(0, "Minimum 0 g.")
    .max(500, "Maximum 500 g."),
});

export const addWaterSchema = z.object({
  addMl: z
    .number()
    .int()
    .refine((n): n is WaterStep => (WATER_STEPS as readonly number[]).includes(n), {
      message: "Ungültiger Wasserwert.",
    }),
});

export const toggleMealSchema = z.object({
  mealKey: z.enum([...MEAL_KEYS]),
  done: z.boolean(),
});

export const toggleHabitSchema = z.object({
  habitId: z.string().uuid("Ungültige Habit-ID."),
  completed: z.boolean(),
});

/* ------------------------------------------------------------------ */
/* Meal-Log (Phase 14)                                               */
/* ------------------------------------------------------------------ */

export const MEAL_TYPE_LABELS: Record<MealKey, string> = {
  fruehstueck: "Frühstück",
  mittagessen: "Mittagessen",
  abendessen: "Abendessen",
  snack: "Snack",
};

export const addMealLogSchema = z.object({
  mealType: z.enum([...MEAL_KEYS]),
  title: z
    .string()
    .min(1, "Bezeichnung ist Pflicht.")
    .max(120, "Maximal 120 Zeichen."),
  caloriesKcal: z
    .number()
    .int("Bitte ganze Zahl eingeben.")
    .min(1, "Mindestens 1 kcal.")
    .max(9999, "Maximal 9999 kcal.")
    .nullable()
    .optional(),
  proteinG: z
    .number()
    .int("Bitte ganze Zahl eingeben.")
    .min(1, "Mindestens 1 g.")
    .max(500, "Maximal 500 g.")
    .nullable()
    .optional(),
});

export const deleteMealLogSchema = z.object({
  mealLogId: z.string().uuid("Ungültige Mahlzeit-ID."),
});

/* ------------------------------------------------------------------ */
/* Hilfs-Typen                                                        */
/* ------------------------------------------------------------------ */

export type LogProteinInput = z.infer<typeof logProteinSchema>;
export type AddWaterInput = z.infer<typeof addWaterSchema>;
export type ToggleMealInput = z.infer<typeof toggleMealSchema>;
export type ToggleHabitInput = z.infer<typeof toggleHabitSchema>;
export type AddMealLogInput = z.infer<typeof addMealLogSchema>;
export type DeleteMealLogInput = z.infer<typeof deleteMealLogSchema>;

/* ------------------------------------------------------------------ */
/* Progress-Helper                                                    */
/* ------------------------------------------------------------------ */

/** Berechnet den Fortschritt in Prozent, gedeckelt bei 100. */
export function getProgressPct(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}
