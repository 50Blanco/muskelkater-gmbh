/**
 * QA Smoke-Tests — Phase 9 Team-Challenge MVP.
 * Reine Logik-Tests (Scoring, Leaderboard, Status, Privacy, Validierung).
 * Keine DB-Verbindung nötig.
 */

import {
  createTeamChallengeSchema,
  updateDailyStepsSchema,
  challengeTitleSchema,
  stakeTextSchema,
  stepsSchema,
  groupIdSchema,
  memberIdSchema,
} from "../src/lib/validation/challenge";
import {
  POINTS,
  HABIT_DAILY_CAP,
  REACTION_DAILY_CAP,
  DEFAULT_STEPS_GOAL,
  calculateDailyScore,
  calculateWeeklyScore,
  isStepsGoalReached,
  getOpenPointSources,
  getMemberDailyStatus,
  buildLeaderboard,
  findOwnRank,
  buildSupportHints,
  buildChallengeLabel,
  getChallengeDaysRemaining,
  daysBetween,
  stripSensitiveFields,
  hasNoSensitiveFields,
  sanitizeSocialMealStatus,
  canViewMemberDetail,
  type DailyScoreInput,
} from "../src/lib/social/challenge-scoring";

let failed = 0;

function assert(description: string, condition: boolean) {
  if (condition) {
    console.log(`PASS — ${description}`);
  } else {
    console.error(`FAIL — ${description}`);
    failed++;
  }
}

const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "abcdef01-2345-4789-abcd-ef0123456789";

const EMPTY_DAY: DailyScoreInput = {
  workoutCompleted: false,
  stepsGoalReached: false,
  nutritionLogged: false,
  waterGoalReached: false,
  habitsCompleted: 0,
  reactionsSent: 0,
};

// ── Challenge-Datum gültig/ungültig ───────────────────────────────────────────

assert(
  "Challenge: Start vor Ende akzeptiert",
  createTeamChallengeSchema.safeParse({
    groupId: UUID_A,
    title: "Sommerform",
    startsOn: "2026-06-01",
    endsOn: "2026-06-30",
  }).success,
);
assert(
  "Challenge: Start == Ende akzeptiert (ein Tag)",
  createTeamChallengeSchema.safeParse({
    groupId: UUID_A,
    title: "Team-Tag",
    startsOn: "2026-06-12",
    endsOn: "2026-06-12",
  }).success,
);
assert(
  "Challenge: Start nach Ende abgewiesen",
  !createTeamChallengeSchema.safeParse({
    groupId: UUID_A,
    title: "Falschrum",
    startsOn: "2026-07-01",
    endsOn: "2026-06-01",
  }).success,
);
assert(
  "Challenge: ungültiges Datumsformat abgewiesen",
  !createTeamChallengeSchema.safeParse({
    groupId: UUID_A,
    title: "Sommerform",
    startsOn: "01.06.2026",
    endsOn: "2026-06-30",
  }).success,
);

// ── Stake-Text optional ───────────────────────────────────────────────────────

assert(
  "Stake: fehlender Einsatz erlaubt (optional)",
  createTeamChallengeSchema.safeParse({
    groupId: UUID_A,
    title: "30 Tage dranbleiben",
    startsOn: "2026-06-01",
    endsOn: "2026-06-30",
  }).success,
);
assert(
  "Stake: Freitext akzeptiert",
  (() => {
    const r = createTeamChallengeSchema.safeParse({
      groupId: UUID_A,
      title: "Sommerform",
      startsOn: "2026-06-01",
      endsOn: "2026-06-30",
      stakeText: "Verlierer gibt Essen aus",
    });
    return r.success && r.data.stakeText === "Verlierer gibt Essen aus";
  })(),
);
assert(
  "Stake: leerer String → undefined",
  (() => {
    const r = stakeTextSchema.safeParse("   ");
    return r.success && r.data === undefined;
  })(),
);
assert(
  "Stake: zu lang (>140) abgewiesen",
  !stakeTextSchema.safeParse("x".repeat(141)).success,
);

// ── Titel gültig/ungültig ─────────────────────────────────────────────────────

assert("Titel 'Sommerform' gültig", challengeTitleSchema.safeParse("Sommerform").success);
assert("Titel 1 Zeichen abgewiesen", !challengeTitleSchema.safeParse("A").success);
assert("Titel 61 Zeichen abgewiesen", !challengeTitleSchema.safeParse("A".repeat(61)).success);
assert(
  "Titel trimmt Leerzeichen",
  (() => {
    const r = challengeTitleSchema.safeParse("  Team-Woche  ");
    return r.success && r.data === "Team-Woche";
  })(),
);

// ── Group-/Member-ID ──────────────────────────────────────────────────────────

assert("groupId: gültige UUID akzeptiert", groupIdSchema.safeParse(UUID_A).success);
assert("groupId: 'nope' abgewiesen", !groupIdSchema.safeParse("nope").success);
assert("memberId: gültige UUID akzeptiert", memberIdSchema.safeParse(UUID_B).success);

// ── Scoring: einzelne Punktequellen ───────────────────────────────────────────

assert(
  "Workout abgeschlossen = +30",
  calculateDailyScore({ ...EMPTY_DAY, workoutCompleted: true }) === POINTS.workout &&
    POINTS.workout === 30,
);
assert(
  "Schritte-Ziel erreicht = +20",
  calculateDailyScore({ ...EMPTY_DAY, stepsGoalReached: true }) === POINTS.steps &&
    POINTS.steps === 20,
);
assert(
  "Ernährung geloggt = +15",
  calculateDailyScore({ ...EMPTY_DAY, nutritionLogged: true }) === POINTS.nutrition &&
    POINTS.nutrition === 15,
);
assert(
  "Wasserziel erreicht = +10",
  calculateDailyScore({ ...EMPTY_DAY, waterGoalReached: true }) === POINTS.water &&
    POINTS.water === 10,
);
assert(
  "1 Habit erledigt = +10",
  calculateDailyScore({ ...EMPTY_DAY, habitsCompleted: 1 }) === POINTS.habit,
);
assert(
  "Voller Tag (alle Signale, 2 Habits, 1 Reaktion) = 30+20+15+10+20+5 = 100",
  calculateDailyScore({
    workoutCompleted: true,
    stepsGoalReached: true,
    nutritionLogged: true,
    waterGoalReached: true,
    habitsCompleted: 2,
    reactionsSent: 1,
  }) === 100,
);

// ── Scoring: Reaktion gedeckelt (Anti-Spam) ───────────────────────────────────

assert(
  "Reaktion 1x = +5",
  calculateDailyScore({ ...EMPTY_DAY, reactionsSent: 1 }) === POINTS.reaction,
);
assert(
  `Reaktionen über Cap (${REACTION_DAILY_CAP}) gedeckelt`,
  calculateDailyScore({ ...EMPTY_DAY, reactionsSent: 99 }) ===
    REACTION_DAILY_CAP * POINTS.reaction,
);
assert(
  `Habits über Cap (${HABIT_DAILY_CAP}) gedeckelt`,
  calculateDailyScore({ ...EMPTY_DAY, habitsCompleted: 99 }) ===
    HABIT_DAILY_CAP * POINTS.habit,
);
assert(
  "Negative/NaN-Werte werden als 0 behandelt",
  calculateDailyScore({ ...EMPTY_DAY, habitsCompleted: -5, reactionsSent: -1 }) === 0,
);

// ── Scoring: keine Punkte aus sensiblen Quellen (strukturell) ─────────────────

assert(
  "DailyScoreInput hat KEIN Gewicht/Kalorien/Protein-Feld",
  (() => {
    const keys = Object.keys(EMPTY_DAY);
    const banned = ["weight", "calories", "kcal", "protein", "bodyfat", "bmi"];
    return !keys.some((k) => banned.some((b) => k.toLowerCase().includes(b)));
  })(),
);

// ── Wochen-Score ──────────────────────────────────────────────────────────────

assert(
  "Wochen-Score = Summe der Tage",
  calculateWeeklyScore([
    { ...EMPTY_DAY, workoutCompleted: true }, // 30
    { ...EMPTY_DAY, nutritionLogged: true }, // 15
    { ...EMPTY_DAY, waterGoalReached: true }, // 10
  ]) === 55,
);
assert("Wochen-Score leer = 0", calculateWeeklyScore([]) === 0);

// ── Steps-Ziel ────────────────────────────────────────────────────────────────

assert("Schrittziel: 8000 erreicht", isStepsGoalReached(8000));
assert("Schrittziel: 7999 nicht erreicht", !isStepsGoalReached(7999));
assert("Schrittziel: null nicht erreicht", !isStepsGoalReached(null));
assert("Default-Schrittziel = 8000", DEFAULT_STEPS_GOAL === 8000);

// ── Offene Punktequellen / Tagesstatus ────────────────────────────────────────

assert(
  "Leerer Tag: 5 offene Quellen",
  getOpenPointSources(EMPTY_DAY).length === 5,
);
assert(
  "Voller Tag: keine offenen Quellen",
  getOpenPointSources({
    workoutCompleted: true,
    stepsGoalReached: true,
    nutritionLogged: true,
    waterGoalReached: true,
    habitsCompleted: 1,
    reactionsSent: 0,
  }).length === 0,
);
assert(
  "Tagesstatus: leerer Tag ist nicht aktiv",
  getMemberDailyStatus({ ...EMPTY_DAY, steps: null }).activeToday === false,
);
assert(
  "Tagesstatus: Workout macht aktiv",
  getMemberDailyStatus({ ...EMPTY_DAY, workoutCompleted: true, steps: 5000 })
    .activeToday === true,
);
assert(
  "Tagesstatus: Schritte werden durchgereicht",
  getMemberDailyStatus({ ...EMPTY_DAY, steps: 8200 }).steps === 8200,
);

// ── Leaderboard-Sortierung ────────────────────────────────────────────────────

const lbBoard = buildLeaderboard(
  [
    { userId: "u1", displayName: "Akram", score: 120 },
    { userId: "u2", displayName: "Ewa", score: 200 },
    { userId: "u3", displayName: "Rachid", score: 60 },
  ],
  "u1",
);
assert("Leaderboard: höchster Score zuerst", lbBoard[0].userId === "u2");
assert("Leaderboard: Ränge 1,2,3", lbBoard.map((e) => e.rank).join(",") === "1,2,3");
assert(
  "Leaderboard: aktueller Nutzer markiert",
  lbBoard.find((e) => e.userId === "u1")?.isCurrentUser === true,
);
assert("Leaderboard: eigener Rang via findOwnRank", findOwnRank(lbBoard)?.userId === "u1");

// ── Leaderboard: Gleichstand teilt Rang (Soft-Ranking) ────────────────────────

const lbTie = buildLeaderboard(
  [
    { userId: "a", displayName: "Anna", score: 100 },
    { userId: "b", displayName: "Bea", score: 100 },
    { userId: "c", displayName: "Cem", score: 50 },
  ],
  "a",
);
assert(
  "Tie: gleicher Score teilt Rang 1, nächster ist Rang 3 (Competition Ranking)",
  lbTie[0].rank === 1 && lbTie[1].rank === 1 && lbTie[2].rank === 3,
);
assert(
  "Tie: alphabetisch stabil sortiert (Anna vor Bea)",
  lbTie[0].displayName === "Anna" && lbTie[1].displayName === "Bea",
);

// ── Support-Hinweise ──────────────────────────────────────────────────────────

const hints = buildSupportHints([
  { userId: "me", displayName: "Ich", activeToday: false, isCurrentUser: true },
  { userId: "x", displayName: "Ewa", activeToday: false, isCurrentUser: false },
  { userId: "y", displayName: "Rachid", activeToday: true, isCurrentUser: false },
]);
assert("Support: nur inaktives Teammitglied bekommt Nudge", hints.length === 1);
assert("Support: Nudge betrifft Ewa", hints[0].displayName === "Ewa" && hints[0].tone === "nudge");
assert(
  "Support: man selbst wird nie genudged",
  !hints.some((h) => h.userId === "me"),
);
assert(
  "Support: alle aktiv → Feier-Hinweis statt Nudge",
  (() => {
    const h = buildSupportHints([
      { userId: "me", displayName: "Ich", activeToday: true, isCurrentUser: true },
      { userId: "x", displayName: "Ewa", activeToday: true, isCurrentUser: false },
    ]);
    return h.length === 1 && h[0].tone === "celebrate";
  })(),
);
assert(
  "Support: Solo-Team (nur ich) → keine Hinweise",
  buildSupportHints([
    { userId: "me", displayName: "Ich", activeToday: false, isCurrentUser: true },
  ]).length === 0,
);
assert(
  "Support: Sprache ist unterstützend, nicht beschämend",
  !hints.some((h) =>
    ["verloren", "letzter", "schwach", "faul", "loser"].some((bad) =>
      h.message.toLowerCase().includes(bad),
    ),
  ),
);

// ── Challenge-Label / Restdauer ───────────────────────────────────────────────

assert("daysBetween: 12 Tage", daysBetween("2026-06-12", "2026-06-24") === 12);
assert("daysBetween: rückwärts negativ", daysBetween("2026-06-24", "2026-06-12") === -12);
assert(
  "Label: laufend → 'noch 12 Tage'",
  buildChallengeLabel(
    { title: "Sommerform", startsOn: "2026-06-01", endsOn: "2026-06-24", status: "active" },
    "2026-06-12",
  ) === "Sommerform · noch 12 Tage",
);
assert(
  "Label: letzter Tag",
  buildChallengeLabel(
    { title: "Team-Woche", startsOn: "2026-06-06", endsOn: "2026-06-12", status: "active" },
    "2026-06-12",
  ) === "Team-Woche · letzter Tag",
);
assert(
  "Label: abgeschlossen-Status",
  buildChallengeLabel(
    { title: "Sommerform", startsOn: "2026-06-01", endsOn: "2026-06-24", status: "completed" },
    "2026-06-12",
  ) === "Sommerform · abgeschlossen",
);
assert(
  "Label: Enddatum überschritten → abgeschlossen",
  buildChallengeLabel(
    { title: "Sommerform", startsOn: "2026-05-01", endsOn: "2026-06-01", status: "active" },
    "2026-06-12",
  ) === "Sommerform · abgeschlossen",
);
assert(
  "Restdauer: heute=Ende → 0",
  getChallengeDaysRemaining("2026-06-12", "2026-06-12") === 0,
);

// ── Privacy-Mapper entfernt sensible Felder ───────────────────────────────────

const memberPayload = {
  displayName: "Akram",
  steps: 8200,
  workoutDone: true,
  weightKg: 82.5,
  bodyFatPct: 14,
  caloriesKcal: 2400,
  proteinG: 180,
  heightCm: 180,
  targetWeightKg: 78,
  waistCm: 84,
};
const safePayload = stripSensitiveFields(memberPayload);
assert("Privacy: displayName bleibt erhalten", safePayload.displayName === "Akram");
assert("Privacy: steps bleibt erhalten", safePayload.steps === 8200);
assert("Privacy: workoutDone bleibt erhalten", safePayload.workoutDone === true);
assert("Privacy: weightKg entfernt", !("weightKg" in safePayload));
assert("Privacy: bodyFatPct entfernt", !("bodyFatPct" in safePayload));
assert("Privacy: caloriesKcal entfernt", !("caloriesKcal" in safePayload));
assert("Privacy: proteinG entfernt", !("proteinG" in safePayload));
assert("Privacy: heightCm entfernt", !("heightCm" in safePayload));
assert("Privacy: targetWeightKg entfernt", !("targetWeightKg" in safePayload));
assert("Privacy: waistCm entfernt", !("waistCm" in safePayload));
assert("Privacy: hasNoSensitiveFields(safe) == true", hasNoSensitiveFields(safePayload));
assert("Privacy: hasNoSensitiveFields(raw) == false", !hasNoSensitiveFields(memberPayload));

// ── Mahlzeiten-Status: nur Zähler, keine Details ──────────────────────────────

assert(
  "Mahlzeiten: 2 von 3 geloggt",
  (() => {
    const r = sanitizeSocialMealStatus({ fruehstueck: true, mittag: true, abend: false });
    return r.logged === 2 && r.total === 3;
  })(),
);
assert(
  "Mahlzeiten: null → 0/0",
  (() => {
    const r = sanitizeSocialMealStatus(null);
    return r.logged === 0 && r.total === 0;
  })(),
);
assert(
  "Mahlzeiten: Ergebnis enthält keine Kalorien-/Protein-Felder",
  hasNoSensitiveFields(
    sanitizeSocialMealStatus({ a: true }) as unknown as Record<string, unknown>,
  ),
);

// ── Member-Detail-Zugriffs-Helper ─────────────────────────────────────────────

assert(
  "Zugriff: eigenes Profil immer erlaubt",
  canViewMemberDetail("me", "me", []),
);
assert(
  "Zugriff: gemeinsames Teammitglied erlaubt",
  canViewMemberDetail("me", "teammate", ["teammate", "other"]),
);
assert(
  "Zugriff: fremdes Nicht-Teammitglied verweigert",
  !canViewMemberDetail("me", "stranger", ["teammate", "other"]),
);
assert(
  "Zugriff: leere Teamliste verweigert Fremde",
  !canViewMemberDetail("me", "stranger", []),
);

// ── Steps-Validierung ─────────────────────────────────────────────────────────

assert("Steps: 8200 gültig", stepsSchema.safeParse(8200).success);
assert("Steps: 0 gültig", stepsSchema.safeParse(0).success);
assert("Steps: negativ abgewiesen", !stepsSchema.safeParse(-1).success);
assert("Steps: über 100000 abgewiesen", !stepsSchema.safeParse(100_001).success);
assert("Steps: Kommazahl abgewiesen", !stepsSchema.safeParse(8200.5).success);
assert(
  "updateDailySteps: vollständig gültig",
  updateDailyStepsSchema.safeParse({ date: "2026-06-12", steps: 8200 }).success,
);
assert(
  "updateDailySteps: ungültiges Datum abgewiesen",
  !updateDailyStepsSchema.safeParse({ date: "heute", steps: 8200 }).success,
);

// ── Abschluss ─────────────────────────────────────────────────────────────────

console.log(
  `\n${failed === 0 ? "ALLE TESTS BESTANDEN" : `${failed} TEST(S) FEHLGESCHLAGEN`}`,
);
if (failed > 0) process.exit(1);
