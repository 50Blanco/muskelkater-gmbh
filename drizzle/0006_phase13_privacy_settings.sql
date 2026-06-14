CREATE TABLE "user_privacy_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"show_training" boolean DEFAULT true NOT NULL,
	"show_steps" boolean DEFAULT true NOT NULL,
	"show_nutrition" boolean DEFAULT true NOT NULL,
	"show_water" boolean DEFAULT true NOT NULL,
	"show_habits" boolean DEFAULT true NOT NULL,
	"show_weekly_checkin_status" boolean DEFAULT true NOT NULL,
	"show_in_ranking" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_privacy_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_privacy_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_privacy_settings" ADD CONSTRAINT "user_privacy_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "user_privacy_settings_owner" ON "user_privacy_settings" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "user_privacy_settings"."user_id") WITH CHECK ((select auth.uid()) = "user_privacy_settings"."user_id");