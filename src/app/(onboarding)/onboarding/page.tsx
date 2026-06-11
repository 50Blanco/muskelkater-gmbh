import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/actions";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = { title: "Onboarding" };

export default function OnboardingPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 py-8">
      <header className="mb-8 flex items-center justify-between gap-4">
        <Logo />
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Abmelden
          </Button>
        </form>
      </header>

      <main className="flex flex-1 flex-col items-center pb-10">
        <OnboardingWizard />
      </main>
    </div>
  );
}
