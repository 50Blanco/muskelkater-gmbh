import type { GoalChoice } from "@/lib/validation/onboarding";

/**
 * Formularzustand des Onboarding-Wizards.
 * Zahlenfelder sind Strings (kontrollierte Inputs); die Konvertierung
 * übernimmt das Zod-Schema (inkl. Komma-Unterstützung).
 */
export interface WizardState {
  goalChoice: GoalChoice | null;
  displayName: string;
  sex: "male" | "female" | "diverse" | "prefer_not_say";
  birthDate: string;
  heightCm: string;
  weightKg: string;
  waistCm: string;
  armCm: string;
  experienceLevel: "beginner" | "intermediate" | "advanced" | null;
  trainingLocation: "gym" | "home" | "both" | null;
  homeEquipment: "none" | "dumbbells" | "bands" | null;
  daysPerWeek: number | null;
  minutesPerSession: number | null;
  preferredDays: number[];
  nutritionStyle:
    | "normal"
    | "vegetarian"
    | "vegan"
    | "halal"
    | "no_preference"
    | null;
  trackingMode: "simple" | "precise";
  hasLimitations: boolean | null;
  limitations: string;
  disclaimerAccepted: boolean;
}

export const INITIAL_WIZARD_STATE: WizardState = {
  goalChoice: null,
  displayName: "",
  sex: "prefer_not_say",
  birthDate: "",
  heightCm: "",
  weightKg: "",
  waistCm: "",
  armCm: "",
  experienceLevel: null,
  trainingLocation: null,
  homeEquipment: null,
  daysPerWeek: null,
  minutesPerSession: null,
  preferredDays: [],
  nutritionStyle: null,
  trackingMode: "simple",
  hasLimitations: null,
  limitations: "",
  disclaimerAccepted: false,
};

export interface StepProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}
