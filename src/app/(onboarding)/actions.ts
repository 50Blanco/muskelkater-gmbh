"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  bodyMeasurement,
  bodyMetrics,
  coachRecommendation,
  dailyMission,
  exercise,
  fitnessGoal,
  habit,
  nutritionTarget,
  userProfile,
  workoutDay,
  workoutDayExercise,
  workoutPlan,
} from "@/db/schema";
import {
  GOAL_CHOICE_TO_GOAL_TYPE,
  onboardingSchema,
  type OnboardingInput,
} from "@/lib/validation/onboarding";
import { ageFromBirthDate } from "@/lib/safety/limits";
import { detectDangerSymptoms, MEDICAL_WARNING } from "@/lib/safety/symptoms";
import { calculateNutritionTargets } from "@/lib/nutrition/calculate-targets";
import { generatePlan } from "@/lib/plan/generate-plan";

/* ------------------------------------------------------------------ */
/* Helfer                                                             */
/* ------------------------------------------------------------------ */

/** Lokales Datum als YYYY-MM-DD (für date-Spalten). */
function localDateString(date = new Date()): string {
  return date.toLocaleDateString("en-CA");
}

const STYLE_LABELS: Record<OnboardingInput["nutritionStyle"], string> = {
  normal: "Normal",
  vegetarian: "Vegetarisch",
  vegan: "Vegan",
  halal: "Halal",
  no_preference: "Keine Angabe",
};

const EQUIPMENT_LABELS = {
  none: "ohne Geräte",
  dumbbells: "Kurzhanteln",
  bands: "Widerstandsbänder",
} as const;

/**
 * Strukturierte Zusatzinfos als lesbare Notiz am Fitnessziel.
 * (Ernährungsstil/Tracking/Equipment haben in Phase 1/2 noch keine
 * eigenen Spalten — bewusst pragmatisch hier dokumentiert.)
 */
function buildGoalNotes(input: OnboardingInput, symptoms: string[]): string {
  const parts: string[] = [
    `Ernährungsstil: ${STYLE_LABELS[input.nutritionStyle]}`,
    `Tracking: ${input.trackingMode === "simple" ? "Einfach" : "Genau"}`,
  ];
  if (input.trainingLocation !== "gym" && input.homeEquipment) {
    parts.push(`Equipment zuhause: ${EQUIPMENT_LABELS[input.homeEquipment]}`);
  }
  if (input.goalChoice === "health") parts.push("Fokus: Gesundheit");
  if (input.goalChoice === "performance") parts.push("Fokus: Sportleistung");
  if (input.hasLimitations && input.limitations) {
    parts.push(`Einschränkungen: ${input.limitations}`);
  }
  if (symptoms.length > 0) {
    parts.push(`Sicherheitshinweis gezeigt (Symptome: ${symptoms.join(", ")})`);
  }
  return parts.join(" · ");
}

const DEFAULT_HABITS = [
  { name: "Wasserziel erreichen", icon: "droplets" },
  { name: "Proteinziel erreichen", icon: "drumstick" },
  { name: "Training oder Bewegung", icon: "dumbbell" },
] as const;

/* ------------------------------------------------------------------ */
/* Onboarding abschließen                                             */
/* ------------------------------------------------------------------ */

/**
 * Validiert die Onboarding-Daten und speichert in einer Transaktion:
 * Profil, Ziel, Körperdaten, Ernährungsziele, Trainingsplan,
 * Standard-Gewohnheiten und die ersten Tagesmissionen.
 *
 * Idempotent: erneutes Ausführen deaktiviert alte Ziele/Pläne und
 * überschreibt die heutigen Werte, statt Duplikate anzulegen.
 */
export async function completeOnboarding(
  rawInput: unknown,
): Promise<{ error: string } | undefined> {
  const parsed = onboardingSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Ungültige Eingaben.",
    };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  /* Abgeleitete Werte berechnen (pure Logik, vor der Transaktion). */
  const goalType = GOAL_CHOICE_TO_GOAL_TYPE[input.goalChoice];
  const ageYears = ageFromBirthDate(input.birthDate);
  const symptoms = detectDangerSymptoms(
    input.hasLimitations ? input.limitations : "",
  );

  const targets = calculateNutritionTargets({
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    ageYears,
    sex: input.sex,
    goalType,
    daysPerWeek: input.daysPerWeek,
  });

  const catalog = await db
    .select({
      id: exercise.id,
      slug: exercise.slug,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      location: exercise.location,
      level: exercise.level,
      isCompound: exercise.isCompound,
    })
    .from(exercise);

  const plan = generatePlan({
    goalType,
    experienceLevel: input.experienceLevel,
    trainingLocation: input.trainingLocation,
    homeEquipment: input.homeEquipment,
    daysPerWeek: input.daysPerWeek,
    minutesPerSession: input.minutesPerSession,
    catalog,
  });

  if (plan.days.length === 0 || plan.days.every((d) => d.exercises.length === 0)) {
    return {
      error:
        "Wir konnten keinen passenden Plan erstellen. Bitte versuche eine andere Kombination aus Ort und Erfahrung.",
    };
  }

  const today = localDateString();
  const now = new Date();
  const goalNotes = buildGoalNotes(input, symptoms);
  const waterLiters = (targets.waterMl / 1000).toLocaleString("de-DE", {
    maximumFractionDigits: 1,
  });

  try {
    await db.transaction(async (tx) => {
      /* 1) Profil (Upsert auf user_id) */
      const profileValues = {
        displayName: input.displayName,
        birthDate: input.birthDate,
        sex: input.sex,
        heightCm: input.heightCm,
        experienceLevel: input.experienceLevel,
        trainingLocation: input.trainingLocation,
        availableDays:
          input.preferredDays.length > 0 ? input.preferredDays : null,
        minutesPerSession: input.minutesPerSession,
        onboardingCompletedAt: now,
        updatedAt: now,
      };
      await tx
        .insert(userProfile)
        .values({ userId: user.id, ...profileValues })
        .onConflictDoUpdate({
          target: userProfile.userId,
          set: profileValues,
        });

      /* 2) Fitnessziel (alte deaktivieren, neues anlegen) */
      await tx
        .update(fitnessGoal)
        .set({ active: false, updatedAt: now })
        .where(
          and(eq(fitnessGoal.userId, user.id), eq(fitnessGoal.active, true)),
        );
      await tx.insert(fitnessGoal).values({
        userId: user.id,
        goalType,
        weeklySessionsTarget: input.daysPerWeek,
        notes: goalNotes,
        active: true,
      });

      /* 3) Gewicht (heutiger Messwert, Upsert pro Tag) */
      await tx
        .insert(bodyMetrics)
        .values({
          userId: user.id,
          measuredOn: today,
          weightKg: input.weightKg,
        })
        .onConflictDoUpdate({
          target: [bodyMetrics.userId, bodyMetrics.measuredOn],
          set: { weightKg: input.weightKg, updatedAt: now },
        });

      /* 4) Umfänge (Bauch + Arm, Upsert pro Tag und Typ) */
      for (const measurement of [
        { type: "waist", valueCm: input.waistCm },
        { type: "arm", valueCm: input.armCm },
      ]) {
        await tx
          .insert(bodyMeasurement)
          .values({ userId: user.id, measuredOn: today, ...measurement })
          .onConflictDoUpdate({
            target: [
              bodyMeasurement.userId,
              bodyMeasurement.measuredOn,
              bodyMeasurement.type,
            ],
            set: { valueCm: measurement.valueCm, updatedAt: now },
          });
      }

      /* 5) Ernährungsziele (alte deaktivieren, neue anlegen) */
      await tx
        .update(nutritionTarget)
        .set({ active: false, updatedAt: now })
        .where(
          and(
            eq(nutritionTarget.userId, user.id),
            eq(nutritionTarget.active, true),
          ),
        );
      await tx.insert(nutritionTarget).values({
        userId: user.id,
        caloriesKcal: targets.caloriesKcal,
        proteinG: targets.proteinG,
        waterMl: targets.waterMl,
        active: true,
        calculatedFrom: targets.calculatedFrom,
      });

      /* 6) Trainingsplan (alte deaktivieren, Plan + Tage + Übungen anlegen) */
      await tx
        .update(workoutPlan)
        .set({ active: false, updatedAt: now })
        .where(
          and(eq(workoutPlan.userId, user.id), eq(workoutPlan.active, true)),
        );
      const [insertedPlan] = await tx
        .insert(workoutPlan)
        .values({
          userId: user.id,
          name: plan.name,
          goalType,
          daysPerWeek: input.daysPerWeek,
          location: input.trainingLocation,
          generatedBy: "rules",
          startDate: today,
          active: true,
        })
        .returning({ id: workoutPlan.id });

      const dayIds: string[] = [];
      for (const day of plan.days) {
        const [insertedDay] = await tx
          .insert(workoutDay)
          .values({
            userId: user.id,
            planId: insertedPlan.id,
            dayIndex: day.dayIndex,
            title: day.title,
            focus: day.focus,
            estMinutes: day.estMinutes,
          })
          .returning({ id: workoutDay.id });
        dayIds.push(insertedDay.id);

        await tx.insert(workoutDayExercise).values(
          day.exercises.map((ex) => ({
            userId: user.id,
            workoutDayId: insertedDay.id,
            exerciseId: ex.exerciseId,
            order: ex.order,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            targetRestSec: ex.targetRestSec,
          })),
        );
      }

      /* 7) Standard-Gewohnheiten (nur fehlende anlegen) */
      const existingHabits = await tx
        .select({ name: habit.name })
        .from(habit)
        .where(eq(habit.userId, user.id));
      const existingNames = new Set(existingHabits.map((h) => h.name));
      const missingHabits = DEFAULT_HABITS.filter(
        (h) => !existingNames.has(h.name),
      );
      if (missingHabits.length > 0) {
        await tx.insert(habit).values(
          missingHabits.map((h) => ({
            userId: user.id,
            name: h.name,
            icon: h.icon,
            cadence: "daily" as const,
            targetPerPeriod: 1,
            active: true,
          })),
        );
      }

      /* 8) Tagesmissionen für heute (ersetzen statt duplizieren) */
      await tx
        .delete(dailyMission)
        .where(
          and(
            eq(dailyMission.userId, user.id),
            eq(dailyMission.missionDate, today),
          ),
        );
      const firstDay = plan.days[0];
      await tx.insert(dailyMission).values([
        {
          userId: user.id,
          missionDate: today,
          type: "workout" as const,
          title: `Training: ${firstDay.title}`,
          description: "Dein erstes Workout aus deinem neuen Plan.",
          sourceRef: dayIds[0],
        },
        {
          userId: user.id,
          missionDate: today,
          type: "nutrition" as const,
          title: `Protein: ${targets.proteinG} g erreichen`,
          description: "Verteil es über den Tag — jede Mahlzeit zählt.",
        },
        {
          userId: user.id,
          missionDate: today,
          type: "habit" as const,
          title: `Wasser: ${waterLiters} l trinken`,
          description: "Stell dir eine Flasche in Sichtweite.",
        },
      ]);

      /* 9) Vorsichtiger Coach-Hinweis bei erkannten Warnsymptomen */
      if (symptoms.length > 0) {
        await tx
          .delete(coachRecommendation)
          .where(
            and(
              eq(coachRecommendation.userId, user.id),
              eq(coachRecommendation.trigger, "safety_symptom"),
              eq(coachRecommendation.dismissed, false),
            ),
          );
        await tx.insert(coachRecommendation).values({
          userId: user.id,
          createdForDate: today,
          trigger: "safety_symptom" as const,
          severity: "warning" as const,
          message: MEDICAL_WARNING,
        });
      }
    });
  } catch (err) {
    // Detailliert serverseitig loggen (ohne Nutzdaten), freundlich antworten.
    console.error(
      "completeOnboarding: Transaktion fehlgeschlagen:",
      err instanceof Error ? err.message : err,
    );
    return {
      error:
        "Speichern hat nicht geklappt. Bitte versuche es gleich noch einmal.",
    };
  }

  /* 10) Auth-Metadata synchron zum Profil-Flag setzen (Onboarding-Gate). */
  const { error: metaError } = await supabase.auth.updateUser({
    data: { onboarding_completed: true },
  });
  if (metaError) {
    console.error(
      "completeOnboarding: Metadata-Update fehlgeschlagen:",
      metaError.message,
    );
    return {
      error:
        "Dein Plan wurde gespeichert, aber der Abschluss hat nicht geklappt. Bitte tippe noch einmal auf „Plan erstellen“.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/heute");
}

/* ------------------------------------------------------------------ */
/* Onboarding erneut öffnen                                           */
/* ------------------------------------------------------------------ */

/**
 * Setzt das Onboarding-Gate zurück (z. B. wenn das Auth-Flag gesetzt ist,
 * aber noch kein Profil existiert — Alt-Nutzer des Phase-1-Platzhalters).
 */
export async function restartOnboarding(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.auth.updateUser({
    data: { onboarding_completed: false },
  });

  revalidatePath("/", "layout");
  redirect("/onboarding");
}
