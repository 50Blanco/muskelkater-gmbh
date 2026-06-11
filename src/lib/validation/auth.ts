import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Bitte gib eine gültige E-Mail-Adresse an."),
  password: z.string().min(1, "Bitte gib dein Passwort ein."),
});

export const signUpSchema = z
  .object({
    email: z.email("Bitte gib eine gültige E-Mail-Adresse an."),
    password: z.string().min(8, "Das Passwort braucht mindestens 8 Zeichen."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
