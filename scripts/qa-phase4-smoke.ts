/**
 * QA-Smoke-Test für die puren Phase-4-Module:
 * Workout-Validierung (Zod), Alternativ-Auswahl, Dauer-Berechnung und
 * Feedback-Gründe. Reine Logik, keine DB/React.
 *
 * Ausführen: npx tsx scripts/qa-phase4-smoke.ts
 */
import {
  customExerciseSchema,
  finishWorkoutSchema,
  workoutSetInputSchema,
} from "../src/lib/validation/workout";
import {
  findAlternatives,
  locationMatches,
  type SlimExercise,
} from "../src/lib/workout/alternatives";
import {
  computeDurationMin,
  countCompletedSets,
} from "../src/lib/workout/session-helpers";
import { isPainReason } from "../src/lib/workout/reasons";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} — ${label}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
}

const EX1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CUSTOM1 = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const SESSION = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const DAY = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

/* --- Satz-Validierung: genau eine Übungsreferenz --- */
const catalogSet = workoutSetInputSchema.safeParse({
  exerciseId: EX1,
  customExerciseId: null,
  setNumber: 1,
  weightKg: "52,5",
  reps: "10",
  completed: true,
});
check("Satz mit Katalog-Übung ist gültig", catalogSet.success);
check(
  "Gewicht '52,5' wird zu 52.5 geparst",
  catalogSet.success && catalogSet.data.weightKg === 52.5,
);
check(
  "Wiederholungen '10' werden zu 10 geparst",
  catalogSet.success && catalogSet.data.reps === 10,
);

const customSet = workoutSetInputSchema.safeParse({
  exerciseId: null,
  customExerciseId: CUSTOM1,
  setNumber: 1,
  weightKg: "",
  reps: "8",
  completed: false,
});
check("Satz mit eigener Übung ist gültig", customSet.success);
check(
  "Leeres Gewicht wird zu null",
  customSet.success && customSet.data.weightKg === null,
);

check(
  "Satz mit BEIDEN Referenzen wird abgelehnt",
  !workoutSetInputSchema.safeParse({
    exerciseId: EX1,
    customExerciseId: CUSTOM1,
    setNumber: 1,
    weightKg: "10",
    reps: "10",
    completed: true,
  }).success,
);
check(
  "Satz OHNE Referenz wird abgelehnt",
  !workoutSetInputSchema.safeParse({
    exerciseId: null,
    customExerciseId: null,
    setNumber: 1,
    weightKg: "10",
    reps: "10",
    completed: true,
  }).success,
);

/* --- Eigene Übung --- */
const customOk = customExerciseSchema.safeParse({
  name: "Bulgarian Split Squat",
  muscleGroup: "legs",
});
check("Eigene Übung (Minimal) gültig + Defaults", customOk.success);
check(
  "Default Equipment = bodyweight, Ort = both, Level = beginner",
  customOk.success &&
    customOk.data.equipment === "bodyweight" &&
    customOk.data.location === "both" &&
    customOk.data.level === "beginner",
);
check(
  "Eigene Übung mit zu kurzem Namen wird abgelehnt",
  !customExerciseSchema.safeParse({ name: "A", muscleGroup: "legs" }).success,
);
check(
  "Eigene Übung mit ungültiger Muskelgruppe wird abgelehnt",
  !customExerciseSchema.safeParse({ name: "Test", muscleGroup: "xyz" }).success,
);

/* --- Workout abschließen --- */
const finishOk = finishWorkoutSchema.safeParse({
  sessionId: SESSION,
  dayId: DAY,
  durationMin: null,
  perceivedEffort: 7,
  mood: null,
  soreness: null,
  sets: [
    {
      exerciseId: EX1,
      customExerciseId: null,
      setNumber: 1,
      weightKg: "50",
      reps: "10",
      completed: true,
    },
  ],
  feedback: [{ exerciseId: EX1, preference: "dislike", reason: "pain" }],
});
check("finishWorkout-Payload gültig", finishOk.success);
check(
  "RPE > 10 wird abgelehnt",
  !finishWorkoutSchema.safeParse({
    sessionId: SESSION,
    dayId: DAY,
    perceivedEffort: 11,
    sets: [],
    feedback: [],
  }).success,
);

/* --- Alternativen --- */
const catalog: SlimExercise[] = [
  { id: "a", name: "Bankdrücken", muscleGroup: "chest", equipment: "barbell", location: "gym", level: "intermediate", instructions: null },
  { id: "b", name: "Liegestütz", muscleGroup: "chest", equipment: "bodyweight", location: "both", level: "beginner", instructions: null },
  { id: "c", name: "Schrägbankdrücken", muscleGroup: "chest", equipment: "dumbbell", location: "gym", level: "intermediate", instructions: null },
  { id: "d", name: "Klimmzug", muscleGroup: "back", equipment: "bodyweight", location: "both", level: "advanced", instructions: null },
];
const altGym = findAlternatives(catalog, { id: "a", muscleGroup: "chest", location: "gym" }, 4);
check("Alternativen: nur gleiche Muskelgruppe, ohne sich selbst", altGym.length === 2);
check("Alternativen: keine fremde Muskelgruppe (kein 'back')", altGym.every((e) => e.muscleGroup === "chest"));
check("Alternativen: aktuelle Übung ausgeschlossen", altGym.every((e) => e.id !== "a"));
check("Alternativen: deterministisch alphabetisch", altGym[0].name === "Liegestütz");

const altHome = findAlternatives(catalog, { id: "a", muscleGroup: "chest", location: "home" }, 4);
check("Alternativen Zuhause: Gym-only ausgeschlossen", altHome.length === 1 && altHome[0].id === "b");

check("locationMatches: both passt zu gym", locationMatches("both", "gym"));
check("locationMatches: home passt NICHT zu gym", !locationMatches("home", "gym"));
check("locationMatches: ohne Wunsch immer ok", locationMatches("gym", null));

/* --- Dauer --- */
check("Dauer 10:00→10:45 = 45 Min", computeDurationMin("2026-06-11T10:00:00Z", "2026-06-11T10:45:00Z") === 45);
check("Dauer Ende < Start = 0", computeDurationMin("2026-06-11T11:00:00Z", "2026-06-11T10:00:00Z") === 0);
check("Dauer gedeckelt bei 600", computeDurationMin("2026-06-11T00:00:00Z", "2026-06-12T00:00:00Z") === 600);

/* --- Sätze zählen --- */
check(
  "countCompletedSets zählt nur erledigte",
  countCompletedSets([{ completed: true }, { completed: false }, { completed: true }]) === 2,
);

/* --- Schmerz-Feedback --- */
check("isPainReason('pain') = true", isPainReason("pain"));
check("isPainReason('dislike') = false", !isPainReason("dislike"));
check("isPainReason(null) = false", !isPainReason(null));

console.log(failures === 0 ? "\nALLE TESTS BESTANDEN" : `\n${failures} TEST(S) FEHLGESCHLAGEN`);
process.exit(failures === 0 ? 0 : 1);
