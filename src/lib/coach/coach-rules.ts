/**
 * Phase 15 — Regelbasierte Coach-Engine.
 * Pure functions. Kein DB. Kein KI. Kein Server-Import. Vollständig unit-testbar.
 *
 * Invarianten:
 * - Keine Körpermesswerte in Outputs (Gewicht, Maße, Kalorien, Protein)
 * - Keine Schuld-/Scham-Sprache
 * - Kurze, klare Texte
 */

export type CoachSection = "heute" | "team" | "challenge" | "woche";
export type CoachTone = "positive" | "neutral" | "nudge";

export interface CoachHint {
  id: string;
  section: CoachSection;
  text: string;
  tone: CoachTone;
}

/* ------------------------------------------------------------------ */
/* Heute-Coach                                                        */
/* ------------------------------------------------------------------ */

export interface TodayCoachInput {
  workoutDone: boolean;
  nutritionLogged: boolean;
  waterGoalReached: boolean;
  stepsGoalReached: boolean;
  habitsCompleted: number;
  checkinDoneThisWeek: boolean;
}

export function getTodayHints(input: TodayCoachInput): CoachHint[] {
  const hints: CoachHint[] = [];

  const allDone =
    input.workoutDone &&
    input.nutritionLogged &&
    input.waterGoalReached &&
    input.stepsGoalReached &&
    input.habitsCompleted > 0;

  const nothingDone =
    !input.workoutDone &&
    !input.nutritionLogged &&
    !input.waterGoalReached &&
    !input.stepsGoalReached &&
    input.habitsCompleted === 0;

  if (allDone) {
    hints.push({
      id: "today_all_done",
      section: "heute",
      text: "Alle Tages-Signale erledigt — das ist ein starker Tag.",
      tone: "positive",
    });
  } else if (nothingDone) {
    hints.push({
      id: "today_nothing_done",
      section: "heute",
      text: "Heute noch alles offen — ein kleiner Schritt reicht zum Anfangen.",
      tone: "nudge",
    });
  } else {
    if (input.workoutDone) {
      hints.push({
        id: "today_workout_done",
        section: "heute",
        text: "Training heute erledigt — gute Arbeit.",
        tone: "positive",
      });
    }
  }

  if (!allDone) {
    // Offene Signale, absteigend nach Punktwert
    if (!input.workoutDone) {
      hints.push({
        id: "today_workout_open",
        section: "heute",
        text: "Ein Workout heute holt die meisten Punkte — für dich und dein Team.",
        tone: "nudge",
      });
    }
    if (!input.stepsGoalReached) {
      hints.push({
        id: "today_steps_open",
        section: "heute",
        text: "Schrittziel noch offen — ein kurzer Spaziergang zählt.",
        tone: "nudge",
      });
    }
    if (!input.nutritionLogged) {
      hints.push({
        id: "today_nutrition_open",
        section: "heute",
        text: "Ernährung noch nicht geloggt — trag deine erste Mahlzeit ein.",
        tone: "nudge",
      });
    }
    if (!input.waterGoalReached) {
      hints.push({
        id: "today_water_open",
        section: "heute",
        text: "Wasserziel noch offen — ein Glas mehr reicht oft.",
        tone: "nudge",
      });
    }
    if (input.habitsCompleted === 0) {
      hints.push({
        id: "today_habits_open",
        section: "heute",
        text: "Heute noch keine Habit abgehakt — kurz reinschauen lohnt sich.",
        tone: "nudge",
      });
    }
  }

  if (!input.checkinDoneThisWeek) {
    hints.push({
      id: "today_checkin_open",
      section: "heute",
      text: "Wochen-Check-in noch offen — bringt +50 Bonus-Punkte.",
      tone: "nudge",
    });
  } else {
    hints.push({
      id: "today_checkin_done",
      section: "heute",
      text: "Wochen-Check-in erledigt.",
      tone: "positive",
    });
  }

  return hints;
}

/* ------------------------------------------------------------------ */
/* Team-Coach                                                         */
/* ------------------------------------------------------------------ */

export interface TeamCoachInput {
  hasTeam: boolean;
  memberCount: number;
  inactiveMembersToday: number;
  allMembersActive: boolean;
}

export function getTeamHints(input: TeamCoachInput): CoachHint[] {
  if (!input.hasTeam) {
    return [
      {
        id: "team_no_team",
        section: "team",
        text: "Du bist noch in keinem Team — trete einem bei oder erstelle eines.",
        tone: "neutral",
      },
    ];
  }

  const hints: CoachHint[] = [];

  if (input.memberCount <= 1) {
    hints.push({
      id: "team_solo",
      section: "team",
      text: "Du bist noch allein im Team — lad jemanden ein, dann startet die Challenge richtig.",
      tone: "neutral",
    });
    return hints;
  }

  if (input.allMembersActive) {
    hints.push({
      id: "team_all_active",
      section: "team",
      text: "Dein Team ist heute vollständig aktiv — stark.",
      tone: "positive",
    });
  } else if (input.inactiveMembersToday > 0) {
    const n = input.inactiveMembersToday;
    hints.push({
      id: "team_inactive_members",
      section: "team",
      text:
        n === 1
          ? "Noch ein Mitglied heute inaktiv — ein motivierender Push kann helfen."
          : `Noch ${n} Mitglieder heute inaktiv — sende ihnen Motivation.`,
      tone: "nudge",
    });
  }

  return hints;
}

/* ------------------------------------------------------------------ */
/* Challenge-Coach                                                    */
/* ------------------------------------------------------------------ */

export interface ChallengeCoachInput {
  hasChallenge: boolean;
  isActive: boolean;
  challengeTitle: string | null;
  daysRemaining: number | null;
  ownRank: number | null;
  totalMembers: number;
  ownOpenSourceCount: number;
}

export function getChallengeHints(input: ChallengeCoachInput): CoachHint[] {
  if (!input.hasChallenge) {
    return [
      {
        id: "challenge_none",
        section: "challenge",
        text: "Noch keine Challenge aktiv — starte eine mit deinem Team.",
        tone: "neutral",
      },
    ];
  }

  const hints: CoachHint[] = [];

  if (!input.isActive) {
    hints.push({
      id: "challenge_finished",
      section: "challenge",
      text: "Challenge abgeschlossen — schau dir das Ergebnis auf der Team-Seite an.",
      tone: "neutral",
    });
    return hints;
  }

  const { daysRemaining, ownRank, totalMembers, ownOpenSourceCount } = input;

  if (daysRemaining === 0) {
    hints.push({
      id: "challenge_last_day",
      section: "challenge",
      text: "Heute ist der letzte Tag der Challenge — jeder Punkt zählt.",
      tone: "nudge",
    });
  } else if (daysRemaining !== null && daysRemaining <= 3) {
    const tagText = daysRemaining === 1 ? "Tag" : "Tage";
    hints.push({
      id: "challenge_final_stretch",
      section: "challenge",
      text: `Noch ${daysRemaining} ${tagText} — die Schlussphase entscheidet.`,
      tone: "nudge",
    });
  } else if (daysRemaining !== null && daysRemaining <= 7) {
    hints.push({
      id: "challenge_week_left",
      section: "challenge",
      text: `Noch ${daysRemaining} Tage in der Challenge — bleib konstant.`,
      tone: "neutral",
    });
  } else {
    hints.push({
      id: "challenge_active",
      section: "challenge",
      text: "Challenge läuft — jeder aktive Tag gibt Punkte.",
      tone: "neutral",
    });
  }

  if (ownRank !== null && totalMembers > 1) {
    if (ownRank === 1) {
      hints.push({
        id: "challenge_rank_first",
        section: "challenge",
        text: "Du liegst gerade vorne — Konstanz hält die Position.",
        tone: "positive",
      });
    } else if (ownOpenSourceCount > 0) {
      hints.push({
        id: "challenge_rank_open",
        section: "challenge",
        text: "Heute noch offene Punkte — du kannst aufholen.",
        tone: "nudge",
      });
    }
  }

  return hints;
}

/* ------------------------------------------------------------------ */
/* Wochen-Coach                                                       */
/* ------------------------------------------------------------------ */

export interface WeekCoachInput {
  activeDaysCount: number;
  workoutCount: number;
  nutritionDaysCount: number;
  stepsGoalDays: number;
  checkinDoneThisWeek: boolean;
  daysElapsedInWeek: number;
}

export function getWeekHints(input: WeekCoachInput): CoachHint[] {
  const {
    activeDaysCount,
    workoutCount,
    nutritionDaysCount,
    checkinDoneThisWeek,
    daysElapsedInWeek,
  } = input;
  const hints: CoachHint[] = [];

  if (activeDaysCount === 0 && daysElapsedInWeek >= 2) {
    hints.push({
      id: "week_no_active_days",
      section: "woche",
      text: "Diese Woche noch kein aktiver Tag — heute wäre ein guter Zeitpunkt.",
      tone: "nudge",
    });
  } else if (activeDaysCount >= 5) {
    hints.push({
      id: "week_many_active_days",
      section: "woche",
      text: `${activeDaysCount} aktive Tage diese Woche — stark durchgezogen.`,
      tone: "positive",
    });
  } else if (activeDaysCount >= 3) {
    hints.push({
      id: "week_good_active_days",
      section: "woche",
      text: `Bereits ${activeDaysCount} aktive Tage diese Woche — gut unterwegs.`,
      tone: "positive",
    });
  } else if (activeDaysCount > 0) {
    const tagText = activeDaysCount === 1 ? "aktiver Tag" : "aktive Tage";
    hints.push({
      id: "week_some_active_days",
      section: "woche",
      text: `${activeDaysCount} ${tagText} diese Woche — noch Spielraum.`,
      tone: "neutral",
    });
  }

  if (workoutCount === 0 && daysElapsedInWeek >= 3) {
    hints.push({
      id: "week_no_workouts",
      section: "woche",
      text: "Noch kein Training diese Woche — eine Einheit reicht zum Start.",
      tone: "nudge",
    });
  } else if (workoutCount >= 3) {
    hints.push({
      id: "week_good_workouts",
      section: "woche",
      text: `${workoutCount} Trainings diese Woche — konstant.`,
      tone: "positive",
    });
  }

  if (nutritionDaysCount === 0 && daysElapsedInWeek >= 2) {
    hints.push({
      id: "week_no_nutrition",
      section: "woche",
      text: "Ernährung diese Woche noch nicht geloggt — kurz eintragen hilft.",
      tone: "nudge",
    });
  } else if (nutritionDaysCount >= 5) {
    hints.push({
      id: "week_good_nutrition",
      section: "woche",
      text: "Ernährung diese Woche gut durchgezogen.",
      tone: "positive",
    });
  }

  if (checkinDoneThisWeek) {
    hints.push({
      id: "week_checkin_done",
      section: "woche",
      text: "Wochen-Check-in erledigt — +50 Bonus-Punkte gesichert.",
      tone: "positive",
    });
  } else {
    hints.push({
      id: "week_checkin_open",
      section: "woche",
      text: "Wochen-Check-in noch offen — auf /heute eintragen für +50 Punkte.",
      tone: "nudge",
    });
  }

  return hints;
}

/* ------------------------------------------------------------------ */
/* Kombinierter Output                                                */
/* ------------------------------------------------------------------ */

export interface CoachAllInputs {
  today: TodayCoachInput;
  team: TeamCoachInput;
  challenge: ChallengeCoachInput;
  week: WeekCoachInput;
}

export function generateAllCoachHints(inputs: CoachAllInputs): CoachHint[] {
  return [
    ...getTodayHints(inputs.today),
    ...getTeamHints(inputs.team),
    ...getChallengeHints(inputs.challenge),
    ...getWeekHints(inputs.week),
  ];
}
