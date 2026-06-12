import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  customExercise,
  exercise,
  workoutDay,
  workoutSession,
  workoutSet,
} from "@/db/schema";
import {
  groupSetsByExercise,
  type HistoryExerciseGroup,
  type HistorySetRow,
} from "./history-helpers";

/**
 * Serverseitige Reads für das Trainingstagebuch (Phase 7C, read-only).
 * Alle Queries sind nach user.id gescoped (Defense-in-Depth zusätzlich zu RLS).
 * Nur abgeschlossene Sessions (status = "completed") sind sichtbar.
 */

const HISTORY_LIMIT = 50;

export interface WorkoutHistoryItem {
  id: string;
  completedAt: Date;
  durationMin: number | null;
  perceivedEffort: number | null; // RPE 1–10
  dayTitle: string | null; // null wenn Session keinem Trainingstag zugeordnet ist
  dayFocus: string | null;
  completedSets: number;
  exerciseCount: number;
}

/**
 * Liste der letzten abgeschlossenen Workouts (max. 50), nach Abschluss absteigend.
 * Zwei Queries (Sessions + aggregierte Satz-Statistik) statt N+1.
 */
export async function getWorkoutHistory(
  userId: string,
): Promise<WorkoutHistoryItem[]> {
  const sessions = await db
    .select({
      id: workoutSession.id,
      completedAt: workoutSession.completedAt,
      durationMin: workoutSession.durationMin,
      perceivedEffort: workoutSession.perceivedEffort,
      dayTitle: workoutDay.title,
      dayFocus: workoutDay.focus,
    })
    .from(workoutSession)
    .leftJoin(workoutDay, eq(workoutSession.workoutDayId, workoutDay.id))
    .where(
      and(
        eq(workoutSession.userId, userId),
        eq(workoutSession.status, "completed"),
      ),
    )
    .orderBy(desc(workoutSession.completedAt))
    .limit(HISTORY_LIMIT);

  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);

  // Aggregierte Satz-Statistik pro Session: erledigte Sätze + eindeutige Übungen.
  const stats = await db
    .select({
      sessionId: workoutSet.sessionId,
      completedSets: sql<number>`count(*) filter (where ${workoutSet.completed})`,
      exerciseCount: sql<number>`count(distinct coalesce(${workoutSet.exerciseId}, ${workoutSet.customExerciseId}))`,
    })
    .from(workoutSet)
    .where(
      and(
        eq(workoutSet.userId, userId),
        inArray(workoutSet.sessionId, sessionIds),
      ),
    )
    .groupBy(workoutSet.sessionId);

  const statsBySession = new Map(
    stats.map((s) => [
      s.sessionId,
      { completedSets: Number(s.completedSets), exerciseCount: Number(s.exerciseCount) },
    ]),
  );

  return sessions.map((s) => {
    const stat = statsBySession.get(s.id);
    return {
      id: s.id,
      // Abgeschlossene Sessions haben immer ein completedAt; defensiver Fallback.
      completedAt: s.completedAt ?? new Date(0),
      durationMin: s.durationMin,
      perceivedEffort: s.perceivedEffort,
      dayTitle: s.dayTitle,
      dayFocus: s.dayFocus,
      completedSets: stat?.completedSets ?? 0,
      exerciseCount: stat?.exerciseCount ?? 0,
    };
  });
}

export interface WorkoutSessionDetail {
  id: string;
  completedAt: Date;
  durationMin: number | null;
  perceivedEffort: number | null;
  soreness: number | null;
  mood: number | null;
  dayTitle: string | null;
  dayFocus: string | null;
  exercises: HistoryExerciseGroup[];
}

/**
 * Detail einer abgeschlossenen Session inkl. gruppierter Übungen/Sätze.
 * Gibt null zurück, wenn die Session nicht existiert, nicht dem Nutzer gehört
 * oder nicht abgeschlossen ist.
 */
export async function getWorkoutSessionDetail(
  sessionId: string,
  userId: string,
): Promise<WorkoutSessionDetail | null> {
  const [session] = await db
    .select({
      id: workoutSession.id,
      completedAt: workoutSession.completedAt,
      durationMin: workoutSession.durationMin,
      perceivedEffort: workoutSession.perceivedEffort,
      soreness: workoutSession.soreness,
      mood: workoutSession.mood,
      status: workoutSession.status,
      dayTitle: workoutDay.title,
      dayFocus: workoutDay.focus,
    })
    .from(workoutSession)
    .leftJoin(workoutDay, eq(workoutSession.workoutDayId, workoutDay.id))
    .where(
      and(
        eq(workoutSession.id, sessionId),
        eq(workoutSession.userId, userId),
        eq(workoutSession.status, "completed"),
      ),
    )
    .limit(1);

  if (!session) return null;

  const rows = await db
    .select({
      setNumber: workoutSet.setNumber,
      weightKg: workoutSet.weightKg,
      reps: workoutSet.reps,
      completed: workoutSet.completed,
      exerciseId: workoutSet.exerciseId,
      customExerciseId: workoutSet.customExerciseId,
      exerciseName: exercise.name,
      exerciseMuscleGroup: exercise.muscleGroup,
      customName: customExercise.name,
      customMuscleGroup: customExercise.muscleGroup,
    })
    .from(workoutSet)
    .leftJoin(exercise, eq(workoutSet.exerciseId, exercise.id))
    // Custom-Join zusätzlich user-scoped (Defense-in-Depth zu RLS).
    .leftJoin(
      customExercise,
      and(
        eq(workoutSet.customExerciseId, customExercise.id),
        eq(customExercise.userId, userId),
      ),
    )
    .where(
      and(
        eq(workoutSet.sessionId, sessionId),
        eq(workoutSet.userId, userId),
      ),
    )
    .orderBy(workoutSet.setNumber);

  const exercises = groupSetsByExercise(rows as HistorySetRow[]);

  return {
    id: session.id,
    completedAt: session.completedAt ?? new Date(0),
    durationMin: session.durationMin,
    perceivedEffort: session.perceivedEffort,
    soreness: session.soreness,
    mood: session.mood,
    dayTitle: session.dayTitle,
    dayFocus: session.dayFocus,
    exercises,
  };
}
