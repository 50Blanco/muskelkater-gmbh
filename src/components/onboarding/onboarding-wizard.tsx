"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  onboardingSchema,
  onboardingStepSchemas,
  type OnboardingStepKey,
} from "@/lib/validation/onboarding";
import { completeOnboarding } from "@/app/(onboarding)/actions";
import {
  INITIAL_WIZARD_STATE,
  type StepProps,
  type WizardState,
} from "./wizard-state";
import { StepGoal } from "./step-goal";
import { StepBody } from "./step-body";
import { StepExperience } from "./step-experience";
import { StepLocation } from "./step-location";
import { StepSchedule } from "./step-schedule";
import { StepNutrition } from "./step-nutrition";
import { StepSafety } from "./step-safety";

interface StepDefinition {
  key: OnboardingStepKey;
  title: string;
  subtitle: string;
  Component: React.ComponentType<StepProps>;
}

const STEPS: StepDefinition[] = [
  {
    key: "goal",
    title: "Was ist dein Hauptziel?",
    subtitle: "Dein Plan und deine Ernährungsziele richten sich danach aus.",
    Component: StepGoal,
  },
  {
    key: "body",
    title: "Erzähl uns kurz von dir",
    subtitle: "Die Basis für deinen Plan und deine Kalorienziele.",
    Component: StepBody,
  },
  {
    key: "experience",
    title: "Wie viel Trainingserfahrung hast du?",
    subtitle: "Wir passen Übungsauswahl und Umfang an dein Level an.",
    Component: StepExperience,
  },
  {
    key: "location",
    title: "Wo trainierst du?",
    subtitle: "Wir wählen Übungen, die zu deinem Ort passen.",
    Component: StepLocation,
  },
  {
    key: "schedule",
    title: "Wie viel Zeit hast du?",
    subtitle: "Realistisch geplant ist besser als perfekt geplant.",
    Component: StepSchedule,
  },
  {
    key: "nutrition",
    title: "Wie ernährst du dich?",
    subtitle: "Für Protein- und Kalorienziele, die zu dir passen.",
    Component: StepNutrition,
  },
  {
    key: "safety",
    title: "Sicherheit zuerst",
    subtitle: "Fast fertig. Danach ist dein Dashboard bereit.",
    Component: StepSafety,
  },
];

/** Wizard-State → Payload für Zod (Strings bleiben, Schema konvertiert). */
function buildPayload(state: WizardState): Record<string, unknown> {
  return {
    goalChoice: state.goalChoice ?? undefined,
    displayName: state.displayName,
    sex: state.sex,
    birthDate: state.birthDate,
    heightCm: state.heightCm,
    weightKg: state.weightKg,
    waistCm: state.waistCm,
    armCm: state.armCm,
    experienceLevel: state.experienceLevel ?? undefined,
    trainingLocation: state.trainingLocation ?? undefined,
    homeEquipment: state.homeEquipment,
    daysPerWeek: state.daysPerWeek ?? undefined,
    minutesPerSession: state.minutesPerSession ?? undefined,
    preferredDays: state.preferredDays,
    nutritionStyle: state.nutritionStyle ?? undefined,
    trackingMode: state.trackingMode,
    hasLimitations: state.hasLimitations ?? undefined,
    limitations: state.limitations,
    disclaimerAccepted: state.disclaimerAccepted,
  };
}

export function OnboardingWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL_WIZARD_STATE);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  function update(patch: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...patch }));
    setError(null);
  }

  function validateCurrentStep(): boolean {
    const result = onboardingStepSchemas[step.key].safeParse(
      buildPayload(state),
    );
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Bitte prüfe deine Eingaben.");
      return false;
    }
    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    setError(null);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  function goBack() {
    setError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function finish() {
    if (!validateCurrentStep()) return;
    const parsed = onboardingSchema.safeParse(buildPayload(state));
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingaben.");
      return;
    }
    startTransition(async () => {
      const result = await completeOnboarding(parsed.data);
      if (result?.error) setError(result.error);
    });
  }

  const StepComponent = step.Component;

  return (
    <div className="w-full max-w-xl space-y-6">
      {/* Fortschritt */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Schritt {stepIndex + 1} von {STEPS.length}
        </p>
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuenow={stepIndex + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-label="Onboarding-Fortschritt"
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step-Kopf */}
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          {step.title}
        </h1>
        <p className="text-sm text-muted">{step.subtitle}</p>
      </div>

      {/* Step-Inhalt */}
      <StepComponent state={state} update={update} />

      {/* Fehlermeldung */}
      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-sm)] border border-danger/40 bg-accent-soft px-3 py-2 text-sm text-foreground"
        >
          {error}
        </p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={stepIndex === 0 || isPending}
        >
          <ArrowLeft className="size-4" />
          Zurück
        </Button>
        {isLastStep ? (
          <Button
            type="button"
            size="lg"
            onClick={finish}
            disabled={isPending}
          >
            {isPending ? "Wir bauen deinen Plan …" : "Plan erstellen"}
            {!isPending && <ArrowRight className="size-4" />}
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={goNext}>
            Weiter
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
