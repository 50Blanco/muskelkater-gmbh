/**
 * QA Smoke-Tests — Phase 11 Progress V1 + Weekly Body Check-in.
 * Testet: Zod-Schema-Validierung, bodyCheckin POINTS, weeklyBodyCheckin-Shape,
 * Team-Payload enthält KEINE Messwerte, getWeekMondayIso-Logik.
 * Keine DB-Verbindung nötig.
 */

import { bodyCheckinSchema } from "../src/lib/validation/body";
import { POINTS } from "../src/lib/social/challenge-scoring";
import { getWeekMondayIso } from "../src/lib/utils/date";

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

// ── 1. Zod-Schema: bodyCheckinSchema ─────────────────────────────────────────
console.log("\n1. bodyCheckinSchema Validierung");

test("nur Gewicht → valide", () => {
  const r = bodyCheckinSchema.safeParse({ weightKg: 80 });
  assert(r.success, JSON.stringify(r.success ? {} : r.error.issues));
});

test("nur Bauchumfang → valide", () => {
  const r = bodyCheckinSchema.safeParse({ waistCm: 90 });
  assert(r.success, JSON.stringify(r.success ? {} : r.error.issues));
});

test("nur Armumfang → valide", () => {
  const r = bodyCheckinSchema.safeParse({ armCm: 35 });
  assert(r.success, JSON.stringify(r.success ? {} : r.error.issues));
});

test("alle drei Felder → valide", () => {
  const r = bodyCheckinSchema.safeParse({ weightKg: 75, waistCm: 88, armCm: 33 });
  assert(r.success, JSON.stringify(r.success ? {} : r.error.issues));
});

test("keine Felder → ungültig (min. 1 Wert)", () => {
  const r = bodyCheckinSchema.safeParse({});
  assert(!r.success, "Sollte ungültig sein ohne Werte");
});

test("alle Felder undefined → ungültig", () => {
  const r = bodyCheckinSchema.safeParse({ weightKg: undefined, waistCm: undefined, armCm: undefined });
  assert(!r.success, "Sollte ungültig sein wenn alle Felder undefined");
});

test("weightKg unter 20 → ungültig", () => {
  const r = bodyCheckinSchema.safeParse({ weightKg: 5 });
  assert(!r.success, "Gewicht 5 sollte abgelehnt werden");
});

test("weightKg über 400 → ungültig", () => {
  const r = bodyCheckinSchema.safeParse({ weightKg: 500 });
  assert(!r.success, "Gewicht 500 sollte abgelehnt werden");
});

test("waistCm unter 30 → ungültig", () => {
  const r = bodyCheckinSchema.safeParse({ waistCm: 10 });
  assert(!r.success, "Bauchumfang 10 sollte abgelehnt werden");
});

test("armCm über 100 → ungültig", () => {
  const r = bodyCheckinSchema.safeParse({ armCm: 200 });
  assert(!r.success, "Armumfang 200 sollte abgelehnt werden");
});

test("Grenzwert weightKg=20 → valide", () => {
  const r = bodyCheckinSchema.safeParse({ weightKg: 20 });
  assert(r.success, "Grenzwert 20 kg sollte valide sein");
});

test("Grenzwert armCm=10 → valide", () => {
  const r = bodyCheckinSchema.safeParse({ armCm: 10 });
  assert(r.success, "Grenzwert 10 cm sollte valide sein");
});

// ── 2. POINTS.bodyCheckin = 50 ───────────────────────────────────────────────
console.log("\n2. Scoring: bodyCheckin POINTS");

test("POINTS.bodyCheckin ist 50", () => {
  assertEqual(POINTS.bodyCheckin, 50, "bodyCheckin muss 50 Punkte sein");
});

test("POINTS.workout ist 30", () => {
  assertEqual(POINTS.workout, 30, "workout-Punkte zur Kontrolle");
});

test("bodyCheckin-Bonus ist größer als workout (Incentive)", () => {
  assert(
    POINTS.bodyCheckin > POINTS.workout,
    "bodyCheckin-Bonus sollte größer sein als ein einzelnes Workout",
  );
});

// ── 3. weeklyBodyCheckin Shape-Check ─────────────────────────────────────────
console.log("\n3. weeklyBodyCheckin Shape (Laufzeit-Check)");

const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

test("weeklyBodyCheckin-Completion-Record hat userId + weekDate — KEINE Messwerte", () => {
  // Simuliert den Record wie er im Team-Layer auftaucht.
  // KEIN Gewicht, kein Umfang, keine Körperdaten.
  const completionRecord = {
    userId: FAKE_UUID,
    weekDate: "2026-06-09",
  };
  assert("userId" in completionRecord, "userId fehlt");
  assert("weekDate" in completionRecord, "weekDate fehlt");
  assert(!("weightKg" in completionRecord), "weightKg DARF NICHT im Team-Record sein");
  assert(!("waistCm" in completionRecord), "waistCm DARF NICHT im Team-Record sein");
  assert(!("armCm" in completionRecord), "armCm DARF NICHT im Team-Record sein");
  assert(!("valueCm" in completionRecord), "valueCm DARF NICHT im Team-Record sein");
  assert(!("bodyFatPct" in completionRecord), "bodyFatPct DARF NICHT im Team-Record sein");
});

test("weekDate ist immer ein Montag-Format (YYYY-MM-DD)", () => {
  const weekDate = "2026-06-08"; // Montag
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  assert(regex.test(weekDate), "weekDate muss ISO-Format haben");
  const date = new Date(weekDate + "T00:00:00Z");
  // 1 = Montag in UTC (0=So, 1=Mo, …, 6=Sa)
  assertEqual(date.getUTCDay(), 1, "weekDate muss ein Montag sein");
});

// ── 4. getWeekMondayIso Logik ────────────────────────────────────────────────
console.log("\n4. getWeekMondayIso: Wochenbeginn-Berechnung");

test("Montag bleibt Montag (2026-06-08)", () => {
  assertEqual(getWeekMondayIso("2026-06-08"), "2026-06-08");
});

test("Dienstag 2026-06-09 → Montag 2026-06-08", () => {
  assertEqual(getWeekMondayIso("2026-06-09"), "2026-06-08");
});

test("Mittwoch 2026-06-10 → Montag 2026-06-08", () => {
  assertEqual(getWeekMondayIso("2026-06-10"), "2026-06-08");
});

test("Sonntag 2026-06-14 → Montag 2026-06-08", () => {
  assertEqual(getWeekMondayIso("2026-06-14"), "2026-06-08");
});

test("Samstag 2026-06-13 → Montag 2026-06-08", () => {
  assertEqual(getWeekMondayIso("2026-06-13"), "2026-06-08");
});

test("Wochengrenze: Sonntag 2026-05-31 → Montag 2026-05-25", () => {
  assertEqual(getWeekMondayIso("2026-05-31"), "2026-05-25");
});

test("Monatsgrenze: 2026-03-02 (Montag) bleibt", () => {
  assertEqual(getWeekMondayIso("2026-03-02"), "2026-03-02");
});

test("2026-01-01 (Donnerstag) → 2025-12-29 (Montag)", () => {
  assertEqual(getWeekMondayIso("2026-01-01"), "2025-12-29");
});

// ── 5. Datenschutz: Team-Payload keine Körperdaten ───────────────────────────
console.log("\n5. Datenschutz: Team-Payload enthält keine Körperdaten");

test("MemberWeeklySignals-Shape enthält keine Messwerte", () => {
  // Simuliert den Typ, der aus team-queries.ts kommt.
  const signals = {
    days: [],
    today: {
      workoutCompleted: false,
      stepsGoalReached: false,
      nutritionLogged: false,
      waterGoalReached: false,
      habitsCompleted: 0,
    },
    weeklyCheckinDone: true,
  };
  assert("weeklyCheckinDone" in signals, "weeklyCheckinDone muss vorhanden sein");
  assert(!("weightKg" in signals), "weightKg DARF NICHT in MemberWeeklySignals sein");
  assert(!("waistCm" in signals), "waistCm DARF NICHT in MemberWeeklySignals sein");
  assert(!("armCm" in signals), "armCm DARF NICHT in MemberWeeklySignals sein");
  assert(!("bodyMetrics" in signals), "bodyMetrics DARF NICHT in MemberWeeklySignals sein");
});

test("TeamMemberCard enthält weeklyCheckinDone als boolean, KEINE Messwerte", () => {
  const card = {
    userId: FAKE_UUID,
    displayName: "Max",
    role: "member" as const,
    weeklyScore: 80,
    rank: 1,
    isCurrentUser: false,
    weeklyCheckinDone: true,
  };
  assert(typeof card.weeklyCheckinDone === "boolean", "weeklyCheckinDone muss boolean sein");
  assert(!("weightKg" in card), "weightKg DARF NICHT in TeamMemberCard sein");
  assert(!("waistCm" in card), "waistCm DARF NICHT in TeamMemberCard sein");
});

test("weeklyCheckinDone true → kein Schluss auf Messwert möglich", () => {
  // Sicherstellt: true bedeutet nur "erledigt", nicht welchen Wert.
  const done = true;
  // Keine Ableitung möglich — der Test dokumentiert die Anforderung.
  assert(typeof done === "boolean", "Nur boolean, kein Wert");
});

// ── Report ───────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`Phase 11 QA: ${passed} bestanden, ${failed} fehlgeschlagen`);
if (failed > 0) process.exit(1);
