/**
 * QA-Smoke-Test für die puren Phase-2-Module:
 * Nutrition-Generator, Plan-Generator, Onboarding-Zod-Schema.
 *
 * Ausführen: npx tsx scripts/qa-phase2-smoke.ts
 */
import { calculateNutritionTargets } from "../src/lib/nutrition/calculate-targets";
import {
  generatePlan,
  type CatalogExercise,
} from "../src/lib/plan/generate-plan";
import { onboardingSchema } from "../src/lib/validation/onboarding";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} — ${label}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
}

/* --- Nutrition --- */
const n1 = calculateNutritionTargets({
  weightKg: 82.5, heightCm: 180, ageYears: 23, sex: "male",
  goalType: "build_muscle", daysPerWeek: 4,
});
check("Nutrition Mann/Aufbau plausibel",
  n1.caloriesKcal > 2500 && n1.caloriesKcal < 3500,
  `${n1.caloriesKcal} kcal, ${n1.proteinG} g Protein, ${n1.waterMl} ml`);
check("Protein ~2 g/kg", n1.proteinG === 165, `${n1.proteinG} g`);

const n2 = calculateNutritionTargets({
  weightKg: 60, heightCm: 165, ageYears: 35, sex: "female",
  goalType: "lose_fat", daysPerWeek: 3,
});
check("Nutrition Frau/Abnehmen plausibel",
  n2.caloriesKcal >= 1400 && n2.caloriesKcal < 1800,
  `${n2.caloriesKcal} kcal`);

const n3 = calculateNutritionTargets({
  weightKg: 45, heightCm: 155, ageYears: 70, sex: "female",
  goalType: "lose_fat", daysPerWeek: 2,
});
check("Kalorien-Floor greift (>= 1400)", n3.caloriesKcal >= 1400, `${n3.caloriesKcal} kcal`);

/* --- Plan --- */
const catalog: CatalogExercise[] = [
  { id: "1", slug: "goblet-squat", name: "Goblet Squat", muscleGroup: "legs", equipment: "dumbbell", location: "both", level: "beginner", isCompound: true },
  { id: "2", slug: "bodyweight-squat", name: "Kniebeuge", muscleGroup: "legs", equipment: "bodyweight", location: "home", level: "beginner", isCompound: true },
  { id: "3", slug: "pushup", name: "Liegestütz", muscleGroup: "chest", equipment: "bodyweight", location: "both", level: "beginner", isCompound: true },
  { id: "4", slug: "db-row", name: "KH-Rudern", muscleGroup: "back", equipment: "dumbbell", location: "both", level: "beginner", isCompound: true },
  { id: "5", slug: "plank", name: "Plank", muscleGroup: "core", equipment: "bodyweight", location: "both", level: "beginner", isCompound: false },
  { id: "6", slug: "glute-bridge", name: "Glute Bridge", muscleGroup: "glutes", equipment: "bodyweight", location: "home", level: "beginner", isCompound: false },
  { id: "7", slug: "bench-press", name: "Bankdrücken", muscleGroup: "chest", equipment: "barbell", location: "gym", level: "intermediate", isCompound: true },
  { id: "8", slug: "deadlift", name: "Kreuzheben", muscleGroup: "back", equipment: "barbell", location: "gym", level: "advanced", isCompound: true },
  { id: "9", slug: "db-curl", name: "Curl", muscleGroup: "biceps", equipment: "dumbbell", location: "both", level: "beginner", isCompound: false },
  { id: "10", slug: "lunge", name: "Ausfallschritt", muscleGroup: "legs", equipment: "bodyweight", location: "both", level: "beginner", isCompound: true },
];

const p1 = generatePlan({
  goalType: "build_muscle", experienceLevel: "beginner",
  trainingLocation: "home", homeEquipment: "none",
  daysPerWeek: 3, minutesPerSession: 30, catalog,
});
check("Plan 3 Tage (Anfänger → Ganzkörper)", p1.days.length === 3, p1.name);
check("Übungen pro Tag im Rahmen (Anfänger, 30 Min → 4)",
  p1.days.every((d) => d.exercises.length === 4),
  p1.days.map((d) => d.exercises.length).join(","));
const dumbbellIds = new Set(["1", "4", "9"]);
check("Keine Kurzhantel-Übungen bei 'home/none'",
  p1.days.every((d) => d.exercises.every((e) => !dumbbellIds.has(e.exerciseId))));

const p2 = generatePlan({
  goalType: "strength", experienceLevel: "advanced",
  trainingLocation: "gym", homeEquipment: null,
  daysPerWeek: 5, minutesPerSession: 60, catalog,
});
check("Plan 5 Tage (PPL + Ober/Unter)", p2.days.length === 5, p2.name);
check("Strength-Schema: Grundübung 4×5/150s",
  p2.days.some((d) => d.exercises.some((e) => e.targetSets === 4 && e.targetReps === 5 && e.targetRestSec === 150)));

const p3 = generatePlan({
  goalType: "get_fit", experienceLevel: "beginner",
  trainingLocation: "gym", homeEquipment: null,
  daysPerWeek: 2, minutesPerSession: 20, catalog,
});
check("Plan 2 Tage (Ganzkörper A/B), 3 Übungen bei 20 Min",
  p3.days.length === 2 && p3.days.every((d) => d.exercises.length === 3),
  p3.days.map((d) => `${d.title}:${d.exercises.length}`).join(" | "));

/* --- Zod --- */
const validInput = {
  goalChoice: "build_muscle", displayName: "QA Tester", sex: "male",
  birthDate: "2003-05-12", heightCm: "180", weightKg: "82,5",
  waistCm: "90", armCm: "35", experienceLevel: "beginner",
  trainingLocation: "home", homeEquipment: "none",
  daysPerWeek: 3, minutesPerSession: 30, preferredDays: [1, 3, 5],
  nutritionStyle: "halal", trackingMode: "simple",
  hasLimitations: false, limitations: "", disclaimerAccepted: true,
};
const valid = onboardingSchema.safeParse(validInput);
check("Zod akzeptiert gültige Eingaben (inkl. Komma '82,5')",
  valid.success && valid.data.weightKg === 82.5,
  valid.success ? `weightKg=${valid.data.weightKg}` : valid.error.issues[0]?.message);

const noDisclaimer = onboardingSchema.safeParse({ ...validInput, disclaimerAccepted: false });
check("Zod blockt ohne Disclaimer", !noDisclaimer.success);

const tooYoung = onboardingSchema.safeParse({ ...validInput, birthDate: "2015-01-01" });
check("Zod blockt unplausibles Alter (<16)", !tooYoung.success);

const limitationMissing = onboardingSchema.safeParse({ ...validInput, hasLimitations: true, limitations: "" });
check("Zod verlangt Beschreibung bei Einschränkung=Ja", !limitationMissing.success);

console.log(failures === 0 ? "\nALLE TESTS BESTANDEN" : `\n${failures} TEST(S) FEHLGESCHLAGEN`);
process.exit(failures === 0 ? 0 : 1);
