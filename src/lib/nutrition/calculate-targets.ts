/**
 * Nutrition-Generator (pure TypeScript, keine React-/DB-Abhängigkeiten).
 *
 * Berechnet erste Ernährungsziele nach Mifflin-St-Jeor mit moderater
 * Aktivitätsannahme und Sicherheitsgrenzen:
 *  - Defizit maximal 20 %, Überschuss maximal +10 %
 *  - absolute Kalorien-Grenzen (Floor/Ceiling)
 *  - Protein nach Ziel (g/kg), gedeckelt
 *  - Wasser ~33 ml/kg, gedeckelt
 */

export type Sex = "male" | "female" | "diverse" | "prefer_not_say";
export type GoalType =
  | "lose_fat"
  | "build_muscle"
  | "get_fit"
  | "strength"
  | "maintain";

export interface NutritionInput {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: Sex;
  goalType: GoalType;
  daysPerWeek: number;
}

export interface NutritionTargets {
  caloriesKcal: number;
  proteinG: number;
  waterMl: number;
  /** Dokumentation der Berechnung (wird als jsonb gespeichert). */
  calculatedFrom: Record<string, unknown>;
}

/* Sicherheitsgrenzen — bewusst konservativ für einen regelbasierten MVP. */
const CALORIES_FLOOR_KCAL = 1400;
const CALORIES_CEILING_KCAL = 4000;
const PROTEIN_MIN_G = 60;
const PROTEIN_MAX_G = 230;
const WATER_MIN_ML = 1500;
const WATER_MAX_ML = 4000;
const WATER_ML_PER_KG = 33;

/** Kalorien-Anpassung relativ zum Erhaltungsbedarf, je Ziel. */
const GOAL_CALORIE_ADJUSTMENT: Record<GoalType, number> = {
  lose_fat: -0.2,
  build_muscle: 0.1,
  strength: 0.05,
  get_fit: 0,
  maintain: 0,
};

/** Protein in g pro kg Körpergewicht, je Ziel. */
const GOAL_PROTEIN_PER_KG: Record<GoalType, number> = {
  lose_fat: 2.0,
  build_muscle: 2.0,
  strength: 1.8,
  get_fit: 1.6,
  maintain: 1.6,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Grundumsatz nach Mifflin-St-Jeor. Ohne Geschlechtsangabe: Mittelwert beider Offsets. */
function bmrMifflinStJeor(input: NutritionInput): number {
  const base =
    10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears;
  const offset =
    input.sex === "male" ? 5 : input.sex === "female" ? -161 : -78;
  return base + offset;
}

/** Moderate Aktivitätsannahme, leicht gestaffelt nach Trainingstagen. */
function activityFactor(daysPerWeek: number): number {
  if (daysPerWeek <= 3) return 1.45;
  if (daysPerWeek <= 5) return 1.55;
  return 1.6;
}

export function calculateNutritionTargets(
  input: NutritionInput,
): NutritionTargets {
  const bmr = bmrMifflinStJeor(input);
  const factor = activityFactor(input.daysPerWeek);
  const tdee = bmr * factor;
  const adjustment = GOAL_CALORIE_ADJUSTMENT[input.goalType];

  const caloriesKcal = clamp(
    Math.round((tdee * (1 + adjustment)) / 25) * 25,
    CALORIES_FLOOR_KCAL,
    CALORIES_CEILING_KCAL,
  );

  const proteinG = clamp(
    Math.round(input.weightKg * GOAL_PROTEIN_PER_KG[input.goalType]),
    PROTEIN_MIN_G,
    PROTEIN_MAX_G,
  );

  const waterMl = clamp(
    Math.round((input.weightKg * WATER_ML_PER_KG) / 50) * 50,
    WATER_MIN_ML,
    WATER_MAX_ML,
  );

  return {
    caloriesKcal,
    proteinG,
    waterMl,
    calculatedFrom: {
      method: "mifflin_st_jeor_v1",
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      ageYears: input.ageYears,
      sex: input.sex,
      goalType: input.goalType,
      daysPerWeek: input.daysPerWeek,
      bmrKcal: Math.round(bmr),
      activityFactor: factor,
      tdeeKcal: Math.round(tdee),
      calorieAdjustment: adjustment,
      proteinPerKg: GOAL_PROTEIN_PER_KG[input.goalType],
      waterMlPerKg: WATER_ML_PER_KG,
      safetyLimits: {
        caloriesFloorKcal: CALORIES_FLOOR_KCAL,
        caloriesCeilingKcal: CALORIES_CEILING_KCAL,
        proteinMaxG: PROTEIN_MAX_G,
        waterMaxMl: WATER_MAX_ML,
      },
      calculatedAt: new Date().toISOString(),
    },
  };
}
