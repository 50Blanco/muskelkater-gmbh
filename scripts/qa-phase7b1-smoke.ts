/**
 * QA Smoke-Tests — Phase 7B1: Übung zu Trainingstag hinzufügen
 * Pure Logik-Tests, keine DB-Verbindung nötig.
 */

import {
  parseExerciseUid,
  buildExerciseUid,
} from "../src/lib/training/exercise-uid";
import {
  defaultPrescription,
  nextOrder,
} from "../src/lib/training/prescription";
import { addExerciseToWorkoutDaySchema } from "../src/lib/validation/workout";

let failed = 0;

function assert(description: string, condition: boolean) {
  if (condition) {
    console.log(`PASS — ${description}`);
  } else {
    console.error(`FAIL — ${description}`);
    failed++;
  }
}

// Gültige v4-UUIDs (Version 4, korrekte Variante-Bits) — z.uuid() ist RFC-strikt.
const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "abcdef01-2345-4789-abcd-ef0123456789";

// ── UID-Parser ────────────────────────────────────────────────────────────────

assert(
  "parse 'g_<uuid>' → global",
  (() => {
    const r = parseExerciseUid(`g_${UUID_A}`);
    return r?.kind === "global" && r.id === UUID_A;
  })(),
);

assert(
  "parse 'c_<uuid>' → custom",
  (() => {
    const r = parseExerciseUid(`c_${UUID_B}`);
    return r?.kind === "custom" && r.id === UUID_B;
  })(),
);

assert(
  "parse Großbuchstaben-UUID akzeptiert",
  parseExerciseUid(`g_${UUID_A.toUpperCase()}`)?.kind === "global",
);

assert("invalid prefix 'x_<uuid>' → null", parseExerciseUid(`x_${UUID_A}`) === null);
assert("ohne Präfix → null", parseExerciseUid(UUID_A) === null);
assert("invalid uuid → null", parseExerciseUid("g_not-a-uuid") === null);
assert("leerer String → null", parseExerciseUid("") === null);
assert("nur Präfix ohne id → null", parseExerciseUid("g_") === null);
assert("null-Eingabe → null", parseExerciseUid(null) === null);
assert("number-Eingabe → null", parseExerciseUid(123 as unknown) === null);

assert(
  "buildExerciseUid('global', id) → 'g_<id>'",
  buildExerciseUid("global", UUID_A) === `g_${UUID_A}`,
);
assert(
  "buildExerciseUid('custom', id) → 'c_<id>'",
  buildExerciseUid("custom", UUID_B) === `c_${UUID_B}`,
);

assert(
  "Roundtrip build → parse (global)",
  (() => {
    const r = parseExerciseUid(buildExerciseUid("global", UUID_A));
    return r?.kind === "global" && r.id === UUID_A;
  })(),
);

// ── XOR-Logik (genau eine Referenz) ──────────────────────────────────────────

/** Spiegelt den DB-XOR-CHECK: genau eine Referenz gesetzt. */
function xorOk(exerciseId: string | null, customExerciseId: string | null): boolean {
  return (exerciseId !== null) !== (customExerciseId !== null);
}

assert("XOR: nur global → ok", xorOk(UUID_A, null) === true);
assert("XOR: nur custom → ok", xorOk(null, UUID_B) === true);
assert("XOR: beide gesetzt → invalid", xorOk(UUID_A, UUID_B) === false);
assert("XOR: keiner gesetzt → invalid", xorOk(null, null) === false);

// ── Default-Prescription ──────────────────────────────────────────────────────

assert(
  "defaultPrescription(false): 3 × 10, 90 s",
  (() => {
    const p = defaultPrescription(false);
    return p.targetSets === 3 && p.targetReps === 10 && p.targetRestSec === 90;
  })(),
);

assert(
  "defaultPrescription(true): 4 × 8, 120 s (compound)",
  (() => {
    const p = defaultPrescription(true);
    return p.targetSets === 4 && p.targetReps === 8 && p.targetRestSec === 120;
  })(),
);

assert(
  "Prescription-Werte sind plausibel (>0, Sätze ≤ 10)",
  (() => {
    const p = defaultPrescription(true);
    return p.targetSets > 0 && p.targetSets <= 10 && p.targetReps > 0 && p.targetRestSec >= 0;
  })(),
);

// ── nextOrder ─────────────────────────────────────────────────────────────────

assert("nextOrder([]) → 0", nextOrder([]) === 0);
assert("nextOrder([0,1,2]) → 3", nextOrder([0, 1, 2]) === 3);
assert("nextOrder([0,2]) → 3 (max+1, Lücke ignoriert)", nextOrder([0, 2]) === 3);
assert("nextOrder([5]) → 6", nextOrder([5]) === 6);
assert("nextOrder unsortiert [2,0,1] → 3", nextOrder([2, 0, 1]) === 3);

// ── Zod add-Schema ────────────────────────────────────────────────────────────

assert(
  "Zod: gültiges add-Input (global) akzeptiert",
  addExerciseToWorkoutDaySchema.safeParse({
    workoutDayId: UUID_A,
    exerciseUid: `g_${UUID_B}`,
  }).success,
);

assert(
  "Zod: gültiges add-Input (custom, mit Vorgabe) akzeptiert",
  addExerciseToWorkoutDaySchema.safeParse({
    workoutDayId: UUID_A,
    exerciseUid: `c_${UUID_B}`,
    targetSets: 4,
    targetReps: 8,
    targetRestSec: 120,
  }).success,
);

assert(
  "Zod: ungültige workoutDayId abgewiesen",
  !addExerciseToWorkoutDaySchema.safeParse({
    workoutDayId: "not-a-uuid",
    exerciseUid: `g_${UUID_B}`,
  }).success,
);

assert(
  "Zod: ungültige exerciseUid (falsches Präfix) abgewiesen",
  !addExerciseToWorkoutDaySchema.safeParse({
    workoutDayId: UUID_A,
    exerciseUid: `x_${UUID_B}`,
  }).success,
);

assert(
  "Zod: exerciseUid ohne UUID abgewiesen",
  !addExerciseToWorkoutDaySchema.safeParse({
    workoutDayId: UUID_A,
    exerciseUid: "g_kurz",
  }).success,
);

assert(
  "Zod: fehlende exerciseUid abgewiesen",
  !addExerciseToWorkoutDaySchema.safeParse({ workoutDayId: UUID_A }).success,
);

assert(
  "Zod: targetSets über Grenze (99) abgewiesen",
  !addExerciseToWorkoutDaySchema.safeParse({
    workoutDayId: UUID_A,
    exerciseUid: `g_${UUID_B}`,
    targetSets: 99,
  }).success,
);

// ── Abschluss ─────────────────────────────────────────────────────────────────

console.log(`\n${failed === 0 ? "ALLE TESTS BESTANDEN" : `${failed} TEST(S) FEHLGESCHLAGEN`}`);
if (failed > 0) process.exit(1);
