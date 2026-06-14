/**
 * Phase 15 — Smoke-Test: Coach Foundation
 *
 * Testet die reinen Coach-Regel-Funktionen (kein DB, kein Server).
 * Aufruf: npx tsx scripts/qa-phase15-coach-foundation.ts
 */

import {
  getTodayHints,
  getTeamHints,
  getChallengeHints,
  getWeekHints,
  generateAllCoachHints,
  type TodayCoachInput,
  type TeamCoachInput,
  type ChallengeCoachInput,
  type WeekCoachInput,
} from "../src/lib/coach/coach-rules";

/* ------------------------------------------------------------------ */
/* Hilfsfunktionen                                                    */
/* ------------------------------------------------------------------ */

let passed = 0;
let failed = 0;

function ok(label: string, cond: boolean) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

function section(title: string) {
  console.log(`\n── ${title}`);
}

/* ------------------------------------------------------------------ */
/* Datenschutz-Invarianten                                            */
/* ------------------------------------------------------------------ */

const BANNED_TERMS = [
  "kg", "kilo", "gramm", "protein", "kalorien", "kcal",
  "bauchumfang", "armumfang", "gewicht", "diät", "bmi",
  "versagt", "versagen", "schlecht", "faul", "scham",
];

function checkPrivacy(hints: ReturnType<typeof getTodayHints>, label: string) {
  for (const hint of hints) {
    for (const term of BANNED_TERMS) {
      ok(
        `${label}: kein "${term}" in Hint "${hint.id}"`,
        !hint.text.toLowerCase().includes(term),
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/* Heute-Coach                                                        */
/* ------------------------------------------------------------------ */

section("Heute-Coach");

const nothingInput: TodayCoachInput = {
  workoutDone: false,
  nutritionLogged: false,
  waterGoalReached: false,
  stepsGoalReached: false,
  habitsCompleted: 0,
  checkinDoneThisWeek: false,
};

const allDoneInput: TodayCoachInput = {
  workoutDone: true,
  nutritionLogged: true,
  waterGoalReached: true,
  stepsGoalReached: true,
  habitsCompleted: 2,
  checkinDoneThisWeek: true,
};

const partialInput: TodayCoachInput = {
  workoutDone: true,
  nutritionLogged: false,
  waterGoalReached: false,
  stepsGoalReached: true,
  habitsCompleted: 1,
  checkinDoneThisWeek: false,
};

const nothingHints = getTodayHints(nothingInput);
ok("Nichts erledigt → today_nothing_done vorhanden", nothingHints.some((h) => h.id === "today_nothing_done"));
ok("Nichts erledigt → kein today_all_done", !nothingHints.some((h) => h.id === "today_all_done"));
ok("Nichts erledigt → check-in open Hint vorhanden", nothingHints.some((h) => h.id === "today_checkin_open"));
ok("Nichts erledigt → Hints sind nicht leer", nothingHints.length > 0);

const allDoneHints = getTodayHints(allDoneInput);
ok("Alles erledigt → today_all_done vorhanden", allDoneHints.some((h) => h.id === "today_all_done"));
ok("Alles erledigt → kein today_nothing_done", !allDoneHints.some((h) => h.id === "today_nothing_done"));
ok("Alles erledigt → checkin_done vorhanden", allDoneHints.some((h) => h.id === "today_checkin_done"));
ok("Alles erledigt → kein workout_open", !allDoneHints.some((h) => h.id === "today_workout_open"));

const partialHints = getTodayHints(partialInput);
ok("Teilweise → workout_done vorhanden", partialHints.some((h) => h.id === "today_workout_done"));
ok("Teilweise → nutrition_open vorhanden", partialHints.some((h) => h.id === "today_nutrition_open"));
ok("Teilweise → kein today_all_done", !partialHints.some((h) => h.id === "today_all_done"));
ok("Teilweise → checkin_open vorhanden (nicht erledigt)", partialHints.some((h) => h.id === "today_checkin_open"));

checkPrivacy(nothingHints, "Heute/nichts");
checkPrivacy(allDoneHints, "Heute/alles");
checkPrivacy(partialHints, "Heute/partiell");

/* ------------------------------------------------------------------ */
/* Team-Coach                                                         */
/* ------------------------------------------------------------------ */

section("Team-Coach");

const noTeamInput: TeamCoachInput = {
  hasTeam: false,
  memberCount: 0,
  inactiveMembersToday: 0,
  allMembersActive: false,
};

const soloTeamInput: TeamCoachInput = {
  hasTeam: true,
  memberCount: 1,
  inactiveMembersToday: 0,
  allMembersActive: false,
};

const allActiveInput: TeamCoachInput = {
  hasTeam: true,
  memberCount: 4,
  inactiveMembersToday: 0,
  allMembersActive: true,
};

const someInactiveInput: TeamCoachInput = {
  hasTeam: true,
  memberCount: 4,
  inactiveMembersToday: 2,
  allMembersActive: false,
};

const noTeamHints = getTeamHints(noTeamInput);
ok("Kein Team → team_no_team Hint", noTeamHints.some((h) => h.id === "team_no_team"));
ok("Kein Team → genau 1 Hint", noTeamHints.length === 1);

const soloHints = getTeamHints(soloTeamInput);
ok("Solo-Team → team_solo Hint", soloHints.some((h) => h.id === "team_solo"));

const allActiveHints = getTeamHints(allActiveInput);
ok("Alle aktiv → team_all_active Hint", allActiveHints.some((h) => h.id === "team_all_active"));

const someInactiveHints = getTeamHints(someInactiveInput);
ok("Einige inaktiv → team_inactive_members Hint", someInactiveHints.some((h) => h.id === "team_inactive_members"));
ok("Inaktiv-Text enthält Zahl 2", someInactiveHints.find((h) => h.id === "team_inactive_members")?.text.includes("2") ?? false);

checkPrivacy(noTeamHints, "Team/kein-Team");
checkPrivacy(allActiveHints, "Team/alle-aktiv");
checkPrivacy(someInactiveHints, "Team/einige-inaktiv");

/* ------------------------------------------------------------------ */
/* Challenge-Coach                                                    */
/* ------------------------------------------------------------------ */

section("Challenge-Coach");

const noChallengeInput: ChallengeCoachInput = {
  hasChallenge: false,
  isActive: false,
  challengeTitle: null,
  daysRemaining: null,
  ownRank: null,
  totalMembers: 3,
  ownOpenSourceCount: 3,
};

const activeLongInput: ChallengeCoachInput = {
  hasChallenge: true,
  isActive: true,
  challengeTitle: "Sommerkampagne",
  daysRemaining: 14,
  ownRank: 2,
  totalMembers: 4,
  ownOpenSourceCount: 2,
};

const activeFinalDayInput: ChallengeCoachInput = {
  hasChallenge: true,
  isActive: true,
  challengeTitle: "Sommerkampagne",
  daysRemaining: 0,
  ownRank: 1,
  totalMembers: 4,
  ownOpenSourceCount: 0,
};

const finishedChallengeInput: ChallengeCoachInput = {
  hasChallenge: true,
  isActive: false,
  challengeTitle: "Frühjahrschallenge",
  daysRemaining: null,
  ownRank: 1,
  totalMembers: 3,
  ownOpenSourceCount: 0,
};

const noChallengeHints = getChallengeHints(noChallengeInput);
ok("Keine Challenge → challenge_none Hint", noChallengeHints.some((h) => h.id === "challenge_none"));

const activeLongHints = getChallengeHints(activeLongInput);
ok("Aktiv, 14 Tage → challenge_active Hint", activeLongHints.some((h) => h.id === "challenge_active"));
ok("Aktiv, Rang 2, offene Punkte → challenge_rank_open", activeLongHints.some((h) => h.id === "challenge_rank_open"));

const finalDayHints = getChallengeHints(activeFinalDayInput);
ok("Letzter Tag → challenge_last_day", finalDayHints.some((h) => h.id === "challenge_last_day"));
ok("Letzter Tag + Rang 1 → challenge_rank_first", finalDayHints.some((h) => h.id === "challenge_rank_first"));

const finishedHints = getChallengeHints(finishedChallengeInput);
ok("Abgeschlossen → challenge_finished", finishedHints.some((h) => h.id === "challenge_finished"));

checkPrivacy(noChallengeHints, "Challenge/keine");
checkPrivacy(activeLongHints, "Challenge/aktiv-lang");
checkPrivacy(finalDayHints, "Challenge/letzter-tag");
checkPrivacy(finishedHints, "Challenge/abgeschlossen");

/* ------------------------------------------------------------------ */
/* Wochen-Coach                                                       */
/* ------------------------------------------------------------------ */

section("Wochen-Coach");

const emptyWeekInput: WeekCoachInput = {
  activeDaysCount: 0,
  workoutCount: 0,
  nutritionDaysCount: 0,
  stepsGoalDays: 0,
  checkinDoneThisWeek: false,
  daysElapsedInWeek: 3,
};

const goodWeekInput: WeekCoachInput = {
  activeDaysCount: 5,
  workoutCount: 3,
  nutritionDaysCount: 5,
  stepsGoalDays: 4,
  checkinDoneThisWeek: true,
  daysElapsedInWeek: 6,
};

const mondayInput: WeekCoachInput = {
  activeDaysCount: 0,
  workoutCount: 0,
  nutritionDaysCount: 0,
  stepsGoalDays: 0,
  checkinDoneThisWeek: false,
  daysElapsedInWeek: 1, // Montag: kein Nudge für 0 aktive Tage
};

const emptyWeekHints = getWeekHints(emptyWeekInput);
ok("Leere Woche (Tag 3) → week_no_active_days", emptyWeekHints.some((h) => h.id === "week_no_active_days"));
ok("Leere Woche → week_no_workouts (Tag 3)", emptyWeekHints.some((h) => h.id === "week_no_workouts"));
ok("Leere Woche → week_checkin_open", emptyWeekHints.some((h) => h.id === "week_checkin_open"));

const goodWeekHints = getWeekHints(goodWeekInput);
ok("Gute Woche → week_many_active_days", goodWeekHints.some((h) => h.id === "week_many_active_days"));
ok("Gute Woche → week_good_workouts", goodWeekHints.some((h) => h.id === "week_good_workouts"));
ok("Gute Woche → week_good_nutrition", goodWeekHints.some((h) => h.id === "week_good_nutrition"));
ok("Gute Woche → week_checkin_done", goodWeekHints.some((h) => h.id === "week_checkin_done"));

const mondayHints = getWeekHints(mondayInput);
ok("Montag, nichts → KEIN week_no_active_days (zu früh)", !mondayHints.some((h) => h.id === "week_no_active_days"));

checkPrivacy(emptyWeekHints, "Woche/leer");
checkPrivacy(goodWeekHints, "Woche/gut");

/* ------------------------------------------------------------------ */
/* generateAllCoachHints                                              */
/* ------------------------------------------------------------------ */

section("generateAllCoachHints — Kombiniert");

const allHints = generateAllCoachHints({
  today: allDoneInput,
  team: allActiveInput,
  challenge: activeLongInput,
  week: goodWeekInput,
});

ok("Alle Sektionen vorhanden", ["heute", "team", "challenge", "woche"].every(
  (s) => allHints.some((h) => h.section === s),
));
ok("Keine doppelten IDs", new Set(allHints.map((h) => h.id)).size === allHints.length);
ok("Alle Tone-Werte gültig", allHints.every((h) => ["positive", "neutral", "nudge"].includes(h.tone)));
ok("Alle IDs nicht-leer", allHints.every((h) => h.id.length > 0));
ok("Alle Texte nicht-leer", allHints.every((h) => h.text.trim().length > 0));

checkPrivacy(allHints, "All-Combined");

/* ------------------------------------------------------------------ */
/* Ergebnis                                                           */
/* ------------------------------------------------------------------ */

console.log(`\n══ Phase 15 Coach Foundation: ${passed} bestanden, ${failed} fehlgeschlagen`);
if (failed > 0) {
  process.exit(1);
}
