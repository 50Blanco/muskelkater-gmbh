import { z } from "zod";

export const GOAL_TYPE_LABELS: Record<string, string> = {
  build_muscle: "Muskeln aufbauen",
  lose_fat: "Fett abbauen",
  get_fit: "Fit werden",
  strength: "Kraft steigern",
  maintain: "Gewicht halten",
};

export const updateDisplayNameSchema = z.object({
  displayName: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(30, "Maximal 30 Zeichen")
    .trim(),
});

export const updateFitnessGoalSchema = z.object({
  goalType: z.enum(["build_muscle", "lose_fat", "get_fit", "strength", "maintain"]),
});

export const updatePrivacySettingsSchema = z.object({
  showTraining: z.boolean(),
  showSteps: z.boolean(),
  showNutrition: z.boolean(),
  showWater: z.boolean(),
  showHabits: z.boolean(),
  showWeeklyCheckinStatus: z.boolean(),
  showInRanking: z.boolean(),
});

export type UpdatePrivacySettings = z.infer<typeof updatePrivacySettingsSchema>;
