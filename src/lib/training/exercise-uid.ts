/**
 * UID-Schema für Übungsreferenzen (konsistent mit Phase 7A/7C).
 * "g_<uuid>" → globale Katalog-Übung, "c_<uuid>" → eigene Übung.
 * Pure Logik ohne DB/React — vollständig testbar.
 */

export type ExerciseRefKind = "global" | "custom";

export interface ParsedExerciseUid {
  kind: ExerciseRefKind;
  id: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Baut eine Übungs-UID. */
export function buildExerciseUid(kind: ExerciseRefKind, id: string): string {
  return `${kind === "global" ? "g" : "c"}_${id}`;
}

/**
 * Parst eine Übungs-UID. Gibt null zurück bei ungültigem Präfix oder UUID.
 * Akzeptiert ausschließlich "g_<uuid>" und "c_<uuid>".
 */
export function parseExerciseUid(uid: unknown): ParsedExerciseUid | null {
  if (typeof uid !== "string" || uid.length < 3) return null;
  const prefix = uid.slice(0, 2);
  const id = uid.slice(2);
  if (!UUID_RE.test(id)) return null;
  if (prefix === "g_") return { kind: "global", id };
  if (prefix === "c_") return { kind: "custom", id };
  return null;
}
