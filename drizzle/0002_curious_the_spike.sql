ALTER TABLE "workout_day_exercise" ALTER COLUMN "exercise_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "workout_day_exercise" ADD COLUMN "custom_exercise_id" uuid;--> statement-breakpoint
ALTER TABLE "workout_day_exercise" ADD CONSTRAINT "workout_day_exercise_custom_exercise_id_custom_exercise_id_fk" FOREIGN KEY ("custom_exercise_id") REFERENCES "public"."custom_exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_wde_custom_exercise" ON "workout_day_exercise" USING btree ("custom_exercise_id");--> statement-breakpoint
ALTER TABLE "workout_day_exercise" ADD CONSTRAINT "workout_day_exercise_exercise_ref" CHECK (("workout_day_exercise"."exercise_id" is not null) != ("workout_day_exercise"."custom_exercise_id" is not null));