/**
 * Pure Helfer für das Trainingstagebuch (Phase 7C).
 * Keine DB-, React- oder Next.js-Abhängigkeiten — vollständig testbar.
 */

/** Ein gespeicherter Satz (read-only aus workout_set). */
export interface HistorySet {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  completed: boolean;
}

/** Eine Roh-Satzzeile inkl. Übungsbezug (global ODER custom). */
export interface HistorySetRow extends HistorySet {
  exerciseId: string | null;
  customExerciseId: string | null;
  exerciseName: string | null;
  exerciseMuscleGroup: string | null;
  customName: string | null;
  customMuscleGroup: string | null;
}

/** Eine Übung mit ihren Sätzen, gruppiert für die Detailansicht. */
export interface HistoryExerciseGroup {
  /** Eindeutige ID — "g_<id>" für global, "c_<id>" für custom (konsistent mit Phase 7A). */
  uid: string;
  name: string;
  muscleGroup: string;
  isCustom: boolean;
  sets: HistorySet[];
}

/** Baut die UID konsistent zur Übungsbibliothek (Phase 7A). */
export function exerciseUid(kind: "g" | "c", id: string): string {
  return `${kind}_${id}`;
}

/**
 * Formatiert Gewicht × Wiederholungen für die Anzeige.
 * - 60 kg, 8 Wdh.  → "60 kg × 8"
 * - kein Gewicht    → "Körpergewicht × 12"
 * - nur Gewicht     → "40 kg"
 * - nichts Sinnvolles → null (Zeile nicht rendern)
 */
export function formatWeightReps(
  weightKg: number | null,
  reps: number | null,
): string | null {
  const hasWeight = weightKg !== null && weightKg > 0;
  const hasReps = reps !== null && reps > 0;

  if (hasWeight && hasReps) return `${formatKg(weightKg!)} × ${reps}`;
  if (!hasWeight && hasReps) return `Körpergewicht × ${reps}`;
  if (hasWeight && !hasReps) return formatKg(weightKg!);
  return null;
}

/** Kilogramm lesbar (Ganzzahl ohne Nachkomma, sonst mit Komma). */
function formatKg(kg: number): string {
  return Number.isInteger(kg)
    ? `${kg} kg`
    : `${kg.toFixed(1).replace(".", ",")} kg`;
}

/** Formatiert ein Datum deutsch lesbar, z. B. „Di, 10. Juni 2026“. */
export function formatSessionDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Dauer lesbar: „42 Min“ oder „—“. */
export function formatDuration(durationMin: number | null): string {
  if (!durationMin || durationMin <= 0) return "—";
  return `${durationMin} Min`;
}

/** RPE (1–10) → kurzes deutsches Label, null wenn kein Wert. */
export function rpeLabel(rpe: number | null): string | null {
  if (rpe === null || rpe <= 0) return null;
  if (rpe <= 3) return "Leicht";
  if (rpe <= 5) return "Moderat";
  if (rpe <= 7) return "Anstrengend";
  if (rpe <= 9) return "Hart";
  return "Maximal";
}

/**
 * Gruppiert Roh-Satzzeilen nach Übung. Reihenfolge: erstes Auftreten bleibt erhalten.
 * Globale und custom Übungen werden über ihre eindeutige UID getrennt.
 */
export function groupSetsByExercise(
  rows: HistorySetRow[],
): HistoryExerciseGroup[] {
  const groups = new Map<string, HistoryExerciseGroup>();

  for (const row of rows) {
    const isCustom = row.customExerciseId !== null;
    const id = isCustom ? row.customExerciseId : row.exerciseId;
    if (!id) continue; // defensiv: Satz ohne Übungsbezug (sollte per CHECK nie passieren)

    const uid = exerciseUid(isCustom ? "c" : "g", id);
    let group = groups.get(uid);
    if (!group) {
      group = {
        uid,
        name: (isCustom ? row.customName : row.exerciseName) ?? "Unbekannte Übung",
        muscleGroup:
          (isCustom ? row.customMuscleGroup : row.exerciseMuscleGroup) ?? "sonstige",
        isCustom,
        sets: [],
      };
      groups.set(uid, group);
    }
    group.sets.push({
      setNumber: row.setNumber,
      weightKg: row.weightKg,
      reps: row.reps,
      completed: row.completed,
    });
  }

  // Sätze innerhalb jeder Übung nach setNumber sortieren.
  for (const group of groups.values()) {
    group.sets.sort((a, b) => a.setNumber - b.setNumber);
  }

  return Array.from(groups.values());
}

/** Zählt erledigte Sätze. */
export function countCompletedSets(
  sets: ReadonlyArray<{ completed: boolean }>,
): number {
  return sets.reduce((sum, s) => sum + (s.completed ? 1 : 0), 0);
}
