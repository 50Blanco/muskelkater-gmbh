CREATE TABLE "meal_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"meal_type" text NOT NULL,
	"title" text NOT NULL,
	"calories_kcal" integer,
	"protein_g" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meal_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "meal_log" ADD CONSTRAINT "meal_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_meal_log_user" ON "meal_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_meal_log_date" ON "meal_log" USING btree ("user_id","log_date");--> statement-breakpoint
CREATE POLICY "meal_log_owner" ON "meal_log" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "meal_log"."user_id") WITH CHECK ((select auth.uid()) = "meal_log"."user_id");