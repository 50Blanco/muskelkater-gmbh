ALTER TYPE "public"."social_target_type" ADD VALUE 'member_week';--> statement-breakpoint
CREATE TABLE "weekly_body_checkin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"week_date" date NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_weekly_body_checkin" UNIQUE("user_id","week_date")
);
--> statement-breakpoint
ALTER TABLE "weekly_body_checkin" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "weekly_body_checkin" ADD CONSTRAINT "weekly_body_checkin_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_weekly_body_checkin_user" ON "weekly_body_checkin" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_weekly_body_checkin_week" ON "weekly_body_checkin" USING btree ("user_id","week_date");--> statement-breakpoint
CREATE POLICY "weekly_body_checkin_owner" ON "weekly_body_checkin" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "weekly_body_checkin"."user_id") WITH CHECK ((select auth.uid()) = "weekly_body_checkin"."user_id");