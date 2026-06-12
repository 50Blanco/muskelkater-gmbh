CREATE TYPE "public"."challenge_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "daily_step_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"steps" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_daily_step_log" UNIQUE("user_id","log_date")
);
--> statement-breakpoint
ALTER TABLE "daily_step_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "team_challenge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"stake_text" text,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"status" "challenge_status" DEFAULT 'active' NOT NULL,
	"mode" text DEFAULT 'leaderboard' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team_challenge" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "daily_step_log" ADD CONSTRAINT "daily_step_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_challenge" ADD CONSTRAINT "team_challenge_group_id_social_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."social_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_challenge" ADD CONSTRAINT "team_challenge_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_daily_step_log_user" ON "daily_step_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_team_challenge_group" ON "team_challenge" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_team_challenge_status" ON "team_challenge" USING btree ("group_id","status");--> statement-breakpoint
CREATE POLICY "daily_step_log_owner" ON "daily_step_log" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "daily_step_log"."user_id") WITH CHECK ((select auth.uid()) = "daily_step_log"."user_id");--> statement-breakpoint
CREATE POLICY "team_challenge_member_select" ON "team_challenge" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from social_group_member m where m.group_id = "team_challenge"."group_id" and m.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "team_challenge_member_insert" ON "team_challenge" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("team_challenge"."created_by_user_id" = (select auth.uid()) and exists (select 1 from social_group_member m where m.group_id = "team_challenge"."group_id" and m.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "team_challenge_member_update" ON "team_challenge" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from social_group_member m where m.group_id = "team_challenge"."group_id" and m.user_id = (select auth.uid()))) WITH CHECK (exists (select 1 from social_group_member m where m.group_id = "team_challenge"."group_id" and m.user_id = (select auth.uid())));