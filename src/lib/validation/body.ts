import { z } from "zod";

/** Erlaubte Messwert-Typen für bodyMeasurement (App-seitig validiert). */
export const BODY_MEASUREMENT_TYPES = ["waist", "arm", "chest", "hip", "thigh"] as const;
export type BodyMeasurementType = (typeof BODY_MEASUREMENT_TYPES)[number];

export const bodyCheckinSchema = z.object({
  weightKg: z
    .number()
    .min(20, "Gewicht zu niedrig.")
    .max(400, "Gewicht zu hoch.")
    .optional(),
  waistCm: z
    .number()
    .min(30, "Bauchumfang zu niedrig.")
    .max(300, "Bauchumfang zu hoch.")
    .optional(),
  armCm: z
    .number()
    .min(10, "Armumfang zu niedrig.")
    .max(100, "Armumfang zu hoch.")
    .optional(),
}).refine(
  (d) => d.weightKg != null || d.waistCm != null || d.armCm != null,
  { message: "Mindestens ein Wert (Gewicht, Bauchumfang oder Armumfang) muss angegeben werden." },
);

export type BodyCheckinInput = z.infer<typeof bodyCheckinSchema>;
