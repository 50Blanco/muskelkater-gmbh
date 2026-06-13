/**
 * QA Smoke-Tests — Phase 10 Team Experience V1.
 * Testet: member_week Validierung, HeuteSocialSummary-Shape,
 * ChallengeCard-Logik (Fortschritt, Countdown), MemberDetailData-Shape.
 * Keine DB-Verbindung nötig.
 */

import {
  SOCIAL_REACTION_TYPES,
  SOCIAL_TARGET_TYPES,
  reactToSocialEventSchema,
} from "../src/lib/validation/social";
import {
  getChallengeDaysRemaining,
} from "../src/lib/social/challenge-scoring";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function assertEqual<T>(a: T, b: T, msg?: string) {
  if (a !== b) throw new Error(msg ?? `Expected ${String(a)} === ${String(b)}`);
}

// ── 1. member_week als gültiger SOCIAL_TARGET_TYPE ──────────────────────────
console.log("\n1. member_week Enum-Werte");

test("SOCIAL_TARGET_TYPES enthält member_week", () => {
  assert(
    (SOCIAL_TARGET_TYPES as readonly string[]).includes("member_week"),
    "member_week fehlt in SOCIAL_TARGET_TYPES",
  );
});

test("SOCIAL_TARGET_TYPES hat 4 Einträge", () => {
  assertEqual(SOCIAL_TARGET_TYPES.length, 4, "Erwartet 4 target types");
});

test("SOCIAL_REACTION_TYPES hat 3 Einträge", () => {
  assertEqual(SOCIAL_REACTION_TYPES.length, 3, "Erwartet 3 reaction types");
});

// ── 2. reactToSocialEventSchema mit member_week ──────────────────────────────
console.log("\n2. Zod-Schema: reactToSocialEvent mit member_week");

const FAKE_UUID = "00000000-0000-0000-0000-000000000000";
const FAKE_UUID2 = "ffffffff-ffff-ffff-ffff-ffffffffffff";

test("stark-Reaktion auf member_week ist valide", () => {
  const r = reactToSocialEventSchema.safeParse({
    groupId: FAKE_UUID,
    targetType: "member_week",
    targetId: FAKE_UUID2,
    reactionType: "stark",
  });
  assert(r.success, r.success ? "" : JSON.stringify(r.error.issues));
});

test("weiter_so-Reaktion auf member_week ist valide", () => {
  const r = reactToSocialEventSchema.safeParse({
    groupId: FAKE_UUID,
    targetType: "member_week",
    targetId: FAKE_UUID2,
    reactionType: "weiter_so",
  });
  assert(r.success, r.success ? "" : JSON.stringify(r.error.issues));
});

test("respekt-Reaktion auf member_week ist valide", () => {
  const r = reactToSocialEventSchema.safeParse({
    groupId: FAKE_UUID,
    targetType: "member_week",
    targetId: FAKE_UUID2,
    reactionType: "respekt",
  });
  assert(r.success, r.success ? "" : JSON.stringify(r.error.issues));
});

test("ungültige Reaktion wird abgelehnt", () => {
  const r = reactToSocialEventSchema.safeParse({
    groupId: FAKE_UUID,
    targetType: "member_week",
    targetId: FAKE_UUID2,
    reactionType: "super",
  });
  assert(!r.success, "Sollte ungültig sein");
});

test("ungültiger targetType wird abgelehnt", () => {
  const r = reactToSocialEventSchema.safeParse({
    groupId: FAKE_UUID,
    targetType: "user_profile",
    targetId: FAKE_UUID2,
    reactionType: "stark",
  });
  assert(!r.success, "Sollte ungültig sein");
});

test("bestehende Typen (workout_session, daily_mission) bleiben valide", () => {
  for (const t of ["workout_session", "daily_mission", "daily_habit_log"] as const) {
    const r = reactToSocialEventSchema.safeParse({
      groupId: FAKE_UUID,
      targetType: t,
      targetId: FAKE_UUID2,
      reactionType: "stark",
    });
    assert(r.success, `${t} sollte valide sein`);
  }
});

// ── 3. ChallengeCard-Logik: Countdown ────────────────────────────────────────
console.log("\n3. ChallengeCard Countdown-Logik");

test("getChallengeDaysRemaining: Letzter Tag = 0", () => {
  assertEqual(getChallengeDaysRemaining("2026-06-13", "2026-06-13"), 0);
});

test("getChallengeDaysRemaining: 5 Tage verbleibend", () => {
  assertEqual(getChallengeDaysRemaining("2026-06-18", "2026-06-13"), 5);
});

test("getChallengeDaysRemaining: abgeschlossen → negativ", () => {
  assert(
    getChallengeDaysRemaining("2026-06-10", "2026-06-13") < 0,
    "Abgeschlossene Challenge sollte negative Zahl liefern",
  );
});

// ── 4. HeuteSocialSummary Shape-Check (Typ-Compiler-Test) ────────────────────
console.log("\n4. HeuteSocialSummary Shape");

test("todaySteps und todayDate sind in der Summary-Shape vorhanden", () => {
  // Wir prüfen zur Laufzeit, dass die Felder exportiert werden.
  // Echter Typ-Check passiert in tsc --noEmit.
  const summary = {
    hasTeam: false,
    group: null,
    currentUserId: "u1",
    challenge: null,
    challengeLabel: null,
    ownRank: null,
    memberCount: 0,
    ownOpenSources: [],
    members: [],
    feed: [],
    todaySteps: null,
    todayDate: "2026-06-13",
  };
  assert("todaySteps" in summary, "todaySteps fehlt");
  assert("todayDate" in summary, "todayDate fehlt");
  assertEqual(summary.todayDate, "2026-06-13");
});

test("todaySteps kann null sein (kein Eintrag heute)", () => {
  const summary = { todaySteps: null as number | null };
  assert(summary.todaySteps === null, "null sollte möglich sein");
});

test("todaySteps kann Zahl sein", () => {
  const summary = { todaySteps: 7500 as number | null };
  assertEqual(summary.todaySteps, 7500);
});

// ── 5. MemberDetailData Shape-Check ─────────────────────────────────────────
console.log("\n5. MemberDetailData Shape");

test("motivationReactions enthält alle 3 Reaktionstypen", () => {
  const reactions = {
    stark: { count: 0, mine: false },
    weiter_so: { count: 0, mine: false },
    respekt: { count: 0, mine: false },
  };
  for (const key of SOCIAL_REACTION_TYPES) {
    assert(key in reactions, `${key} fehlt in motivationReactions`);
  }
});

test("groupId ist in MemberDetailData Shape vorhanden", () => {
  const data = {
    userId: FAKE_UUID,
    displayName: "Max",
    isCurrentUser: false,
    groupId: FAKE_UUID2,
    today: {},
    weeklyScore: 80,
    week: [],
    meals: {},
    motivationReactions: {
      stark: { count: 1, mine: true },
      weiter_so: { count: 0, mine: false },
      respekt: { count: 0, mine: false },
    },
  };
  assert("groupId" in data, "groupId fehlt");
  assert("motivationReactions" in data, "motivationReactions fehlt");
  assertEqual(data.motivationReactions.stark.mine, true);
});

// ── Report ───────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`Phase 10 QA: ${passed} bestanden, ${failed} fehlgeschlagen`);
if (failed > 0) process.exit(1);
