/**
 * QA Smoke-Tests — Phase 7B Editor: Übung entfernen · ersetzen · anpassen.
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
import {
  removeWorkoutDayExerciseSchema,
  replaceWorkoutDayExerciseSchema,
  updateWorkoutDayExercisePrescriptionSchema,
} from "../src/lib/validation/workout";

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

// ── UID-Parser (global/custom/invalid) ───────────────────────────────────────

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
assert("invalid prefix → null", parseExerciseUid(`x_${UUID_A}`) === null);
assert("invalid uuid → null", parseExerciseUid("g_not-a-uuid") === null);
assert("null-Eingabe → null", parseExerciseUid(null) === null);

assert(
  "buildExerciseUid Roundtrip (custom)",
  (() => {
    const r = parseExerciseUid(buildExerciseUid("custom", UUID_B));
    return r?.kind === "custom" && r.id === UUID_B;
  })(),
);

// ── Remove-Schema ─────────────────────────────────────────────────────────────

assert(
  "Remove: gültige id akzeptiert",
  removeWorkoutDayExerciseSchema.safeParse({ workoutDayExerciseId: UUID_A })
    .success,
);
assert(
  "Remove: ungültige id abgewiesen",
  !removeWorkoutDayExerciseSchema.safeParse({
    workoutDayExerciseId: "nope",
  }).success,
);
assert(
  "Remove: fehlende id abgewiesen",
  !removeWorkoutDayExerciseSchema.safeParse({}).success,
);

// ── Replace-Schema ────────────────────────────────────────────────────────────

assert(
  "Replace: gültig (global) akzeptiert",
  replaceWorkoutDayExerciseSchema.safeParse({
    workoutDayExerciseId: UUID_A,
    exerciseUid: `g_${UUID_B}`,
  }).success,
);
assert(
  "Replace: gültig (custom) akzeptiert",
  replaceWorkoutDayExerciseSchema.safeParse({
    workoutDayExerciseId: UUID_A,
    exerciseUid: `c_${UUID_B}`,
  }).success,
);
assert(
  "Replace: ungültige exerciseUid abgewiesen",
  !replaceWorkoutDayExerciseSchema.safeParse({
    workoutDayExerciseId: UUID_A,
    exerciseUid: `x_${UUID_B}`,
  }).success,
);
assert(
  "Replace: ungültige Ziel-id abgewiesen",
  !replaceWorkoutDayExerciseSchema.safeParse({
    workoutDayExerciseId: "nope",
    exerciseUid: `g_${UUID_B}`,
  }).success,
);
assert(
  "Replace: fehlende exerciseUid abgewiesen",
  !replaceWorkoutDayExerciseSchema.safeParse({
    workoutDayExerciseId: UUID_A,
  }).success,
);

// ── Prescription-Schema (gültig/ungültig + Grenzen) ──────────────────────────

const validRx = {
  workoutDayExerciseId: UUID_A,
  targetSets: 4,
  targetReps: 8,
  targetRestSec: 120,
};

assert(
  "Prescription: gültig akzeptiert",
  updateWorkoutDayExercisePrescriptionSchema.safeParse(validRx).success,
);
assert(
  "Prescription: String-Eingaben (Formular) akzeptiert",
  updateWorkoutDayExercisePrescriptionSchema.safeParse({
    workoutDayExerciseId: UUID_A,
    targetSets: "3",
    targetReps: "12",
    targetRestSec: "60",
  }).success,
);

// Sets-Grenzen 1–10
assert(
  "Prescription: Sätze 1 (Untergrenze) ok",
  updateWorkoutDayExercisePrescriptionSchema.safeParse({ ...validRx, targetSets: 1 })
    .success,
);
assert(
  "Prescription: Sätze 10 (Obergrenze) ok",
  updateWorkoutDayExercisePrescriptionSchema.safeParse({ ...validRx, targetSets: 10 })
    .success,
);
assert(
  "Prescription: Sätze 0 abgewiesen",
  !updateWorkoutDayExercisePrescriptionSchema.safeParse({ ...validRx, targetSets: 0 })
    .success,
);
assert(
  "Prescription: Sätze 11 abgewiesen",
  !updateWorkoutDayExercisePrescriptionSchema.safeParse({ ...validRx, targetSets: 11 })
    .success,
);

// Reps-Grenzen 1–100
assert(
  "Prescription: Wdh. 100 (Obergrenze) ok",
  updateWorkoutDayExercisePrescriptionSchema.safeParse({ ...validRx, targetReps: 100 })
    .success,
);
assert(
  "Prescription: Wdh. 0 abgewiesen",
  !updateWorkoutDayExercisePrescriptionSchema.safeParse({ ...validRx, targetReps: 0 })
    .success,
);
assert(
  "Prescription: Wdh. 101 abgewiesen",
  !updateWorkoutDayExercisePrescriptionSchema.safeParse({ ...validRx, targetReps: 101 })
    .success,
);

// Rest-Grenzen 15–600
assert(
  "Prescription: Pause 15 (Untergrenze) ok",
  updateWorkoutDayExercisePrescriptionSchema.safeParse({ ...validRx, targetRestSec: 15 })
    .success,
);
assert(
  "Prescription: Pause 600 (Obergrenze) ok",
  updateWorkoutDayExercisePrescriptionSchema.safeParse({ ...validRx, targetRestSec: 600 })
    .success,
);
assert(
  "Prescription: Pause 14 abgewiesen",
  !updateWorkoutDayExercisePrescriptionSchema.safeParse({ ...validRx, targetRestSec: 14 })
    .success,
);
assert(
  "Prescription: Pause 601 abgewiesen",
  !updateWorkoutDayExercisePrescriptionSchema.safeParse({ ...validRx, targetRestSec: 601 })
    .success,
);
assert(
  "Prescription: Nicht-Zahl abgewiesen",
  !updateWorkoutDayExercisePrescriptionSchema.safeParse({
    ...validRx,
    targetSets: "abc",
  }).success,
);
assert(
  "Prescription: Kommazahl abgewiesen (nur ganze Zahlen)",
  !updateWorkoutDayExercisePrescriptionSchema.safeParse({ ...validRx, targetSets: 3.5 })
    .success,
);
assert(
  "Prescription: fehlende Werte abgewiesen",
  !updateWorkoutDayExercisePrescriptionSchema.safeParse({
    workoutDayExerciseId: UUID_A,
  }).success,
);

// ── XOR-Logik (Replace setzt genau eine Referenz) ────────────────────────────

/** Spiegelt, wie die Replace-Action die Referenzen setzt. */
function replaceRefs(uid: string): { exerciseId: string | null; customExerciseId: string | null } {
  const ref = parseExerciseUid(uid);
  if (!ref) return { exerciseId: null, customExerciseId: null };
  return {
    exerciseId: ref.kind === "global" ? ref.id : null,
    customExerciseId: ref.kind === "custom" ? ref.id : null,
  };
}
function xorOk(a: string | null, b: string | null): boolean {
  return (a !== null) !== (b !== null);
}

assert("XOR: Replace global → nur exercise_id", (() => {
  const r = replaceRefs(`g_${UUID_A}`);
  return r.exerciseId === UUID_A && r.customExerciseId === null && xorOk(r.exerciseId, r.customExerciseId);
})());
assert("XOR: Replace custom → nur custom_exercise_id", (() => {
  const r = replaceRefs(`c_${UUID_B}`);
  return r.customExerciseId === UUID_B && r.exerciseId === null && xorOk(r.exerciseId, r.customExerciseId);
})());

// ── Bestehende 7B1-Helfer weiter OK ──────────────────────────────────────────

assert(
  "defaultPrescription(false): 3 × 10, 90 s",
  (() => {
    const p = defaultPrescription(false);
    return p.targetSets === 3 && p.targetReps === 10 && p.targetRestSec === 90;
  })(),
);
assert(
  "defaultPrescription(true): 4 × 8, 120 s",
  (() => {
    const p = defaultPrescription(true);
    return p.targetSets === 4 && p.targetReps === 8 && p.targetRestSec === 120;
  })(),
);
assert("nextOrder([]) → 0", nextOrder([]) === 0);
assert("nextOrder([0,1,2]) → 3", nextOrder([0, 1, 2]) === 3);

// ── Abschluss ─────────────────────────────────────────────────────────────────

console.log(`\n${failed === 0 ? "ALLE TESTS BESTANDEN" : `${failed} TEST(S) FEHLGESCHLAGEN`}`);
if (failed > 0) process.exit(1);
