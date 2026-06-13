/**
 * Phase 9 — Team-Challenge: reine Scoring-/Status-Logik.
 *
 * Bewusst frei von DB-/Server-Imports, damit alles unit-testbar ist
 * (siehe scripts/qa-phase9-team-challenge-smoke.ts).
 *
 * Punkte werden ausschließlich aus vorhandenen Tagessignalen abgeleitet —
 * niemals manuell vergeben, niemals aus sensiblen Körper-/Ernährungsdetails.
 */

import type { ChallengeStatus } from "@/lib/validation/challenge";

/* ------------------------------------------------------------------ */
/* Punkte-Konstanten                                                  */
/* ------------------------------------------------------------------ */

export const POINTS = {
  workout: 30,
  steps: 20,
  nutrition: 15,
  water: 10,
  habit: 10,
  reaction: 5,
  /** Einmaliger Wochenbonus für abgeschlossenen Körper-Check-in. */
  bodyCheckin: 50,
} as const;

/** Anti-Spam: maximal so viele Habits/Reaktionen zählen pro Tag. */
export const HABIT_DAILY_CAP = 3;
export const REACTION_DAILY_CAP = 3;

/** Standard-Schrittziel im MVP (später individuell konfigurierbar). */
export const DEFAULT_STEPS_GOAL = 8000;

/* ------------------------------------------------------------------ */
/* Tages-Score                                                        */
/* ------------------------------------------------------------------ */

export interface DailyScoreInput {
  /** Mindestens eine abgeschlossene Trainingseinheit an diesem Tag. */
  workoutCompleted: boolean;
  /** Schrittziel an diesem Tag erreicht. */
  stepsGoalReached: boolean;
  /** Ernährung an diesem Tag geloggt (Protein oder Mahlzeiten). */
  nutritionLogged: boolean;
  /** Wasserziel an diesem Tag erreicht. */
  waterGoalReached: boolean;
  /** Anzahl an diesem Tag abgehakter Habits. */
  habitsCompleted: number;
  /** Anzahl gesendeter Motivations-Reaktionen an diesem Tag. */
  reactionsSent: number;
}

function clampCount(n: number, cap: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.floor(n), cap);
}

/** Punkte für genau einen Tag. Reine Summe der erfüllten Signale. */
export function calculateDailyScore(input: DailyScoreInput): number {
  let score = 0;
  if (input.workoutCompleted) score += POINTS.workout;
  if (input.stepsGoalReached) score += POINTS.steps;
  if (input.nutritionLogged) score += POINTS.nutrition;
  if (input.waterGoalReached) score += POINTS.water;
  score += clampCount(input.habitsCompleted, HABIT_DAILY_CAP) * POINTS.habit;
  score += clampCount(input.reactionsSent, REACTION_DAILY_CAP) * POINTS.reaction;
  return score;
}

/** Summe der Tages-Scores über einen Zeitraum (z. B. 7 Tage). */
export function calculateWeeklyScore(days: DailyScoreInput[]): number {
  return days.reduce((sum, day) => sum + calculateDailyScore(day), 0);
}

/** Schrittziel erreicht? `null` = noch keine Schritte erfasst. */
export function isStepsGoalReached(
  steps: number | null,
  goal: number = DEFAULT_STEPS_GOAL,
): boolean {
  return steps != null && steps >= goal;
}

/* ------------------------------------------------------------------ */
/* Offene Punktequellen / Tagesstatus                                 */
/* ------------------------------------------------------------------ */

export type PointSourceKey =
  | "workout"
  | "steps"
  | "nutrition"
  | "water"
  | "habit";

export interface PointSource {
  key: PointSourceKey;
  label: string;
}

export const POINT_SOURCE_LABELS: Record<PointSourceKey, string> = {
  workout: "Training",
  steps: "Schritte",
  nutrition: "Ernährung",
  water: "Wasser",
  habit: "Habit",
};

/** Heute noch offene Punktequellen — Basis für „Heute offen"-Chips. */
export function getOpenPointSources(input: DailyScoreInput): PointSource[] {
  const open: PointSource[] = [];
  if (!input.workoutCompleted)
    open.push({ key: "workout", label: POINT_SOURCE_LABELS.workout });
  if (!input.stepsGoalReached)
    open.push({ key: "steps", label: POINT_SOURCE_LABELS.steps });
  if (!input.nutritionLogged)
    open.push({ key: "nutrition", label: POINT_SOURCE_LABELS.nutrition });
  if (!input.waterGoalReached)
    open.push({ key: "water", label: POINT_SOURCE_LABELS.water });
  if (input.habitsCompleted <= 0)
    open.push({ key: "habit", label: POINT_SOURCE_LABELS.habit });
  return open;
}

export interface MemberDailyStatus {
  workoutDone: boolean;
  nutritionLogged: boolean;
  waterGoalReached: boolean;
  stepsGoalReached: boolean;
  steps: number | null;
  habitsCompleted: number;
  openSources: PointSource[];
  activeToday: boolean;
  dailyScore: number;
}

export interface MemberDailyStatusInput extends DailyScoreInput {
  steps: number | null;
}

/** Verdichteter Tagesstatus eines Mitglieds für die Member-Karten. */
export function getMemberDailyStatus(
  input: MemberDailyStatusInput,
): MemberDailyStatus {
  const activeToday =
    input.workoutCompleted ||
    input.stepsGoalReached ||
    input.nutritionLogged ||
    input.waterGoalReached ||
    input.habitsCompleted > 0;

  return {
    workoutDone: input.workoutCompleted,
    nutritionLogged: input.nutritionLogged,
    waterGoalReached: input.waterGoalReached,
    stepsGoalReached: input.stepsGoalReached,
    steps: input.steps,
    habitsCompleted: input.habitsCompleted,
    openSources: getOpenPointSources(input),
    activeToday,
    dailyScore: calculateDailyScore(input),
  };
}

/* ------------------------------------------------------------------ */
/* Soft-Ranking / Leaderboard                                         */
/* ------------------------------------------------------------------ */

export interface LeaderboardMemberInput {
  userId: string;
  displayName: string;
  score: number;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
  /** Standard-Competition-Ranking: Gleichstand teilt den Rang (1, 2, 2, 4). */
  rank: number;
  isCurrentUser: boolean;
}

/**
 * Soft-Ranking: nach Score absteigend, bei Gleichstand alphabetisch (stabil).
 * Gleichstand teilt sich den Rang — kein Bloßstellen, kein „letzter Platz".
 */
export function buildLeaderboard(
  members: LeaderboardMemberInput[],
  currentUserId: string,
): LeaderboardEntry[] {
  const sorted = [...members].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.displayName.localeCompare(b.displayName, "de");
  });

  let rank = 0;
  let prevScore: number | null = null;

  return sorted.map((m, i) => {
    if (prevScore === null || m.score !== prevScore) {
      rank = i + 1;
      prevScore = m.score;
    }
    return {
      userId: m.userId,
      displayName: m.displayName,
      score: m.score,
      rank,
      isCurrentUser: m.userId === currentUserId,
    };
  });
}

/** Eintrag des aktuellen Nutzers im Leaderboard (oder null). */
export function findOwnRank(
  leaderboard: LeaderboardEntry[],
): LeaderboardEntry | null {
  return leaderboard.find((e) => e.isCurrentUser) ?? null;
}

/* ------------------------------------------------------------------ */
/* Support-Hinweise (support-orientiert, nie beschämend)              */
/* ------------------------------------------------------------------ */

export interface SupportHintInput {
  userId: string;
  displayName: string;
  activeToday: boolean;
  isCurrentUser: boolean;
}

export interface SupportHint {
  userId: string;
  displayName: string;
  message: string;
  tone: "nudge" | "celebrate";
}

/** Wieviele Nudges maximal angezeigt werden (kein Pranger). */
export const MAX_SUPPORT_HINTS = 3;

/**
 * „Wer braucht heute einen Schubs?" — nur Teammitglieder (nicht man selbst),
 * unterstützende Sprache. Sind alle aktiv, gibt es einen Feier-Hinweis.
 */
export function buildSupportHints(members: SupportHintInput[]): SupportHint[] {
  const inactiveOthers = members.filter(
    (m) => !m.isCurrentUser && !m.activeToday,
  );

  if (inactiveOthers.length === 0) {
    const hasTeammates = members.some((m) => !m.isCurrentUser);
    if (!hasTeammates) return [];
    return [
      {
        userId: "team",
        displayName: "Team",
        message: "Stark — heute war schon das ganze Team aktiv.",
        tone: "celebrate",
      },
    ];
  }

  return inactiveOthers.slice(0, MAX_SUPPORT_HINTS).map((m) => ({
    userId: m.userId,
    displayName: m.displayName,
    message: `${m.displayName} war heute noch nicht aktiv — schick einen Push.`,
    tone: "nudge" as const,
  }));
}

/* ------------------------------------------------------------------ */
/* Challenge-Label / Restdauer                                        */
/* ------------------------------------------------------------------ */

/** Tage zwischen zwei ISO-Daten (YYYY-MM-DD), UTC-stabil. */
export function daysBetween(fromIso: string, toIso: string): number {
  const toUtcDays = (iso: string): number => {
    const [y, m, d] = iso.split("-").map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  };
  return toUtcDays(toIso) - toUtcDays(fromIso);
}

export interface ChallengeLabelInput {
  title: string;
  startsOn: string;
  endsOn: string;
  status: ChallengeStatus;
}

/**
 * Verbleibende Tage einer laufenden Challenge bezogen auf heute.
 * Negativ/0 bedeutet beendet bzw. letzter Tag.
 */
export function getChallengeDaysRemaining(
  endsOn: string,
  todayStr: string,
): number {
  return daysBetween(todayStr, endsOn);
}

/** Kompaktes Label, z. B. „Sommerform · noch 12 Tage". */
export function buildChallengeLabel(
  input: ChallengeLabelInput,
  todayStr: string,
): string {
  if (input.status !== "active") {
    return `${input.title} · abgeschlossen`;
  }
  if (todayStr < input.startsOn) {
    const untilStart = daysBetween(todayStr, input.startsOn);
    return `${input.title} · startet in ${untilStart} ${untilStart === 1 ? "Tag" : "Tagen"}`;
  }
  const remaining = getChallengeDaysRemaining(input.endsOn, todayStr);
  if (remaining < 0) return `${input.title} · abgeschlossen`;
  if (remaining === 0) return `${input.title} · letzter Tag`;
  return `${input.title} · noch ${remaining} ${remaining === 1 ? "Tag" : "Tage"}`;
}

/* ------------------------------------------------------------------ */
/* Gewinner-Bestimmung                                                */
/* ------------------------------------------------------------------ */

export interface WinnerResult {
  isTie: boolean;
  winner: { userId: string; displayName: string; score: number } | null;
}

/**
 * Bestimmt den Gewinner aus einem fertigen Leaderboard.
 * Gleichstand → isTie = true, kein einzelner Sieger.
 * Keine negative Sprache, keine Verlierer-Markierung.
 */
export function determineChallengeWinner(
  leaderboard: LeaderboardEntry[],
): WinnerResult {
  if (leaderboard.length === 0) {
    return { isTie: false, winner: null };
  }
  const top = leaderboard[0];
  const tiedCount = leaderboard.filter((e) => e.rank === 1).length;
  if (tiedCount > 1) {
    return { isTie: true, winner: null };
  }
  return {
    isTie: false,
    winner: { userId: top.userId, displayName: top.displayName, score: top.score },
  };
}

/* ------------------------------------------------------------------ */
/* Privacy-Mapper                                                     */
/* ------------------------------------------------------------------ */

/**
 * Felder, die im Social-/Team-Kontext niemals sichtbar sein dürfen
 * (Gewicht, Körpermaße, Kalorien, Protein, Health-/Safety-Daten).
 * Vergleich erfolgt normalisiert (lowercase, ohne _ - Leerzeichen).
 */
export const SENSITIVE_FIELD_KEYS: readonly string[] = [
  "weight",
  "weightkg",
  "targetweightkg",
  "bodyfat",
  "bodyfatpct",
  "calories",
  "calorieskcal",
  "kcal",
  "protein",
  "proteing",
  "height",
  "heightcm",
  "waist",
  "waistcm",
  "arm",
  "armcm",
  "chest",
  "chestcm",
  "hip",
  "hipcm",
  "thigh",
  "thighcm",
  "valuecm",
  "bmi",
  "measurement",
  "measurements",
  "bodymetrics",
  "bodymeasurement",
];

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[_\s-]/g, "");
}

/** Entfernt alle sensiblen Felder aus einem Objekt (neues Objekt). */
export function stripSensitiveFields<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELD_KEYS.includes(normalizeKey(key))) continue;
    out[key] = value;
  }
  return out;
}

/** True, wenn ein Objekt KEIN sensibles Feld enthält (für Tests/Guards). */
export function hasNoSensitiveFields(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).every(
    (key) => !SENSITIVE_FIELD_KEYS.includes(normalizeKey(key)),
  );
}

export interface SafeMealStatus {
  logged: number;
  total: number;
}

/**
 * Mahlzeiten-Status auf reine Zähler reduzieren — nur Häkchen, keine
 * Kalorien-/Protein-Details. Keine Beschreibung wird erfunden.
 */
export function sanitizeSocialMealStatus(
  mealsStatus: Record<string, boolean> | null | undefined,
): SafeMealStatus {
  if (!mealsStatus) return { logged: 0, total: 0 };
  const values = Object.values(mealsStatus);
  return { logged: values.filter(Boolean).length, total: values.length };
}

/* ------------------------------------------------------------------ */
/* Zugriffs-Helper Member-Detail                                      */
/* ------------------------------------------------------------------ */

/**
 * Darf der Betrachter das Detail des Zielnutzers sehen?
 * Nur das eigene Profil oder Mitglieder des gemeinsamen Teams.
 */
export function canViewMemberDetail(
  viewerUserId: string,
  targetUserId: string,
  sharedMemberUserIds: string[],
): boolean {
  if (viewerUserId === targetUserId) return true;
  return sharedMemberUserIds.includes(targetUserId);
}
