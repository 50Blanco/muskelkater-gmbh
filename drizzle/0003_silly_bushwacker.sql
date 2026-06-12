CREATE TYPE "public"."social_group_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."social_reaction_type" AS ENUM('stark', 'weiter_so', 'respekt');--> statement-breakpoint
CREATE TYPE "public"."social_target_type" AS ENUM('workout_session', 'daily_mission', 'daily_habit_log');--> statement-breakpoint
CREATE TABLE "social_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"invite_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_group_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
ALTER TABLE "social_group" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "social_group_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "social_group_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_social_group_member" UNIQUE("group_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "social_group_member" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "social_reaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"target_type" "social_target_type" NOT NULL,
	"target_id" uuid NOT NULL,
	"reaction_type" "social_reaction_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_social_reaction" UNIQUE("group_id","user_id","target_type","target_id","reaction_type")
);
--> statement-breakpoint
ALTER TABLE "social_reaction" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "social_group" ADD CONSTRAINT "social_group_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_group_member" ADD CONSTRAINT "social_group_member_group_id_social_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."social_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_group_member" ADD CONSTRAINT "social_group_member_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_reaction" ADD CONSTRAINT "social_reaction_group_id_social_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."social_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_reaction" ADD CONSTRAINT "social_reaction_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_social_group_owner" ON "social_group" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "idx_social_group_member_user" ON "social_group_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_social_group_member_group" ON "social_group_member" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_social_reaction_group" ON "social_reaction" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_social_reaction_target" ON "social_reaction" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE POLICY "social_group_owner" ON "social_group" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "social_group"."owner_user_id") WITH CHECK ((select auth.uid()) = "social_group"."owner_user_id");--> statement-breakpoint
CREATE POLICY "social_group_member_owner" ON "social_group_member" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "social_group_member"."user_id") WITH CHECK ((select auth.uid()) = "social_group_member"."user_id");--> statement-breakpoint
CREATE POLICY "social_reaction_owner" ON "social_reaction" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "social_reaction"."user_id") WITH CHECK ((select auth.uid()) = "social_reaction"."user_id");