/**
 * QA-Smoke-Test für die puren Phase-5-Module:
 * Ernährungs-Validierung (Zod), Progress-Helper, Mahlzeiten, Habits, Berlin-Datum.
 * Reine Logik, keine DB/React.
 *
 * Ausführen: npx tsx scripts/qa-phase5-smoke.ts
 */
import {
  addWaterSchema,
  getProgressPct,
  logProteinSchema,
  MEAL_KEYS,
  toggleHabitSchema,
  toggleMealSchema,
} from "../src/lib/validation/nutrition";
import { getTodayBerlin } from "../src/lib/utils/date";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} — ${label}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
}

/* --- logProtein --- */
check("logProtein: 150 g gültig", logProteinSchema.safeParse({ proteinG: 150 }).success);
check("logProtein: 0 g gültig", logProteinSchema.safeParse({ proteinG: 0 }).success);
check("logProtein: 500 g gültig", logProteinSchema.safeParse({ proteinG: 500 }).success);
check(
  "logProtein: -1 g ungültig",
  !logProteinSchema.safeParse({ proteinG: -1 }).success,
);
check(
  "logProtein: 501 g ungültig",
  !logProteinSchema.safeParse({ proteinG: 501 }).success,
);
check(
  "logProtein: 150.5 ungültig (kein int)",
  !logProteinSchema.safeParse({ proteinG: 150.5 }).success,
);
check(
  "logProtein: Freitext ungültig",
  !logProteinSchema.safeParse({ proteinG: "viel" }).success,
);

/* --- addWater --- */
check("addWater: 100 ml gültig", addWaterSchema.safeParse({ addMl: 100 }).success);
check("addWater: 200 ml gültig", addWaterSchema.safeParse({ addMl: 200 }).success);
check("addWater: 500 ml gültig", addWaterSchema.safeParse({ addMl: 500 }).success);
check("addWater: 750 ml gültig", addWaterSchema.safeParse({ addMl: 750 }).success);
check("addWater: 1000 ml gültig", addWaterSchema.safeParse({ addMl: 1000 }).success);
check(
  "addWater: 0 ml ungültig",
  !addWaterSchema.safeParse({ addMl: 0 }).success,
);
check(
  "addWater: 300 ml ungültig (nicht in Steps)",
  !addWaterSchema.safeParse({ addMl: 300 }).success,
);
check(
  "addWater: Freitext ungültig",
  !addWaterSchema.safeParse({ addMl: "viel" }).success,
);
check(
  "addWater: 200.5 ungültig (kein int)",
  !addWaterSchema.safeParse({ addMl: 200.5 }).success,
);

/* --- toggleMeal --- */
check(
  "toggleMeal: fruehstueck + true gültig",
  toggleMealSchema.safeParse({ mealKey: "fruehstueck", done: true }).success,
);
check(
  "toggleMeal: mittagessen + false gültig",
  toggleMealSchema.safeParse({ mealKey: "mittagessen", done: false }).success,
);
check(
  "toggleMeal: abendessen + true gültig",
  toggleMealSchema.safeParse({ mealKey: "abendessen", done: true }).success,
);
check(
  "toggleMeal: snack + false gültig",
  toggleMealSchema.safeParse({ mealKey: "snack", done: false }).success,
);
check(
  "toggleMeal: ungültiger Key abgelehnt",
  !toggleMealSchema.safeParse({ mealKey: "breakfast", done: true }).success,
);
check(
  "toggleMeal: leerer Key abgelehnt",
  !toggleMealSchema.safeParse({ mealKey: "", done: true }).success,
);

/* --- toggleHabit --- */
const VALID_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
check(
  "toggleHabit: uuid + true gültig",
  toggleHabitSchema.safeParse({ habitId: VALID_UUID, completed: true }).success,
);
check(
  "toggleHabit: uuid + false gültig",
  toggleHabitSchema.safeParse({ habitId: VALID_UUID, completed: false }).success,
);
check(
  "toggleHabit: leere habitId ungültig",
  !toggleHabitSchema.safeParse({ habitId: "", completed: true }).success,
);
check(
  "toggleHabit: kein uuid ungültig",
  !toggleHabitSchema.safeParse({ habitId: "nicht-uuid", completed: true }).success,
);
check(
  "toggleHabit: fehlendes completed ungültig",
  !toggleHabitSchema.safeParse({ habitId: VALID_UUID }).success,
);

/* --- getProgressPct --- */
check("getProgressPct(80, 160) = 50", getProgressPct(80, 160) === 50);
check("getProgressPct(0, 100) = 0", getProgressPct(0, 100) === 0);
check("getProgressPct(100, 100) = 100", getProgressPct(100, 100) === 100);
check("getProgressPct cappt bei 100", getProgressPct(200, 100) === 100);
check("getProgressPct target=0 → 0", getProgressPct(50, 0) === 0);
check("getProgressPct(1, 3) rundet", getProgressPct(1, 3) === 33);

/* --- MEAL_KEYS --- */
check("MEAL_KEYS hat genau 4 Einträge", MEAL_KEYS.length === 4);
check(
  "MEAL_KEYS enthält fruehstueck",
  (MEAL_KEYS as readonly string[]).includes("fruehstueck"),
);
check(
  "MEAL_KEYS enthält mittagessen",
  (MEAL_KEYS as readonly string[]).includes("mittagessen"),
);
check(
  "MEAL_KEYS enthält abendessen",
  (MEAL_KEYS as readonly string[]).includes("abendessen"),
);
check(
  "MEAL_KEYS enthält snack",
  (MEAL_KEYS as readonly string[]).includes("snack"),
);

/* --- getTodayBerlin --- */
const today = getTodayBerlin();
check("getTodayBerlin gibt YYYY-MM-DD zurück", /^\d{4}-\d{2}-\d{2}$/.test(today));
check(
  "getTodayBerlin Monat 01–12",
  (() => {
    const m = parseInt(today.split("-")[1]);
    return m >= 1 && m <= 12;
  })(),
);
check(
  "getTodayBerlin Tag 01–31",
  (() => {
    const d = parseInt(today.split("-")[2]);
    return d >= 1 && d <= 31;
  })(),
);
check(
  "getTodayBerlin Jahr plausibel (>= 2025)",
  parseInt(today.split("-")[0]) >= 2025,
);

console.log(
  failures === 0
    ? "\nALLE TESTS BESTANDEN"
    : `\n${failures} TEST(S) FEHLGESCHLAGEN`,
);
process.exit(failures === 0 ? 0 : 1);
