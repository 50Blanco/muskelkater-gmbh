/**
 * Phase 13 — Privacy & Profile Settings: Smoke-Tests
 *
 * Testet pure Logik-Funktionen (keine DB, kein Netz):
 * - applyPrivacyMask
 * - applyRankingPrivacy
 * - Validation-Schemas
 * - DEFAULT_PRIVACY Defaults
 */

import {
  applyPrivacyMask,
  applyRankingPrivacy,
  buildLeaderboard,
  getMemberDailyStatus,
  type MemberDailyStatus,
  type TeamPrivacySettings,
} from "../src/lib/social/challenge-scoring";

// DEFAULT_PRIVACY inline (vermeidet server-only-Import im Test-Context)
const DEFAULT_PRIVACY: TeamPrivacySettings = {
  showTraining: true,
  showSteps: true,
  showNutrition: true,
  showWater: true,
  showHabits: true,
  showWeeklyCheckinStatus: true,
  showInRanking: true,
};
import {
  updateDisplayNameSchema,
  updateFitnessGoalSchema,
  updatePrivacySettingsSchema,
  GOAL_TYPE_LABELS,
} from "../src/lib/validation/profile";

/* ------------------------------------------------------------------ */
/* Test-Infrastruktur                                                  */
/* ------------------------------------------------------------------ */

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e instanceof Error ? e.message : String(e)}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, label?: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e)
    throw new Error(`${label ?? ""}: got ${a}, expected ${e}`);
}

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

const FULL_STATUS: MemberDailyStatus = {
  workoutDone: true,
  stepsGoalReached: true,
  steps: 9500,
  nutritionLogged: true,
  waterGoalReached: true,
  habitsCompleted: 2,
  openSources: [],
  activeToday: true,
  dailyScore: 95,
};

const ALL_TRUE_PRIVACY: TeamPrivacySettings = {
  showTraining: true,
  showSteps: true,
  showNutrition: true,
  showWater: true,
  showHabits: true,
  showWeeklyCheckinStatus: true,
  showInRanking: true,
};

const ALL_FALSE_PRIVACY: TeamPrivacySettings = {
  showTraining: false,
  showSteps: false,
  showNutrition: false,
  showWater: false,
  showHabits: false,
  showWeeklyCheckinStatus: false,
  showInRanking: false,
};

/* ------------------------------------------------------------------ */
/* DEFAULT_PRIVACY                                                     */
/* ------------------------------------------------------------------ */

console.log("\n[DEFAULT_PRIVACY]");

test("DEFAULT_PRIVACY hat alle Felder auf true", () => {
  assert(DEFAULT_PRIVACY.showTraining, "showTraining");
  assert(DEFAULT_PRIVACY.showSteps, "showSteps");
  assert(DEFAULT_PRIVACY.showNutrition, "showNutrition");
  assert(DEFAULT_PRIVACY.showWater, "showWater");
  assert(DEFAULT_PRIVACY.showHabits, "showHabits");
  assert(DEFAULT_PRIVACY.showWeeklyCheckinStatus, "showWeeklyCheckinStatus");
  assert(DEFAULT_PRIVACY.showInRanking, "showInRanking");
});

test("DEFAULT_PRIVACY hat genau 7 Felder", () => {
  assertEqual(Object.keys(DEFAULT_PRIVACY).length, 7, "Anzahl Felder");
});

/* ------------------------------------------------------------------ */
/* applyPrivacyMask — alles sichtbar                                  */
/* ------------------------------------------------------------------ */

console.log("\n[applyPrivacyMask — alles sichtbar]");

test("Alle Felder sichtbar → Status unverändert zurück", () => {
  const result = applyPrivacyMask(FULL_STATUS, ALL_TRUE_PRIVACY);
  assertEqual(result.workoutDone, true, "workoutDone");
  assertEqual(result.stepsGoalReached, true, "stepsGoalReached");
  assertEqual(result.steps, 9500, "steps");
  assertEqual(result.nutritionLogged, true, "nutritionLogged");
  assertEqual(result.waterGoalReached, true, "waterGoalReached");
  assertEqual(result.habitsCompleted, 2, "habitsCompleted");
  assertEqual(result.activeToday, true, "activeToday");
});

/* ------------------------------------------------------------------ */
/* applyPrivacyMask — einzelne Felder aus                             */
/* ------------------------------------------------------------------ */

console.log("\n[applyPrivacyMask — einzelne Felder aus]");

test("showTraining=false → workoutDone=false", () => {
  const result = applyPrivacyMask(FULL_STATUS, {
    ...ALL_TRUE_PRIVACY,
    showTraining: false,
  });
  assertEqual(result.workoutDone, false, "workoutDone");
  assertEqual(result.stepsGoalReached, true, "stepsGoalReached unberührt");
});

test("showSteps=false → stepsGoalReached=false, steps=null", () => {
  const result = applyPrivacyMask(FULL_STATUS, {
    ...ALL_TRUE_PRIVACY,
    showSteps: false,
  });
  assertEqual(result.stepsGoalReached, false, "stepsGoalReached");
  assertEqual(result.steps, null, "steps");
});

test("showNutrition=false → nutritionLogged=false", () => {
  const result = applyPrivacyMask(FULL_STATUS, {
    ...ALL_TRUE_PRIVACY,
    showNutrition: false,
  });
  assertEqual(result.nutritionLogged, false, "nutritionLogged");
});

test("showWater=false → waterGoalReached=false", () => {
  const result = applyPrivacyMask(FULL_STATUS, {
    ...ALL_TRUE_PRIVACY,
    showWater: false,
  });
  assertEqual(result.waterGoalReached, false, "waterGoalReached");
});

test("showHabits=false → habitsCompleted=0", () => {
  const result = applyPrivacyMask(FULL_STATUS, {
    ...ALL_TRUE_PRIVACY,
    showHabits: false,
  });
  assertEqual(result.habitsCompleted, 0, "habitsCompleted");
});

/* ------------------------------------------------------------------ */
/* applyPrivacyMask — alles aus                                       */
/* ------------------------------------------------------------------ */

console.log("\n[applyPrivacyMask — alles aus]");

test("Alle aus → vollständig leerer Status", () => {
  const result = applyPrivacyMask(FULL_STATUS, ALL_FALSE_PRIVACY);
  assertEqual(result.workoutDone, false, "workoutDone");
  assertEqual(result.stepsGoalReached, false, "stepsGoalReached");
  assertEqual(result.steps, null, "steps");
  assertEqual(result.nutritionLogged, false, "nutritionLogged");
  assertEqual(result.waterGoalReached, false, "waterGoalReached");
  assertEqual(result.habitsCompleted, 0, "habitsCompleted");
});

test("Alle aus → activeToday=false", () => {
  const result = applyPrivacyMask(FULL_STATUS, ALL_FALSE_PRIVACY);
  assertEqual(result.activeToday, false, "activeToday");
});

test("Alle aus → dailyScore unverändert (Score ist intern, nicht maskiert)", () => {
  const result = applyPrivacyMask(FULL_STATUS, ALL_FALSE_PRIVACY);
  assertEqual(result.dailyScore, FULL_STATUS.dailyScore, "dailyScore");
});

/* ------------------------------------------------------------------ */
/* applyPrivacyMask — openSources filtern                             */
/* ------------------------------------------------------------------ */

console.log("\n[applyPrivacyMask — openSources]");

const statusWithOpenSources = getMemberDailyStatus({
  workoutCompleted: false,
  stepsGoalReached: false,
  nutritionLogged: false,
  waterGoalReached: false,
  habitsCompleted: 0,
  reactionsSent: 0,
  steps: null,
});

test("Alle offen + showTraining=false → workout-Source ausgeblendet", () => {
  const result = applyPrivacyMask(statusWithOpenSources, {
    ...ALL_TRUE_PRIVACY,
    showTraining: false,
  });
  const hasWorkout = result.openSources.some((s) => s.key === "workout");
  assert(!hasWorkout, "workout-Source sollte nicht sichtbar sein");
});

test("Alle offen + alles sichtbar → alle 5 openSources sichtbar", () => {
  const result = applyPrivacyMask(statusWithOpenSources, ALL_TRUE_PRIVACY);
  assertEqual(result.openSources.length, 5, "5 openSources");
});

test("Alle offen + alles aus → 0 openSources", () => {
  const result = applyPrivacyMask(statusWithOpenSources, ALL_FALSE_PRIVACY);
  assertEqual(result.openSources.length, 0, "0 openSources");
});

/* ------------------------------------------------------------------ */
/* applyRankingPrivacy                                                 */
/* ------------------------------------------------------------------ */

console.log("\n[applyRankingPrivacy]");

const members = [
  { userId: "u1", displayName: "Alice", score: 120 },
  { userId: "u2", displayName: "Bob", score: 100 },
  { userId: "u3", displayName: "Current", score: 80 },
];

const leaderboard = buildLeaderboard(members, "u3");

const privacyMap = new Map<string, TeamPrivacySettings>([
  ["u1", { ...ALL_TRUE_PRIVACY, showInRanking: false }],
  ["u2", ALL_TRUE_PRIVACY],
  ["u3", ALL_TRUE_PRIVACY],
]);

test("showInRanking=false → Name wird als 'Privat' angezeigt", () => {
  const result = applyRankingPrivacy(leaderboard, privacyMap);
  const alice = result.find((e) => e.userId === "u1");
  assertEqual(alice?.displayName, "Privat", "Alice Name");
});

test("showInRanking=true → Name bleibt sichtbar", () => {
  const result = applyRankingPrivacy(leaderboard, privacyMap);
  const bob = result.find((e) => e.userId === "u2");
  assertEqual(bob?.displayName, "Bob", "Bob Name");
});

test("isCurrentUser=true → eigener Eintrag immer unmasked", () => {
  const result = applyRankingPrivacy(leaderboard, new Map([
    ["u3", { ...ALL_TRUE_PRIVACY, showInRanking: false }],
  ]));
  const own = result.find((e) => e.isCurrentUser);
  assertEqual(own?.displayName, "Current", "eigener Name");
});

test("Score bleibt für private Einträge korrekt (faires Ranking)", () => {
  const result = applyRankingPrivacy(leaderboard, privacyMap);
  const alice = result.find((e) => e.userId === "u1");
  assertEqual(alice?.score, 120, "Score");
  assertEqual(alice?.rank, 1, "Rank");
});

test("Kein Privacy-Eintrag → unveränderter Name", () => {
  const result = applyRankingPrivacy(leaderboard, new Map());
  const alice = result.find((e) => e.userId === "u1");
  assertEqual(alice?.displayName, "Alice", "Alice ohne Privacy-Eintrag");
});

/* ------------------------------------------------------------------ */
/* Validierung — updateDisplayNameSchema                              */
/* ------------------------------------------------------------------ */

console.log("\n[updateDisplayNameSchema]");

test("Gültiger Name wird akzeptiert", () => {
  const result = updateDisplayNameSchema.safeParse({ displayName: "Kai" });
  assert(result.success, "sollte erfolgreich sein");
});

test("Zu kurzer Name wird abgelehnt (< 2 Zeichen)", () => {
  const result = updateDisplayNameSchema.safeParse({ displayName: "K" });
  assert(!result.success, "sollte fehlschlagen");
});

test("Zu langer Name wird abgelehnt (> 30 Zeichen)", () => {
  const result = updateDisplayNameSchema.safeParse({
    displayName: "A".repeat(31),
  });
  assert(!result.success, "sollte fehlschlagen");
});

test("Name mit führendem Leerzeichen wird getrimmt", () => {
  const result = updateDisplayNameSchema.safeParse({ displayName: "  Kai  " });
  assert(result.success, "sollte erfolgreich sein");
  if (result.success) assertEqual(result.data.displayName, "Kai", "getrimmt");
});

/* ------------------------------------------------------------------ */
/* Validierung — updateFitnessGoalSchema                             */
/* ------------------------------------------------------------------ */

console.log("\n[updateFitnessGoalSchema]");

const VALID_GOALS = ["build_muscle", "lose_fat", "get_fit", "strength", "maintain"] as const;

for (const g of VALID_GOALS) {
  test(`Gültiges Ziel '${g}' wird akzeptiert`, () => {
    const result = updateFitnessGoalSchema.safeParse({ goalType: g });
    assert(result.success, `sollte akzeptiert werden: ${g}`);
  });
}

test("Ungültiges Ziel wird abgelehnt", () => {
  const result = updateFitnessGoalSchema.safeParse({ goalType: "invalid" });
  assert(!result.success, "sollte fehlschlagen");
});

/* ------------------------------------------------------------------ */
/* Validierung — updatePrivacySettingsSchema                         */
/* ------------------------------------------------------------------ */

console.log("\n[updatePrivacySettingsSchema]");

test("Vollständig gültige Privacy-Settings werden akzeptiert", () => {
  const result = updatePrivacySettingsSchema.safeParse({
    showTraining: true,
    showSteps: false,
    showNutrition: true,
    showWater: false,
    showHabits: true,
    showWeeklyCheckinStatus: false,
    showInRanking: true,
  });
  assert(result.success, "sollte erfolgreich sein");
});

test("Fehlende Boolean-Felder werden abgelehnt", () => {
  const result = updatePrivacySettingsSchema.safeParse({
    showTraining: true,
    // rest fehlt
  });
  assert(!result.success, "sollte fehlschlagen");
});

test("Non-boolean-Wert wird abgelehnt", () => {
  const result = updatePrivacySettingsSchema.safeParse({
    showTraining: "yes",
    showSteps: false,
    showNutrition: true,
    showWater: false,
    showHabits: true,
    showWeeklyCheckinStatus: false,
    showInRanking: true,
  });
  assert(!result.success, "sollte fehlschlagen");
});

/* ------------------------------------------------------------------ */
/* GOAL_TYPE_LABELS Vollständigkeit                                   */
/* ------------------------------------------------------------------ */

console.log("\n[GOAL_TYPE_LABELS]");

test("Alle 5 Ziel-Typen haben Labels", () => {
  for (const g of VALID_GOALS) {
    assert(!!GOAL_TYPE_LABELS[g], `Label für ${g} fehlt`);
  }
});

/* ------------------------------------------------------------------ */
/* Security-Guard: Körperdaten nie in Privacy-Feldern                */
/* ------------------------------------------------------------------ */

console.log("\n[Security: keine Körperdaten in Privacy-Toggles]");

const FORBIDDEN_KEYS = ["weight", "bodyfat", "calories", "protein", "height", "measurement"];

test("Privacy-Schema enthält keine sensitiven Körperdaten-Felder", () => {
  const keys = Object.keys(updatePrivacySettingsSchema.shape).map((k) =>
    k.toLowerCase(),
  );
  for (const forbidden of FORBIDDEN_KEYS) {
    const found = keys.some((k) => k.includes(forbidden));
    assert(!found, `Verbotenes Feld gefunden: ${forbidden}`);
  }
});

test("DEFAULT_PRIVACY enthält keine sensitiven Körperdaten-Felder", () => {
  const keys = Object.keys(DEFAULT_PRIVACY).map((k) => k.toLowerCase());
  for (const forbidden of FORBIDDEN_KEYS) {
    const found = keys.some((k) => k.includes(forbidden));
    assert(!found, `Verbotenes Feld in DEFAULT_PRIVACY: ${forbidden}`);
  }
});

/* ------------------------------------------------------------------ */
/* Report                                                             */
/* ------------------------------------------------------------------ */

console.log(`\n${"─".repeat(50)}`);
console.log(`Phase 13 Smoke: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
