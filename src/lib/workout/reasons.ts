/**
 * Gründe für Übungs-Feedback (Phase 4). Pure Konstanten/Helfer — werden
 * client- und serverseitig sowie in Tests genutzt.
 */

export const FEEDBACK_REASONS = [
  "dislike",
  "pain",
  "too_hard",
  "too_easy",
  "no_equipment",
  "other",
] as const;

export type FeedbackReason = (typeof FEEDBACK_REASONS)[number];

export const FEEDBACK_REASON_LABELS: Record<FeedbackReason, string> = {
  dislike: "Gefällt mir nicht",
  pain: "Schmerzen",
  too_hard: "Zu schwer",
  too_easy: "Zu leicht",
  no_equipment: "Kein Equipment",
  other: "Anderer Grund",
};

/** Markiert Feedback mit Schmerz-Bezug (löst den medizinischen Hinweis aus). */
export function isPainReason(reason: string | null | undefined): boolean {
  return reason === "pain";
}
