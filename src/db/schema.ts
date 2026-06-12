/**
 * Muskelkater — Datenbankschema (Drizzle / PostgreSQL · Supabase)
 *
 * Konventionen:
 *  - `id` uuid PK (gen_random_uuid)
 *  - nutzerbezogene Tabellen haben `user_id` → auth.users(id) ON DELETE CASCADE
 *  - RLS ist auf jeder Tabelle aktiv; Nutzer sehen/ändern nur eigene Zeilen
 *    (auth.uid() = user_id). Der globale Übungskatalog ist für alle
 *    authentifizierten Nutzer lesbar, aber nicht schreibbar.
 *  - Datenzugriffe laufen serverseitig über Drizzle; Supabase nur für Auth.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUsers } from "drizzle-orm/supabase";

/* ------------------------------------------------------------------ */
/* Enums                                                              */
/* ------------------------------------------------------------------ */

export const sexEnum = pgEnum("sex", [
  "male",
  "female",
  "diverse",
  "prefer_not_say",
]);

export const experienceLevelEnum = pgEnum("experience_level", [
  "beginner",
  "intermediate",
  "advanced",
]);

export const trainingLocationEnum = pgEnum("training_location", [
  "gym",
  "home",
  "both",
]);

export const goalTypeEnum = pgEnum("goal_type", [
  "lose_fat",
  "build_muscle",
  "get_fit",
  "strength",
  "maintain",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "active",
  "completed",
  "skipped",
]);

export const exercisePreferenceEnum = pgEnum("exercise_preference", [
  "like",
  "dislike",
  "neutral",
]);

export const habitCadenceEnum = pgEnum("habit_cadence", ["daily", "weekly"]);

export const missionTypeEnum = pgEnum("mission_type", [
  "workout",
  "nutrition",
  "habit",
  "recovery",
]);

export const missionStatusEnum = pgEnum("mission_status", [
  "open",
  "done",
  "skipped",
]);

export const recommendationSeverityEnum = pgEnum("recommendation_severity", [
  "info",
  "warning",
  "critical",
]);

export const recommendationTriggerEnum = pgEnum("recommendation_trigger", [
  "low_time",
  "tired",
  "soreness",
  "missed_workout",
  "protein_low",
  "water_low",
  "streak_win",
  "plateau",
  "poor_recovery",
  "safety_symptom",
]);

/* ------------------------------------------------------------------ */
/* Helper                                                            */
/* ------------------------------------------------------------------ */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

/** Verweis auf den eingeloggten Nutzer (auth.users). */
const userId = () =>
  uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" });

/**
 * RLS: nur der Eigentümer (auth.uid() == user_id) darf lesen und schreiben.
 * Eine `for: "all"`-Policy deckt SELECT/INSERT/UPDATE/DELETE ab.
 */
function ownerPolicy(name: string, column: AnyPgColumn) {
  return pgPolicy(`${name}_owner`, {
    for: "all",
    to: authenticatedRole,
    using: sql`(select auth.uid()) = ${column}`,
    withCheck: sql`(select auth.uid()) = ${column}`,
  });
}

/* ------------------------------------------------------------------ */
/* User / Profil                                                     */
/* ------------------------------------------------------------------ */

export const userProfile = pgTable(
  "user_profile",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: userId().unique(),
    displayName: text("display_name"),
    birthDate: date("birth_date", { mode: "string" }),
    sex: sexEnum("sex"),
    heightCm: doublePrecision("height_cm"),
    experienceLevel: experienceLevelEnum("experience_level"),
    trainingLocation: trainingLocationEnum("training_location"),
    availableDays: jsonb("available_days").$type<number[]>(), // 0=So .. 6=Sa
    minutesPerSession: integer("minutes_per_session"),
    onboardingCompletedAt: timestamp("onboarding_completed_at", {
      withTimezone: true,
    }),
    ...timestamps,
  },
  (t) => [ownerPolicy("user_profile", t.userId)],
);

export const fitnessGoal = pgTable(
  "fitness_goal",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: userId(),
    goalType: goalTypeEnum("goal_type").notNull(),
    targetWeightKg: doublePrecision("target_weight_kg"),
    weeklySessionsTarget: integer("weekly_sessions_target"),
    notes: text("notes"),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (t) => [
    index("idx_fitness_goal_user").on(t.userId),
    ownerPolicy("fitness_goal", t.userId),
  ],
);

/* ------------------------------------------------------------------ */
/* Körperdaten                                                       */
/* ------------------------------------------------------------------ */

export const bodyMetrics = pgTable(
  "body_metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: userId(),
    measuredOn: date("measured_on", { mode: "string" }).notNull(),
    weightKg: doublePrecision("weight_kg"),
    bodyFatPct: doublePrecision("body_fat_pct"),
    note: text("note"),
    ...timestamps,
  },
  (t) => [
    unique("uq_body_metrics_user_day").on(t.userId, t.measuredOn),
    index("idx_body_metrics_user").on(t.userId),
    ownerPolicy("body_metrics", t.userId),
  ],
);

export const bodyMeasurement = pgTable(
  "body_measurement",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: userId(),
    measuredOn: date("measured_on", { mode: "string" }).notNull(),
    // flexibel: waist | arm | chest | hip | thigh | ... (App-seitig validiert)
    type: text("type").notNull(),
    valueCm: doublePrecision("value_cm").notNull(),
    ...timestamps,
  },
  (t) => [
    unique("uq_body_measurement_user_day_type").on(
      t.userId,
      t.measuredOn,
      t.type,
    ),
    index("idx_body_measurement_user").on(t.userId),
    ownerPolicy("body_measurement", t.userId),
  ],
);

/* ------------------------------------------------------------------ */
/* Übungskatalog (global)                                            */
/* ------------------------------------------------------------------ */

export const exercise = pgTable(
  "exercise",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    muscleGroup: text("muscle_group").notNull(),
    equipment: text("equipment"),
    location: trainingLocationEnum("location").notNull().default("both"),
    level: experienceLevelEnum("level").notNull().default("beginner"),
    isCompound: boolean("is_compound").default(false).notNull(),
    instructions: text("instructions"),
    mediaUrl: text("media_url"),
    ...timestamps,
  },
  () => [
    // global lesbar für eingeloggte Nutzer, nicht schreibbar (nur Seed/Admin)
    pgPolicy("exercise_read_all", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);

/**
 * Eigene Übungen des Nutzers. Bewusst getrennt vom globalen `exercise`-Katalog,
 * damit der globale Katalog sicher und unveränderlich bleibt. Nur der Eigentümer
 * sieht und ändert seine Custom-Übungen (RLS).
 */
export const customExercise = pgTable(
  "custom_exercise",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: userId(),
    name: text("name").notNull(),
    muscleGroup: text("muscle_group").notNull(),
    equipment: text("equipment"),
    location: trainingLocationEnum("location").notNull().default("both"),
    level: experienceLevelEnum("level").notNull().default("beginner"),
    instructions: text("instructions"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("idx_custom_exercise_user").on(t.userId),
    ownerPolicy("custom_exercise", t.userId),
  ],
);

/* ------------------------------------------------------------------ */
/* Training                                                          */
/* ------------------------------------------------------------------ */

export const workoutPlan = pgTable(
  "workout_plan",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: userId(),
    name: text("name").notNull(),
    goalType: goalTypeEnum("goal_type"),
    daysPerWeek: integer("days_per_week"),
    location: trainingLocationEnum("location"),
    generatedBy: text("generated_by").default("rules").notNull(),
    startDate: date("start_date", { mode: "string" }),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (t) => [
    index("idx_workout_plan_user").on(t.userId),
    ownerPolicy("workout_plan", t.userId),
  ],
);

export const workoutDay = pgTable(
  "workout_day",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: userId(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => workoutPlan.id, { onDelete: "cascade" }),
    dayIndex: integer("day_index").notNull(),
    title: text("title").notNull(),
    focus: text("focus"),
    estMinutes: integer("est_minutes"),
    ...timestamps,
  },
  (t) => [
    index("idx_workout_day_plan").on(t.planId),
    ownerPolicy("workout_day", t.userId),
  ],
);

export const workoutDayExercise = pgTable(
  "workout_day_exercise",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: userId(),
    workoutDayId: uuid("workout_day_id")
      .notNull()
      .references(() => workoutDay.id, { onDelete: "cascade" }),
    // Genau eine Übungsreferenz ist gesetzt: entweder Katalog- oder Custom-Übung
    // (per CHECK erzwungen, analog zu workout_set). Katalog-Übungen sind global,
    // Custom-Übungen gehören dem Nutzer.
    exerciseId: uuid("exercise_id").references(() => exercise.id, {
      onDelete: "restrict",
    }),
    customExerciseId: uuid("custom_exercise_id").references(
      () => customExercise.id,
      { onDelete: "cascade" },
    ),
    order: integer("order").notNull().default(0),
    targetSets: integer("target_sets"),
    targetReps: integer("target_reps"),
    targetRestSec: integer("target_rest_sec"),
    ...timestamps,
  },
  (t) => [
    index("idx_wde_day").on(t.workoutDayId),
    index("idx_wde_custom_exercise").on(t.customExerciseId),
    check(
      "workout_day_exercise_exercise_ref",
      sql`(${t.exerciseId} is not null) != (${t.customExerciseId} is not null)`,
    ),
    ownerPolicy("workout_day_exercise", t.userId),
  ],
);

export const workoutSession = pgTable(
  "workout_session",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: userId(),
    workoutDayId: uuid("workout_day_id").references(() => workoutDay.id, {
      onDelete: "set null",
    }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    status: sessionStatusEnum("status").default("active").notNull(),
    durationMin: integer("duration_min"),
    perceivedEffort: integer("perceived_effort"), // RPE 1–10
    soreness: integer("soreness"), // 0–10
    mood: integer("mood"), // 1–5
    ...timestamps,
  },
  (t) => [
    index("idx_workout_session_user").on(t.userId),
    ownerPolicy("workout_session", t.userId),
  ],
);

export const workoutSet = pgTable(
  "workout_set",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: userId(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => workoutSession.id, { onDelete: "cascade" }),
    // Genau eine Übungsreferenz ist gesetzt: entweder Katalog- oder Custom-Übung
    // (per CHECK erzwungen). Katalog-Übungen sind global, Custom-Übungen
    // gehören dem Nutzer.
    exerciseId: uuid("exercise_id").references(() => exercise.id, {
      onDelete: "restrict",
    }),
    customExerciseId: uuid("custom_exercise_id").references(
      () => customExercise.id,
      { onDelete: "cascade" },
    ),
    setNumber: integer("set_number").notNull(),
    weightKg: doublePrecision("weight_kg"),
    reps: integer("reps"),
    completed: boolean("completed").default(false).notNull(),
    ...timestamps,
  },
  (t) => [
    index("idx_workout_set_session").on(t.sessionId),
    check(
      "workout_set_exercise_ref",
      sql`(${t.exerciseId} is not null) != (${t.customExerciseId} is not null)`,
    ),
    ownerPolicy("workout_set", t.userId),
  ],
);

/**
 * Nutzer-Feedback zu (Katalog-)Übungen: gefällt mir / passt nicht, behalten,
 * vermeiden, optionaler Grund. Eine Zeile pro Nutzer und Übung (Upsert).
 */
export const userExercisePreference = pgTable(
  "user_exercise_preference",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: userId(),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercise.id, { onDelete: "cascade" }),
    preference: exercisePreferenceEnum("preference")
      .default("neutral")
      .notNull(),
    keepInPlan: boolean("keep_in_plan").default(true).notNull(),
    avoidExercise: boolean("avoid_exercise").default(false).notNull(),
    reason: text("reason"),
    painFlag: boolean("pain_flag").default(false).notNull(),
    ...timestamps,
  },
  (t) => [
    unique("uq_user_exercise_preference").on(t.userId, t.exerciseId),
    index("idx_user_exercise_preference_user").on(t.userId),
    ownerPolicy("user_exercise_preference", t.userId),
  ],
);

/* ------------------------------------------------------------------ */
/* Ernährung                                                         */
/* ------------------------------------------------------------------ */

export const nutritionTarget = pgTable(
  "nutrition_target",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: userId(),
    caloriesKcal: integer("calories_kcal").notNull(),
    proteinG: integer("protein_g").notNull(),
    waterMl: integer("water_ml").notNull(),
    active: boolean("active").default(true).notNull(),
    calculatedFrom: jsonb("calculated_from").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (t) => [
    index("idx_nutrition_target_user").on(t.userId),
    ownerPolicy("nutrition_target", t.userId),
  ],
);

export const dailyNutritionLog = pgTable(
  "daily_nutrition_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: userId(),
    logDate: date("log_date", { mode: "string" }).notNull(),
    caloriesKcal: integer("calories_kcal"),
    proteinG: integer("protein_g"),
    waterMl: integer("water_ml").default(0).notNull(),
    mealsStatus: jsonb("meals_status").$type<Record<string, boolean>>(),
    ...timestamps,
  },
  (t) => [
    unique("uq_daily_nutrition_user_day").on(t.userId, t.logDate),
    index("idx_daily_nutrition_user").on(t.userId),
    ownerPolicy("daily_nutrition_log", t.userId),
  ],
);

/* ------------------------------------------------------------------ */
/* Gewohnheiten                                                      */
/* ------------------------------------------------------------------ */

export const habit = pgTable(
  "habit",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: userId(),
    name: text("name").notNull(),
    icon: text("icon"),
    cadence: habitCadenceEnum("cadence").default("daily").notNull(),
    targetPerPeriod: integer("target_per_period").default(1).notNull(),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (t) => [
    index("idx_habit_user").on(t.userId),
    ownerPolicy("habit", t.userId),
  ],
);

export const dailyHabitLog = pgTable(
  "daily_habit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: userId(),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habit.id, { onDelete: "cascade" }),
    logDate: date("log_date", { mode: "string" }).notNull(),
    completed: boolean("completed").default(false).notNull(),
    ...timestamps,
  },
  (t) => [
    unique("uq_daily_habit_log").on(t.habitId, t.logDate),
    index("idx_daily_habit_log_user").on(t.userId),
    ownerPolicy("daily_habit_log", t.userId),
  ],
);

/* ------------------------------------------------------------------ */
/* Coach / Tagesführung                                              */
/* ------------------------------------------------------------------ */

export const dailyMission = pgTable(
  "daily_mission",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: userId(),
    missionDate: date("mission_date", { mode: "string" }).notNull(),
    type: missionTypeEnum("type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: missionStatusEnum("status").default("open").notNull(),
    sourceRef: uuid("source_ref"),
    ...timestamps,
  },
  (t) => [
    index("idx_daily_mission_user").on(t.userId),
    ownerPolicy("daily_mission", t.userId),
  ],
);

export const coachRecommendation = pgTable(
  "coach_recommendation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: userId(),
    createdForDate: date("created_for_date", { mode: "string" }).notNull(),
    trigger: recommendationTriggerEnum("trigger").notNull(),
    severity: recommendationSeverityEnum("severity").default("info").notNull(),
    message: text("message").notNull(),
    actionLabel: text("action_label"),
    actionRef: text("action_ref"),
    dismissed: boolean("dismissed").default(false).notNull(),
    ...timestamps,
  },
  (t) => [
    index("idx_coach_reco_user").on(t.userId),
    ownerPolicy("coach_recommendation", t.userId),
  ],
);

/* ------------------------------------------------------------------ */
/* Social                                                             */
/* ------------------------------------------------------------------ */

export const socialGroupRoleEnum = pgEnum("social_group_role", [
  "owner",
  "member",
]);

export const socialReactionTypeEnum = pgEnum("social_reaction_type", [
  "stark",
  "weiter_so",
  "respekt",
]);

export const socialTargetTypeEnum = pgEnum("social_target_type", [
  "workout_session",
  "daily_mission",
  "daily_habit_log",
]);

/** Trainingsgruppe / Crew. Jeder Nutzer kann mehrere Gruppen haben. */
export const socialGroup = pgTable(
  "social_group",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    inviteCode: text("invite_code").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("idx_social_group_owner").on(t.ownerUserId),
    ownerPolicy("social_group", t.ownerUserId),
  ],
);

/** Mitgliedschaft: Nutzer ↔ Gruppe (unique). */
export const socialGroupMember = pgTable(
  "social_group_member",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => socialGroup.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    role: socialGroupRoleEnum("role").default("member").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("uq_social_group_member").on(t.groupId, t.userId),
    index("idx_social_group_member_user").on(t.userId),
    index("idx_social_group_member_group").on(t.groupId),
    ownerPolicy("social_group_member", t.userId),
  ],
);

/**
 * Reaktionen auf Feed-Events (workout_session / daily_mission / daily_habit_log).
 * toggle-Semantik: unique → beim zweiten Klick löschen.
 */
export const socialReaction = pgTable(
  "social_reaction",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => socialGroup.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    targetType: socialTargetTypeEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    reactionType: socialReactionTypeEnum("reaction_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("uq_social_reaction").on(
      t.groupId,
      t.userId,
      t.targetType,
      t.targetId,
      t.reactionType,
    ),
    index("idx_social_reaction_group").on(t.groupId),
    index("idx_social_reaction_target").on(t.targetType, t.targetId),
    ownerPolicy("social_reaction", t.userId),
  ],
);
