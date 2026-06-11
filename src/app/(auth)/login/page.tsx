import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";
import { signIn } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "Einloggen" };

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Willkommen zurück</CardTitle>
        <p className="text-sm text-muted">
          Melde dich an, um weiterzumachen.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <AuthForm mode="login" action={signIn} />
        <p className="text-center text-sm text-muted">
          Noch kein Konto?{" "}
          <Link
            href="/register"
            className="font-medium text-accent hover:underline"
          >
            Jetzt registrieren
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
