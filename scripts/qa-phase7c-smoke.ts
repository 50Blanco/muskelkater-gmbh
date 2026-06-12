/**
 * QA Smoke-Tests — Phase 7C: Trainingstagebuch
 * Pure Logik-Tests, keine DB-Verbindung nötig.
 */

import {
  formatWeightReps,
  formatSessionDate,
  formatDuration,
  rpeLabel,
  groupSetsByExercise,
  countCompletedSets,
  exerciseUid,
  type HistorySetRow,
} from "../src/lib/training/history-helpers";

let failed = 0;

function assert(description: string, condition: boolean) {
  if (condition) {
    console.log(`PASS — ${description}`);
  } else {
    console.error(`FAIL — ${description}`);
    failed++;
  }
}

// ── formatWeightReps ──────────────────────────────────────────────────────────

assert("formatWeightReps(60, 8) → '60 kg × 8'", formatWeightReps(60, 8) === "60 kg × 8");
assert("formatWeightReps(null, 12) → 'Körpergewicht × 12'", formatWeightReps(null, 12) === "Körpergewicht × 12");
assert("formatWeightReps(40, null) → '40 kg'", formatWeightReps(40, null) === "40 kg");
assert("formatWeightReps(null, null) → null", formatWeightReps(null, null) === null);
assert("formatWeightReps(0, 0) → null (nichts Sinnvolles)", formatWeightReps(0, 0) === null);
assert("formatWeightReps(0, 10) → 'Körpergewicht × 10' (0 kg = kein Gewicht)", formatWeightReps(0, 10) === "Körpergewicht × 10");
assert("formatWeightReps(62.5, 6) → '62,5 kg × 6' (Dezimal mit Komma)", formatWeightReps(62.5, 6) === "62,5 kg × 6");

// ── formatDuration ────────────────────────────────────────────────────────────

assert("formatDuration(42) → '42 Min'", formatDuration(42) === "42 Min");
assert("formatDuration(null) → '—'", formatDuration(null) === "—");
assert("formatDuration(0) → '—'", formatDuration(0) === "—");

// ── rpeLabel ──────────────────────────────────────────────────────────────────

assert("rpeLabel(7) → 'Anstrengend'", rpeLabel(7) === "Anstrengend");
assert("rpeLabel(null) → null", rpeLabel(null) === null);
assert("rpeLabel(0) → null", rpeLabel(0) === null);
assert("rpeLabel(2) → 'Leicht'", rpeLabel(2) === "Leicht");
assert("rpeLabel(10) → 'Maximal'", rpeLabel(10) === "Maximal");
assert("rpeLabel liefert für 1–10 immer ein Label", [1,2,3,4,5,6,7,8,9,10].every((r) => rpeLabel(r) !== null));

// ── formatSessionDate ─────────────────────────────────────────────────────────

assert(
  "formatSessionDate gibt deutschen Lesbar-String mit Jahr",
  (() => {
    const s = formatSessionDate(new Date("2026-06-10T18:30:00Z"));
    return s.includes("2026") && s.includes("Juni");
  })(),
);

assert("formatSessionDate(ungültig) → '—'", formatSessionDate(new Date("nope")) === "—");

assert(
  "formatSessionDate akzeptiert ISO-String",
  formatSessionDate("2026-01-15T08:00:00Z").includes("2026"),
);

// ── exerciseUid ───────────────────────────────────────────────────────────────

assert("exerciseUid('g', 'abc') → 'g_abc'", exerciseUid("g", "abc") === "g_abc");
assert("exerciseUid('c', 'xyz') → 'c_xyz'", exerciseUid("c", "xyz") === "c_xyz");

// ── groupSetsByExercise ───────────────────────────────────────────────────────

function globalRow(exId: string, setNumber: number, name: string): HistorySetRow {
  return {
    setNumber,
    weightKg: 50,
    reps: 8,
    completed: true,
    exerciseId: exId,
    customExerciseId: null,
    exerciseName: name,
    exerciseMuscleGroup: "chest",
    customName: null,
    customMuscleGroup: null,
  };
}

function customRow(ceId: string, setNumber: number, name: string): HistorySetRow {
  return {
    setNumber,
    weightKg: null,
    reps: 12,
    completed: true,
    exerciseId: null,
    customExerciseId: ceId,
    exerciseName: null,
    exerciseMuscleGroup: null,
    customName: name,
    customMuscleGroup: "biceps",
  };
}

assert("groupSetsByExercise([]) → []", groupSetsByExercise([]).length === 0);

assert(
  "Globale Übung: 3 Sätze → 1 Gruppe mit 3 Sätzen, uid 'g_<id>'",
  (() => {
    const groups = groupSetsByExercise([
      globalRow("ex1", 1, "Bankdrücken"),
      globalRow("ex1", 2, "Bankdrücken"),
      globalRow("ex1", 3, "Bankdrücken"),
    ]);
    return (
      groups.length === 1 &&
      groups[0].uid === "g_ex1" &&
      groups[0].sets.length === 3 &&
      groups[0].isCustom === false &&
      groups[0].name === "Bankdrücken" &&
      groups[0].muscleGroup === "chest"
    );
  })(),
);

assert(
  "Custom Übung: uid 'c_<id>', isCustom true",
  (() => {
    const groups = groupSetsByExercise([customRow("ce1", 1, "Mein Curl")]);
    return (
      groups.length === 1 &&
      groups[0].uid === "c_ce1" &&
      groups[0].isCustom === true &&
      groups[0].name === "Mein Curl" &&
      groups[0].muscleGroup === "biceps"
    );
  })(),
);

assert(
  "Gemischt global + custom → 2 getrennte Gruppen",
  (() => {
    const groups = groupSetsByExercise([
      globalRow("ex1", 1, "Bankdrücken"),
      customRow("ce1", 1, "Mein Curl"),
      globalRow("ex1", 2, "Bankdrücken"),
    ]);
    return (
      groups.length === 2 &&
      groups.some((g) => g.uid === "g_ex1" && g.sets.length === 2) &&
      groups.some((g) => g.uid === "c_ce1" && g.sets.length === 1)
    );
  })(),
);

assert(
  "Zwei verschiedene globale Übungen → 2 Gruppen, keine Kollision",
  (() => {
    const groups = groupSetsByExercise([
      globalRow("ex1", 1, "Bankdrücken"),
      globalRow("ex2", 1, "Kniebeuge"),
    ]);
    return groups.length === 2;
  })(),
);

assert(
  "Globale und custom Übung mit gleicher Roh-ID kollidieren nicht (g_ vs c_)",
  (() => {
    const groups = groupSetsByExercise([
      globalRow("same", 1, "Global"),
      customRow("same", 1, "Custom"),
    ]);
    return groups.length === 2 && groups[0].uid !== groups[1].uid;
  })(),
);

assert(
  "Sätze werden innerhalb der Gruppe nach setNumber sortiert",
  (() => {
    const groups = groupSetsByExercise([
      globalRow("ex1", 3, "Bankdrücken"),
      globalRow("ex1", 1, "Bankdrücken"),
      globalRow("ex1", 2, "Bankdrücken"),
    ]);
    const nums = groups[0].sets.map((s) => s.setNumber);
    return nums[0] === 1 && nums[1] === 2 && nums[2] === 3;
  })(),
);

assert(
  "Erstes Auftreten bestimmt Gruppenreihenfolge",
  (() => {
    const groups = groupSetsByExercise([
      customRow("ce1", 1, "Curl"),
      globalRow("ex1", 1, "Bankdrücken"),
    ]);
    return groups[0].uid === "c_ce1" && groups[1].uid === "g_ex1";
  })(),
);

// ── countCompletedSets ────────────────────────────────────────────────────────

assert(
  "countCompletedSets zählt nur completed=true",
  countCompletedSets([
    { completed: true },
    { completed: false },
    { completed: true },
  ]) === 2,
);

assert("countCompletedSets([]) → 0", countCompletedSets([]) === 0);

// ── Abschluss ─────────────────────────────────────────────────────────────────

console.log(`\n${failed === 0 ? "ALLE TESTS BESTANDEN" : `${failed} TEST(S) FEHLGESCHLAGEN`}`);
if (failed > 0) process.exit(1);
