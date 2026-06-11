"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * TEMPORÄR (Phase 1): markiert das Onboarding als abgeschlossen, damit der
 * geschützte App-Bereich getestet werden kann. In Phase 2 wird dies durch das
 * echte Onboarding ersetzt, das Profil + Ziel speichert und diese Flag setzt.
 */
export async function completeOnboardingTemporary(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.auth.updateUser({
    data: { onboarding_completed: true },
  });

  revalidatePath("/", "layout");
  redirect("/heute");
}
