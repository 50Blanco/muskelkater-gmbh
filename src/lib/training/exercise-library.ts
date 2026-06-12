import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customExercise, exercise } from "@/db/schema";
import type { LibraryExercise } from "./exercise-filters";

/**
 * Lädt alle globalen Übungen und die custom Übungen des Nutzers.
 * Gibt eine gemischte Liste zurück — IDs haben Präfix "g_"/"c_" gegen Kollisionen.
 * Serverseitig; kein Client-Import erlaubt.
 */
export async function getExerciseLibrary(userId: string): Promise<LibraryExercise[]> {
  const [globals, customs] = await Promise.all([
    db
      .select({
        id: exercise.id,
        slug: exercise.slug,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        equipment: exercise.equipment,
        location: exercise.location,
        level: exercise.level,
        isCompound: exercise.isCompound,
        instructions: exercise.instructions,
      })
      .from(exercise)
      .orderBy(asc(exercise.name)),
    db
      .select({
        id: customExercise.id,
        name: customExercise.name,
        muscleGroup: customExercise.muscleGroup,
        equipment: customExercise.equipment,
        location: customExercise.location,
        level: customExercise.level,
        instructions: customExercise.instructions,
      })
      .from(customExercise)
      .where(eq(customExercise.userId, userId))
      .orderBy(asc(customExercise.name)),
  ]);

  const globalItems: LibraryExercise[] = globals.map((ex) => ({
    uid: `g_${ex.id}`,
    source: "global",
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    equipment: ex.equipment,
    location: ex.location,
    level: ex.level,
    instructions: ex.instructions,
    slug: ex.slug,
    isCompound: ex.isCompound,
  }));

  const customItems: LibraryExercise[] = customs.map((ex) => ({
    uid: `c_${ex.id}`,
    source: "custom",
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    equipment: ex.equipment,
    location: ex.location,
    level: ex.level,
    instructions: ex.instructions,
  }));

  return [...globalItems, ...customItems];
}

/** Einzelne Übung aus der Library anhand von uid ("g_<id>" oder "c_<id>"). */
export async function getExerciseByUid(
  uid: string,
  userId: string,
): Promise<LibraryExercise | null> {
  if (uid.startsWith("g_")) {
    const id = uid.slice(2);
    const [row] = await db
      .select()
      .from(exercise)
      .where(eq(exercise.id, id))
      .limit(1);
    if (!row) return null;
    return {
      uid,
      source: "global",
      name: row.name,
      muscleGroup: row.muscleGroup,
      equipment: row.equipment,
      location: row.location,
      level: row.level,
      instructions: row.instructions,
      slug: row.slug,
      isCompound: row.isCompound,
    };
  }

  if (uid.startsWith("c_")) {
    const id = uid.slice(2);
    const [row] = await db
      .select()
      .from(customExercise)
      .where(eq(customExercise.id, id))
      // Defense-in-Depth: nur eigene Custom-Übungen, zusätzlich zu RLS
      .limit(1);
    if (!row || row.userId !== userId) return null;
    return {
      uid,
      source: "custom",
      name: row.name,
      muscleGroup: row.muscleGroup,
      equipment: row.equipment,
      location: row.location,
      level: row.level,
      instructions: row.instructions,
    };
  }

  return null;
}
