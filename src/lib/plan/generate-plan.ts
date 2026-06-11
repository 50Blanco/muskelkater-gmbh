/**
 * Plan-Generator (pure TypeScript, keine React-/DB-Abhängigkeiten).
 *
 * Erzeugt aus Profil + Übungskatalog einen einfachen, sicheren Trainingsplan:
 *  - Split nach Trainingstagen (2=Ganzkörper A/B … 6=PPL ×2)
 *  - Übungsauswahl nach Ort, Level und Heim-Equipment
 *  - Übungsanzahl nach verfügbarer Zeit
 *  - Sätze/Wiederholungen/Pause nach Ziel und Level
 * Keine Periodisierung — bewusst alltagstauglich gehalten.
 */

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type TrainingLocation = "gym" | "home" | "both";
export type HomeEquipment = "none" | "dumbbells" | "bands";
export type PlanGoalType =
  | "lose_fat"
  | "build_muscle"
  | "get_fit"
  | "strength"
  | "maintain";

export interface CatalogExercise {
  id: string;
  slug: string;
  name: string;
  muscleGroup: string;
  equipment: string | null;
  location: TrainingLocation;
  level: ExperienceLevel;
  isCompound: boolean;
}

export interface PlanInput {
  goalType: PlanGoalType;
  experienceLevel: ExperienceLevel;
  trainingLocation: TrainingLocation;
  homeEquipment: HomeEquipment | null;
  daysPerWeek: number;
  minutesPerSession: number;
  catalog: CatalogExercise[];
}

export interface GeneratedExercise {
  exerciseId: string;
  order: number;
  targetSets: number;
  targetReps: number;
  targetRestSec: number;
}

export interface GeneratedDay {
  dayIndex: number;
  title: string;
  focus: string;
  estMinutes: number;
  exercises: GeneratedExercise[];
}

export interface GeneratedPlan {
  name: string;
  days: GeneratedDay[];
}

/* ------------------------------------------------------------------ */
/* Tages-Vorlagen: Muskelgruppen in Prioritätsreihenfolge             */
/* (Wiederholung einer Gruppe = zweite Übung erlaubt)                 */
/* ------------------------------------------------------------------ */

interface DayTemplate {
  title: string;
  focus: string;
  groups: string[];
}

const FULL_BODY: DayTemplate[] = [
  {
    title: "Ganzkörper A",
    focus: "Ganzkörper",
    groups: ["legs", "chest", "back", "shoulders", "core", "biceps", "glutes"],
  },
  {
    title: "Ganzkörper B",
    focus: "Ganzkörper",
    groups: ["hamstrings", "back", "chest", "glutes", "core", "triceps", "shoulders"],
  },
  {
    title: "Ganzkörper C",
    focus: "Ganzkörper",
    groups: ["legs", "shoulders", "back", "chest", "core", "hamstrings", "biceps"],
  },
];

const PUSH: DayTemplate = {
  title: "Push — Drücken",
  focus: "Brust · Schultern · Trizeps",
  groups: ["chest", "shoulders", "triceps", "chest", "shoulders", "core"],
};

const PULL: DayTemplate = {
  title: "Pull — Ziehen",
  focus: "Rücken · Bizeps",
  groups: ["back", "biceps", "back", "core", "back"],
};

const LEGS: DayTemplate = {
  title: "Beine",
  focus: "Beine · Po · Rumpf",
  groups: ["legs", "hamstrings", "glutes", "core", "legs"],
};

const UPPER: DayTemplate = {
  title: "Oberkörper",
  focus: "Brust · Rücken · Schultern · Arme",
  groups: ["chest", "back", "shoulders", "biceps", "triceps", "core"],
};

const LOWER: DayTemplate = {
  title: "Unterkörper",
  focus: "Beine · Po · Rumpf",
  groups: ["legs", "hamstrings", "glutes", "core", "legs"],
};

function withSuffix(template: DayTemplate, suffix: string): DayTemplate {
  return { ...template, title: `${template.title} ${suffix}` };
}

function dayTemplates(
  daysPerWeek: number,
  level: ExperienceLevel,
): { split: string; templates: DayTemplate[] } {
  switch (daysPerWeek) {
    case 2:
      return { split: "Ganzkörper", templates: [FULL_BODY[0], FULL_BODY[1]] };
    case 3:
      return level === "beginner"
        ? { split: "Ganzkörper", templates: [...FULL_BODY] }
        : { split: "Push/Pull/Legs", templates: [PUSH, PULL, LEGS] };
    case 4:
      return {
        split: "Oberkörper/Unterkörper",
        templates: [
          withSuffix(UPPER, "A"),
          withSuffix(LOWER, "A"),
          withSuffix(UPPER, "B"),
          withSuffix(LOWER, "B"),
        ],
      };
    case 5:
      return {
        split: "Push/Pull/Legs + Ober-/Unterkörper",
        templates: [PUSH, PULL, LEGS, UPPER, LOWER],
      };
    default:
      return {
        split: "Push/Pull/Legs",
        templates: [
          withSuffix(PUSH, "A"),
          withSuffix(PULL, "A"),
          withSuffix(LEGS, "A"),
          withSuffix(PUSH, "B"),
          withSuffix(PULL, "B"),
          withSuffix(LEGS, "B"),
        ],
      };
  }
}

/* ------------------------------------------------------------------ */
/* Auswahl-Logik                                                      */
/* ------------------------------------------------------------------ */

const LEVEL_ORDER: Record<ExperienceLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

/** Übungsanzahl pro Einheit nach Zeitbudget (Anfänger: unteres Ende). */
function exercisesPerSession(
  minutesPerSession: number,
  level: ExperienceLevel,
): number {
  const base =
    minutesPerSession <= 20
      ? 3
      : minutesPerSession <= 30
        ? 4
        : minutesPerSession <= 45
          ? 5
          : 6;
  return level === "beginner" ? base : base + 1;
}

/** Katalog nach Ort, Level und Heim-Equipment filtern. */
function filterCatalog(input: PlanInput): CatalogExercise[] {
  const maxLevel = LEVEL_ORDER[input.experienceLevel];
  const allowedLocations: TrainingLocation[] =
    input.trainingLocation === "both"
      ? ["gym", "home", "both"]
      : [input.trainingLocation, "both"];

  return input.catalog.filter((ex) => {
    if (LEVEL_ORDER[ex.level] > maxLevel) return false;
    if (!allowedLocations.includes(ex.location)) return false;
    // Zuhause ohne Kurzhanteln → keine Kurzhantel-Übungen empfehlen.
    if (
      input.trainingLocation === "home" &&
      input.homeEquipment !== "dumbbells" &&
      ex.equipment === "dumbbell"
    ) {
      return false;
    }
    return true;
  });
}

interface RepScheme {
  targetSets: number;
  targetReps: number;
  targetRestSec: number;
}

function repScheme(
  goalType: PlanGoalType,
  level: ExperienceLevel,
  isCompound: boolean,
): RepScheme {
  switch (goalType) {
    case "strength":
      return {
        targetSets: level === "beginner" ? 3 : 4,
        targetReps: isCompound ? 5 : 8,
        targetRestSec: 150,
      };
    case "build_muscle":
      return {
        targetSets: isCompound && level !== "beginner" ? 4 : 3,
        targetReps: 10,
        targetRestSec: 90,
      };
    case "maintain":
      return { targetSets: 3, targetReps: 10, targetRestSec: 90 };
    default: // lose_fat, get_fit
      return { targetSets: 3, targetReps: 12, targetRestSec: 60 };
  }
}

/** Wählt Übungen für einen Tag: bevorzugt selten genutzte, Grundübungen zuerst. */
function pickDayExercises(
  template: DayTemplate,
  pool: CatalogExercise[],
  usage: Map<string, number>,
  count: number,
): CatalogExercise[] {
  const chosen: CatalogExercise[] = [];

  for (let pass = 0; pass < 2 && chosen.length < count; pass++) {
    for (const group of template.groups) {
      if (chosen.length >= count) break;
      const candidate = pool
        .filter((ex) => ex.muscleGroup === group && !chosen.includes(ex))
        .sort(
          (a, b) =>
            (usage.get(a.id) ?? 0) - (usage.get(b.id) ?? 0) ||
            Number(b.isCompound) - Number(a.isCompound),
        )[0];
      if (candidate) chosen.push(candidate);
    }
  }

  // Fallback: wenn die Zielgruppen nicht reichen, mit beliebigen Übungen auffüllen.
  if (chosen.length < count) {
    const rest = pool
      .filter((ex) => !chosen.includes(ex))
      .sort((a, b) => (usage.get(a.id) ?? 0) - (usage.get(b.id) ?? 0));
    chosen.push(...rest.slice(0, count - chosen.length));
  }

  for (const ex of chosen) {
    usage.set(ex.id, (usage.get(ex.id) ?? 0) + 1);
  }
  return chosen;
}

/* ------------------------------------------------------------------ */
/* Hauptfunktion                                                      */
/* ------------------------------------------------------------------ */

export function generatePlan(input: PlanInput): GeneratedPlan {
  const pool = filterCatalog(input);
  const { split, templates } = dayTemplates(
    input.daysPerWeek,
    input.experienceLevel,
  );
  const count = exercisesPerSession(
    input.minutesPerSession,
    input.experienceLevel,
  );
  const usage = new Map<string, number>();

  const days: GeneratedDay[] = templates.map((template, index) => {
    const exercises = pickDayExercises(template, pool, usage, count);
    return {
      dayIndex: index,
      title: template.title,
      focus: template.focus,
      estMinutes: input.minutesPerSession,
      exercises: exercises.map((ex, order) => ({
        exerciseId: ex.id,
        order,
        ...repScheme(input.goalType, input.experienceLevel, ex.isCompound),
      })),
    };
  });

  return {
    name: `${split} · ${input.daysPerWeek}× pro Woche`,
    days,
  };
}
