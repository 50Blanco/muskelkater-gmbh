CREATE TYPE "public"."experience_level" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."goal_type" AS ENUM('lose_fat', 'build_muscle', 'get_fit', 'strength', 'maintain');--> statement-breakpoint
CREATE TYPE "public"."habit_cadence" AS ENUM('daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."mission_status" AS ENUM('open', 'done', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."mission_type" AS ENUM('workout', 'nutrition', 'habit', 'recovery');--> statement-breakpoint
CREATE TYPE "public"."recommendation_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."recommendation_trigger" AS ENUM('low_time', 'tired', 'soreness', 'missed_workout', 'protein_low', 'water_low', 'streak_win', 'plateau', 'poor_recovery', 'safety_symptom');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('active', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('male', 'female', 'diverse', 'prefer_not_say');--> statement-breakpoint
CREATE TYPE "public"."training_location" AS ENUM('gym', 'home', 'both');--> statement-breakpoint
CREATE TABLE "body_measurement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"measured_on" date NOT NULL,
	"type" text NOT NULL,
	"value_cm" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_body_measurement_user_day_type" UNIQUE("user_id","measured_on","type")
);
--> statement-breakpoint
ALTER TABLE "body_measurement" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "body_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"measured_on" date NOT NULL,
	"weight_kg" double precision,
	"body_fat_pct" double precision,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_body_metrics_user_day" UNIQUE("user_id","measured_on")
);
--> statement-breakpoint
ALTER TABLE "body_metrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "coach_recommendation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_for_date" date NOT NULL,
	"trigger" "recommendation_trigger" NOT NULL,
	"severity" "recommendation_severity" DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"action_label" text,
	"action_ref" text,
	"dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coach_recommendation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "daily_habit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"habit_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_daily_habit_log" UNIQUE("habit_id","log_date")
);
--> statement-breakpoint
ALTER TABLE "daily_habit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "daily_mission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mission_date" date NOT NULL,
	"type" "mission_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "mission_status" DEFAULT 'open' NOT NULL,
	"source_ref" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_mission" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "daily_nutrition_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"calories_kcal" integer,
	"protein_g" integer,
	"water_ml" integer DEFAULT 0 NOT NULL,
	"meals_status" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_daily_nutrition_user_day" UNIQUE("user_id","log_date")
);
--> statement-breakpoint
ALTER TABLE "daily_nutrition_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "exercise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"muscle_group" text NOT NULL,
	"equipment" text,
	"location" "training_location" DEFAULT 'both' NOT NULL,
	"level" "experience_level" DEFAULT 'beginner' NOT NULL,
	"is_compound" boolean DEFAULT false NOT NULL,
	"instructions" text,
	"media_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "exercise" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "fitness_goal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_type" "goal_type" NOT NULL,
	"target_weight_kg" double precision,
	"weekly_sessions_target" integer,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fitness_goal" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "habit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"cadence" "habit_cadence" DEFAULT 'daily' NOT NULL,
	"target_per_period" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "habit" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "nutrition_target" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"calories_kcal" integer NOT NULL,
	"protein_g" integer NOT NULL,
	"water_ml" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"calculated_from" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nutrition_target" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text,
	"birth_date" date,
	"sex" "sex",
	"height_cm" double precision,
	"experience_level" "experience_level",
	"training_location" "training_location",
	"available_days" jsonb,
	"minutes_per_session" integer,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_profile" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workout_day" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"day_index" integer NOT NULL,
	"title" text NOT NULL,
	"focus" text,
	"est_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workout_day" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workout_day_exercise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workout_day_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"target_sets" integer,
	"target_reps" integer,
	"target_rest_sec" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workout_day_exercise" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workout_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"goal_type" "goal_type",
	"days_per_week" integer,
	"location" "training_location",
	"generated_by" text DEFAULT 'rules' NOT NULL,
	"start_date" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workout_plan" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workout_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workout_day_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"status" "session_status" DEFAULT 'active' NOT NULL,
	"duration_min" integer,
	"perceived_effort" integer,
	"soreness" integer,
	"mood" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workout_session" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workout_set" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"set_number" integer NOT NULL,
	"weight_kg" double precision,
	"reps" integer,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workout_set" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "body_measurement" ADD CONSTRAINT "body_measurement_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_metrics" ADD CONSTRAINT "body_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_recommendation" ADD CONSTRAINT "coach_recommendation_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_habit_log" ADD CONSTRAINT "daily_habit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_habit_log" ADD CONSTRAINT "daily_habit_log_habit_id_habit_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_mission" ADD CONSTRAINT "daily_mission_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_nutrition_log" ADD CONSTRAINT "daily_nutrition_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_goal" ADD CONSTRAINT "fitness_goal_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit" ADD CONSTRAINT "habit_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_target" ADD CONSTRAINT "nutrition_target_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_day" ADD CONSTRAINT "workout_day_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_day" ADD CONSTRAINT "workout_day_plan_id_workout_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."workout_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_day_exercise" ADD CONSTRAINT "workout_day_exercise_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_day_exercise" ADD CONSTRAINT "workout_day_exercise_workout_day_id_workout_day_id_fk" FOREIGN KEY ("workout_day_id") REFERENCES "public"."workout_day"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_day_exercise" ADD CONSTRAINT "workout_day_exercise_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_plan" ADD CONSTRAINT "workout_plan_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_workout_day_id_workout_day_id_fk" FOREIGN KEY ("workout_day_id") REFERENCES "public"."workout_day"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_set" ADD CONSTRAINT "workout_set_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_set" ADD CONSTRAINT "workout_set_session_id_workout_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_set" ADD CONSTRAINT "workout_set_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_body_measurement_user" ON "body_measurement" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_body_metrics_user" ON "body_metrics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_coach_reco_user" ON "coach_recommendation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_daily_habit_log_user" ON "daily_habit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_daily_mission_user" ON "daily_mission" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_daily_nutrition_user" ON "daily_nutrition_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_fitness_goal_user" ON "fitness_goal" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_habit_user" ON "habit" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_nutrition_target_user" ON "nutrition_target" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_workout_day_plan" ON "workout_day" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_wde_day" ON "workout_day_exercise" USING btree ("workout_day_id");--> statement-breakpoint
CREATE INDEX "idx_workout_plan_user" ON "workout_plan" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_workout_session_user" ON "workout_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_workout_set_session" ON "workout_set" USING btree ("session_id");--> statement-breakpoint
CREATE POLICY "body_measurement_owner" ON "body_measurement" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "body_measurement"."user_id") WITH CHECK ((select auth.uid()) = "body_measurement"."user_id");--> statement-breakpoint
CREATE POLICY "body_metrics_owner" ON "body_metrics" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "body_metrics"."user_id") WITH CHECK ((select auth.uid()) = "body_metrics"."user_id");--> statement-breakpoint
CREATE POLICY "coach_recommendation_owner" ON "coach_recommendation" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "coach_recommendation"."user_id") WITH CHECK ((select auth.uid()) = "coach_recommendation"."user_id");--> statement-breakpoint
CREATE POLICY "daily_habit_log_owner" ON "daily_habit_log" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "daily_habit_log"."user_id") WITH CHECK ((select auth.uid()) = "daily_habit_log"."user_id");--> statement-breakpoint
CREATE POLICY "daily_mission_owner" ON "daily_mission" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "daily_mission"."user_id") WITH CHECK ((select auth.uid()) = "daily_mission"."user_id");--> statement-breakpoint
CREATE POLICY "daily_nutrition_log_owner" ON "daily_nutrition_log" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "daily_nutrition_log"."user_id") WITH CHECK ((select auth.uid()) = "daily_nutrition_log"."user_id");--> statement-breakpoint
CREATE POLICY "exercise_read_all" ON "exercise" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "fitness_goal_owner" ON "fitness_goal" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "fitness_goal"."user_id") WITH CHECK ((select auth.uid()) = "fitness_goal"."user_id");--> statement-breakpoint
CREATE POLICY "habit_owner" ON "habit" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "habit"."user_id") WITH CHECK ((select auth.uid()) = "habit"."user_id");--> statement-breakpoint
CREATE POLICY "nutrition_target_owner" ON "nutrition_target" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "nutrition_target"."user_id") WITH CHECK ((select auth.uid()) = "nutrition_target"."user_id");--> statement-breakpoint
CREATE POLICY "user_profile_owner" ON "user_profile" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "user_profile"."user_id") WITH CHECK ((select auth.uid()) = "user_profile"."user_id");--> statement-breakpoint
CREATE POLICY "workout_day_owner" ON "workout_day" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "workout_day"."user_id") WITH CHECK ((select auth.uid()) = "workout_day"."user_id");--> statement-breakpoint
CREATE POLICY "workout_day_exercise_owner" ON "workout_day_exercise" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "workout_day_exercise"."user_id") WITH CHECK ((select auth.uid()) = "workout_day_exercise"."user_id");--> statement-breakpoint
CREATE POLICY "workout_plan_owner" ON "workout_plan" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "workout_plan"."user_id") WITH CHECK ((select auth.uid()) = "workout_plan"."user_id");--> statement-breakpoint
CREATE POLICY "workout_session_owner" ON "workout_session" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "workout_session"."user_id") WITH CHECK ((select auth.uid()) = "workout_session"."user_id");--> statement-breakpoint
CREATE POLICY "workout_set_owner" ON "workout_set" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "workout_set"."user_id") WITH CHECK ((select auth.uid()) = "workout_set"."user_id");