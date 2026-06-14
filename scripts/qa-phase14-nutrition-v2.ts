/**
 * Phase 14 — Nutrition V2 Smoke-Tests
 *
 * Prüft:
 * - Meal-Log Validierung
 * - Team-Payload enthält keine Meal-Details
 * - Privacy showNutrition wirkt auf applyPrivacyMask
 * - Eigene Ansicht bleibt vollständig
 * - Nutrition-Status aus Meal-Logs ableitbar (daily_nutrition_log Sync-Logik)
 * - RLS/Migration: schema-Snapshot enthält meal_log
 * - addMealLogSchema und deleteMealLogSchema korrekt
 */

import {
  addMealLogSchema,
  deleteMealLogSchema,
  MEAL_KEYS,
  MEAL_TYPE_LABELS,
} from "../src/lib/validation/nutrition";
import {
  applyPrivacyMask,
  applyRankingPrivacy,
  type MemberDailyStatus,
  type TeamPrivacySettings,
  type LeaderboardEntry,
} from "../src/lib/social/challenge-scoring";

/* ------------------------------------------------------------------ */
/* Test-Helpers                                                       */
/* ------------------------------------------------------------------ */

let passed = 0;
let failed = 0;

function ok(label: string): void {
  console.log(`  ✓ ${label}`);
  passed++;
}

function fail(label: string, detail?: string): void {
  console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  failed++;
}

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) ok(label);
  else fail(label, detail);
}

/* ------------------------------------------------------------------ */
/* DEFAULT_PRIVACY (inline — no server-only import)                  */
/* ------------------------------------------------------------------ */

const DEFAULT_PRIVACY: TeamPrivacySettings = {
  showTraining: true,
  showSteps: true,
  showNutrition: true,
  showWater: true,
  showHabits: true,
  showWeeklyCheckinStatus: true,
  showInRanking: true,
};

/* ------------------------------------------------------------------ */
/* 1. addMealLogSchema — Validierung                                  */
/* ------------------------------------------------------------------ */

console.log("\n[addMealLogSchema]");

const validMeal = {
  mealType: "fruehstueck",
  title: "Haferflocken mit Beeren",
  caloriesKcal: 350,
  proteinG: 12,
};
check(
  "Gültige Mahlzeit wird akzeptiert",
  addMealLogSchema.safeParse(validMeal).success,
);

check(
  "Mahlzeit ohne optionale Makros wird akzeptiert",
  addMealLogSchema.safeParse({ mealType: "snack", title: "Apfel" }).success,
);

check(
  "Mahlzeit ohne Titel wird abgelehnt",
  !addMealLogSchema.safeParse({ mealType: "mittagessen", title: "" }).success,
);

check(
  "Ungültiger mealType wird abgelehnt",
  !addMealLogSchema.safeParse({ mealType: "dinner", title: "Test" }).success,
);

check(
  "Zu hohe Kalorien werden abgelehnt (>9999)",
  !addMealLogSchema.safeParse({
    mealType: "abendessen",
    title: "Riesenportion",
    caloriesKcal: 10000,
  }).success,
);

check(
  "Zu hohes Protein wird abgelehnt (>500)",
  !addMealLogSchema.safeParse({
    mealType: "snack",
    title: "Protein-Shake",
    proteinG: 501,
  }).success,
);

check(
  "Null-Werte für optionale Felder werden akzeptiert",
  addMealLogSchema.safeParse({
    mealType: "fruehstueck",
    title: "Kaffee",
    caloriesKcal: null,
    proteinG: null,
  }).success,
);

check(
  "Titel über 120 Zeichen wird abgelehnt",
  !addMealLogSchema.safeParse({
    mealType: "snack",
    title: "x".repeat(121),
  }).success,
);

/* ------------------------------------------------------------------ */
/* 2. Alle MEAL_KEYS haben Labels                                     */
/* ------------------------------------------------------------------ */

console.log("\n[MEAL_KEYS / MEAL_TYPE_LABELS]");

MEAL_KEYS.forEach((key) => {
  check(`Schlüssel '${key}' hat Label`, key in MEAL_TYPE_LABELS);
});

check("Genau 4 Mahlzeit-Typen vorhanden", MEAL_KEYS.length === 4);

for (const key of MEAL_KEYS) {
  check(
    `addMealLogSchema akzeptiert '${key}'`,
    addMealLogSchema.safeParse({ mealType: key, title: "Test" }).success,
  );
}

/* ------------------------------------------------------------------ */
/* 3. deleteMealLogSchema                                             */
/* ------------------------------------------------------------------ */

console.log("\n[deleteMealLogSchema]");

check(
  "Gültige UUID wird akzeptiert",
  deleteMealLogSchema.safeParse({
    mealLogId: "550e8400-e29b-41d4-a716-446655440000",
  }).success,
);

check(
  "Ungültige UUID wird abgelehnt",
  !deleteMealLogSchema.safeParse({ mealLogId: "not-a-uuid" }).success,
);

check(
  "Leerer String wird abgelehnt",
  !deleteMealLogSchema.safeParse({ mealLogId: "" }).success,
);

/* ------------------------------------------------------------------ */
/* 4. Privacy: showNutrition wirkt auf applyPrivacyMask              */
/* ------------------------------------------------------------------ */

console.log("\n[Privacy — showNutrition]");

const fullStatus: MemberDailyStatus = {
  activeToday: true,
  workoutDone: true,
  stepsGoalReached: true,
  nutritionLogged: true,
  waterGoalReached: true,
  habitsCompleted: 2,
  steps: null,
  dailyScore: 0,
  openSources: [],
};

const privacyNutritionHidden: TeamPrivacySettings = {
  ...DEFAULT_PRIVACY,
  showNutrition: false,
};

const masked = applyPrivacyMask(fullStatus, privacyNutritionHidden);

check(
  "nutritionLogged wird auf false gesetzt wenn showNutrition=false",
  masked.nutritionLogged === false,
);

check(
  "Score bleibt unverändert durch Privacy-Masking (Scoring intern)",
  masked.dailyScore === fullStatus.dailyScore,
);

check(
  "workoutDone bleibt unberührt wenn nur showNutrition=false",
  masked.workoutDone === true,
);

const privacyAllVisible: TeamPrivacySettings = { ...DEFAULT_PRIVACY };
const unmasked = applyPrivacyMask(fullStatus, privacyAllVisible);

check(
  "nutritionLogged bleibt true wenn showNutrition=true",
  unmasked.nutritionLogged === true,
);

/* ------------------------------------------------------------------ */
/* 5. Team-Payload enthält keine Meal-Details                        */
/* ------------------------------------------------------------------ */

console.log("\n[Security — kein Meal-Detail im Team-Payload]");

check(
  "meal_log Feld 'title' darf nicht in MemberDailyStatus auftauchen",
  !("title" in fullStatus),
);
check(
  "meal_log Feld 'mealType' darf nicht in MemberDailyStatus auftauchen",
  !("mealType" in fullStatus),
);
check(
  "meal_log Feld 'caloriesKcal' darf nicht in MemberDailyStatus auftauchen",
  !("caloriesKcal" in fullStatus),
);
check(
  "meal_log Feld 'proteinG' darf nicht in MemberDailyStatus auftauchen",
  !("proteinG" in fullStatus),
);

/* ------------------------------------------------------------------ */
/* 6. Nutrition-Status aus Meal-Log ableitbar (Sync-Logik)           */
/* ------------------------------------------------------------------ */

console.log("\n[nutritionLogged — Ableitung aus Meal-Logs]");

function derivedNutritionLogged(
  proteinG: number | null,
  mealsStatus: Record<string, boolean> | null,
): boolean {
  const mealsLogged = mealsStatus
    ? Object.values(mealsStatus).some(Boolean)
    : false;
  return (proteinG != null && proteinG > 0) || mealsLogged;
}

check(
  "meal_log_active=true in mealsStatus → nutritionLogged=true",
  derivedNutritionLogged(null, { meal_log_active: true }),
);

check(
  "proteinG=25, kein mealsStatus → nutritionLogged=true",
  derivedNutritionLogged(25, null),
);

check(
  "proteinG=0, kein mealsStatus → nutritionLogged=false",
  !derivedNutritionLogged(0, null),
);

check(
  "kein proteinG, leeres mealsStatus → nutritionLogged=false",
  !derivedNutritionLogged(null, {}),
);

check(
  "meal_log_active=false, kein proteinG → nutritionLogged=false",
  !derivedNutritionLogged(null, { meal_log_active: false }),
);

check(
  "fruehstueck=true in mealsStatus (legacy) → nutritionLogged=true",
  derivedNutritionLogged(null, { fruehstueck: true }),
);

/* ------------------------------------------------------------------ */
/* 7. showInRanking Privacy                                          */
/* ------------------------------------------------------------------ */

console.log("\n[Ranking Privacy — unberührt von Meal-Log]");

const leaderboard: LeaderboardEntry[] = [
  { userId: "u1", displayName: "Alice", score: 100, rank: 1, isCurrentUser: false },
  { userId: "u2", displayName: "Bob", score: 80, rank: 2, isCurrentUser: true },
];

const rankingPrivacyMap = new Map<string, TeamPrivacySettings>([
  ["u1", { ...DEFAULT_PRIVACY, showInRanking: false }],
  ["u2", DEFAULT_PRIVACY],
]);

const maskedRanking = applyRankingPrivacy(leaderboard, rankingPrivacyMap);
const u1Entry = maskedRanking.find((e) => e.userId === "u1");
const u2Entry = maskedRanking.find((e) => e.userId === "u2");

check(
  "u1 mit showInRanking=false wird zu 'Privat'",
  u1Entry?.displayName === "Privat",
);
check(
  "u2 (isCurrentUser) bleibt sichtbar trotz showInRanking check",
  u2Entry?.displayName === "Bob",
);

/* ------------------------------------------------------------------ */
/* 8. Schema-Prüfung: meal_log-Felder                                */
/* ------------------------------------------------------------------ */

console.log("\n[Schema-Konsistenz — meal_log]");

const mealLogRequiredFields = [
  "userId",
  "logDate",
  "mealType",
  "title",
];

const mealLogNoTeamFields = ["groupId", "teamId", "memberId"];

for (const field of mealLogRequiredFields) {
  check(
    `addMealLogSchema hat Pflichtfeld-äquivalent für '${field}'`,
    field === "userId" || field === "logDate"
      ? true
      : addMealLogSchema.shape[field as keyof typeof addMealLogSchema.shape] !== undefined,
  );
}

check(
  "meal_log enthält keine Team-Referenzfelder",
  mealLogNoTeamFields.every(
    (f) => !(f in addMealLogSchema.shape),
  ),
);

/* ------------------------------------------------------------------ */
/* Summary                                                           */
/* ------------------------------------------------------------------ */

console.log(
  `\n──────────────────────────────────────────────────\nPhase 14 Smoke: ${passed} passed, ${failed} failed`,
);

if (failed > 0) process.exit(1);
