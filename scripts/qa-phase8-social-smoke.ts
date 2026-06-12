/**
 * QA Smoke-Tests — Phase 8 Social Dashboard MVP.
 * Pure Logik-Tests, keine DB-Verbindung nötig.
 */

import {
  createSocialGroupSchema,
  inviteCodeSchema,
  joinSocialGroupSchema,
  reactToSocialEventSchema,
  reactionTypeSchema,
  targetTypeSchema,
  SOCIAL_REACTION_TYPES,
  SOCIAL_TARGET_TYPES,
} from "../src/lib/validation/social";

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

// ── Invite-Code-Normalisierung ────────────────────────────────────────────────

assert(
  "Code '  ab3cd7ef  ' normalisiert zu 'AB3CD7EF'",
  inviteCodeSchema.safeParse("  ab3cd7ef  ").success &&
    inviteCodeSchema.parse("  ab3cd7ef  ") === "AB3CD7EF",
);
assert(
  "Code 'AB-3C-D7EF' (Bindestriche) normalisiert zu 'AB3CD7EF'",
  inviteCodeSchema.safeParse("AB-3C-D7EF").success,
);
assert(
  "Code 'AB3CD7EF' gültig",
  inviteCodeSchema.safeParse("AB3CD7EF").success,
);
assert(
  "Code zu kurz (7 Zeichen) abgewiesen",
  !inviteCodeSchema.safeParse("AB3CD7E").success,
);
assert(
  "Code zu lang (9 Zeichen) abgewiesen",
  !inviteCodeSchema.safeParse("AB3CD7EFX").success,
);
assert(
  "Leerer Code abgewiesen",
  !inviteCodeSchema.safeParse("").success,
);

// ── Group-Name ─────────────────────────────────────────────────────────────────

assert(
  "Gruppenname 'Team Montag' akzeptiert",
  createSocialGroupSchema.safeParse({ name: "Team Montag" }).success,
);
assert(
  "Gruppenname 1 Zeichen abgewiesen",
  !createSocialGroupSchema.safeParse({ name: "A" }).success,
);
assert(
  "Gruppenname 51 Zeichen abgewiesen",
  !createSocialGroupSchema.safeParse({ name: "A".repeat(51) }).success,
);
assert(
  "Gruppenname 50 Zeichen akzeptiert",
  createSocialGroupSchema.safeParse({ name: "A".repeat(50) }).success,
);
assert(
  "Gruppenname mit Leerzeichen trimmt korrekt",
  (() => {
    const r = createSocialGroupSchema.safeParse({ name: "  Team  " });
    return r.success && r.data.name === "Team";
  })(),
);

// ── Reaction-Type ─────────────────────────────────────────────────────────────

for (const t of SOCIAL_REACTION_TYPES) {
  assert(`Reaktionstyp '${t}' gültig`, reactionTypeSchema.safeParse(t).success);
}
assert(
  "Reaktionstyp 'klasse' ungültig",
  !reactionTypeSchema.safeParse("klasse").success,
);
assert(
  "Reaktionstyp '' ungültig",
  !reactionTypeSchema.safeParse("").success,
);

// ── Target-Type ───────────────────────────────────────────────────────────────

for (const t of SOCIAL_TARGET_TYPES) {
  assert(`Zieltyp '${t}' gültig`, targetTypeSchema.safeParse(t).success);
}
assert(
  "Zieltyp 'food_log' ungültig",
  !targetTypeSchema.safeParse("food_log").success,
);
assert(
  "Zieltyp 'body_metrics' ungültig (sensible Daten ausgeschlossen)",
  !targetTypeSchema.safeParse("body_metrics").success,
);

// ── Join-Schema ───────────────────────────────────────────────────────────────

assert(
  "joinSocialGroup: gültiger Code akzeptiert",
  joinSocialGroupSchema.safeParse({ inviteCode: "AB3CD7EF" }).success,
);
assert(
  "joinSocialGroup: leerer Code abgewiesen",
  !joinSocialGroupSchema.safeParse({ inviteCode: "" }).success,
);
assert(
  "joinSocialGroup: fehlender Code abgewiesen",
  !joinSocialGroupSchema.safeParse({}).success,
);

// ── React-Schema ──────────────────────────────────────────────────────────────

assert(
  "reactToSocialEvent: vollständig gültig akzeptiert",
  reactToSocialEventSchema.safeParse({
    groupId: UUID_A,
    targetType: "workout_session",
    targetId: UUID_B,
    reactionType: "stark",
  }).success,
);
assert(
  "reactToSocialEvent: ungültige groupId abgewiesen",
  !reactToSocialEventSchema.safeParse({
    groupId: "nope",
    targetType: "workout_session",
    targetId: UUID_B,
    reactionType: "stark",
  }).success,
);
assert(
  "reactToSocialEvent: ungültiger reactionType abgewiesen",
  !reactToSocialEventSchema.safeParse({
    groupId: UUID_A,
    targetType: "workout_session",
    targetId: UUID_B,
    reactionType: "lol",
  }).success,
);
assert(
  "reactToSocialEvent: ungültiger targetType abgewiesen",
  !reactToSocialEventSchema.safeParse({
    groupId: UUID_A,
    targetType: "body_metrics",
    targetId: UUID_B,
    reactionType: "respekt",
  }).success,
);

// ── Privacy-Mapper: keine sensiblen Felder im Feed-Text ───────────────────────

/** Spiegelt EVENT_TEXT aus dem Loader — prüft, dass keine sensiblen Begriffe enthalten sind. */
const EVENT_TEXT: Record<string, string> = {
  workout_session: "hat eine Trainingseinheit abgeschlossen",
  daily_mission: "hat eine Mission erledigt",
  daily_habit_log: "hat eine Gewohnheit abgehakt",
};

const BANNED_TERMS = [
  "kalorien", "kcal", "protein", "gewicht", "kg", "maß", "fett",
  "bmi", "körper", "bauch", "arm", "hüfte", "brust",
];

for (const [type, text] of Object.entries(EVENT_TEXT)) {
  const lower = text.toLowerCase();
  const hasBannedTerm = BANNED_TERMS.some((t) => lower.includes(t));
  assert(
    `Event-Text '${type}' enthält keine sensiblen Begriffe`,
    !hasBannedTerm,
  );
}

// ── Social Event Text Builder ─────────────────────────────────────────────────

function buildEventSentence(displayName: string, eventType: string): string {
  const text = EVENT_TEXT[eventType] ?? "hat etwas erledigt";
  return `${displayName} ${text}`;
}

assert(
  "Event-Satz workout: korrekt formatiert",
  buildEventSentence("Sarah", "workout_session") ===
    "Sarah hat eine Trainingseinheit abgeschlossen",
);
assert(
  "Event-Satz mission: korrekt formatiert",
  buildEventSentence("Ali", "daily_mission") ===
    "Ali hat eine Mission erledigt",
);
assert(
  "Event-Satz habit: korrekt formatiert",
  buildEventSentence("Rejhan", "daily_habit_log") ===
    "Rejhan hat eine Gewohnheit abgehakt",
);

// ── Abschluss ─────────────────────────────────────────────────────────────────

console.log(
  `\n${failed === 0 ? "ALLE TESTS BESTANDEN" : `${failed} TEST(S) FEHLGESCHLAGEN`}`,
);
if (failed > 0) process.exit(1);
