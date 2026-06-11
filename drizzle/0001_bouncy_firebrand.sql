CREATE TYPE "public"."exercise_preference" AS ENUM('like', 'dislike', 'neutral');--> statement-breakpoint
CREATE TABLE "custom_exercise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"muscle_group" text NOT NULL,
	"equipment" text,
	"location" "training_location" DEFAULT 'both' NOT NULL,
	"level" "experience_level" DEFAULT 'beginner' NOT NULL,
	"instructions" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custom_exercise" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_exercise_preference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"preference" "exercise_preference" DEFAULT 'neutral' NOT NULL,
	"keep_in_plan" boolean DEFAULT true NOT NULL,
	"avoid_exercise" boolean DEFAULT false NOT NULL,
	"reason" text,
	"pain_flag" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_exercise_preference" UNIQUE("user_id","exercise_id")
);
--> statement-breakpoint
ALTER TABLE "user_exercise_preference" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workout_set" ALTER COLUMN "exercise_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "workout_set" ADD COLUMN "custom_exercise_id" uuid;--> statement-breakpoint
ALTER TABLE "custom_exercise" ADD CONSTRAINT "custom_exercise_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_exercise_preference" ADD CONSTRAINT "user_exercise_preference_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_exercise_preference" ADD CONSTRAINT "user_exercise_preference_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_custom_exercise_user" ON "custom_exercise" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_exercise_preference_user" ON "user_exercise_preference" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "workout_set" ADD CONSTRAINT "workout_set_custom_exercise_id_custom_exercise_id_fk" FOREIGN KEY ("custom_exercise_id") REFERENCES "public"."custom_exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_set" ADD CONSTRAINT "workout_set_exercise_ref" CHECK (("workout_set"."exercise_id" is not null) != ("workout_set"."custom_exercise_id" is not null));--> statement-breakpoint
CREATE POLICY "custom_exercise_owner" ON "custom_exercise" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "custom_exercise"."user_id") WITH CHECK ((select auth.uid()) = "custom_exercise"."user_id");--> statement-breakpoint
CREATE POLICY "user_exercise_preference_owner" ON "user_exercise_preference" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "user_exercise_preference"."user_id") WITH CHECK ((select auth.uid()) = "user_exercise_preference"."user_id");