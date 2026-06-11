import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";
import { signUp } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "Registrieren" };

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Konto erstellen</CardTitle>
        <p className="text-sm text-muted">
          Starte in unter einer Minute.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <AuthForm mode="register" action={signUp} />
        <p className="text-center text-sm text-muted">
          Schon dabei?{" "}
          <Link
            href="/login"
            className="font-medium text-accent hover:underline"
          >
            Hier einloggen
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
