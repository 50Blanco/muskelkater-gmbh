"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthState } from "@/app/(auth)/actions";

type AuthAction = (prev: AuthState, formData: FormData) => Promise<AuthState>;

interface AuthFormProps {
  mode: "login" | "register";
  action: AuthAction;
}

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );
  const isRegister = mode === "register";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="du@beispiel.de"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Passwort</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          placeholder={isRegister ? "Mind. 8 Zeichen" : "••••••••"}
          required
        />
      </div>

      {isRegister && (
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            required
          />
        </div>
      )}

      {state.error && (
        <p className="rounded-[var(--radius-sm)] border border-danger/40 bg-accent-soft px-3 py-2 text-sm text-foreground">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-[var(--radius-sm)] border border-success/40 bg-success/10 px-3 py-2 text-sm text-foreground">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending
          ? "Einen Moment …"
          : isRegister
            ? "Konto erstellen"
            : "Einloggen"}
      </Button>
    </form>
  );
}
