"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinSocialGroupByCode } from "@/app/(app)/heute/social-actions";

export function JoinGroupForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await joinSocialGroupByCode({ inviteCode: code });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setCode("");
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <LogIn className="size-4" /> Per Code beitreten
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted">
          Einladungscode
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          placeholder="z. B. AB3CD7EF"
          maxLength={8}
          required
          className="w-full rounded-[var(--radius-sm)] border border-border bg-surface-2 px-3 py-2 font-mono text-sm tracking-widest text-foreground placeholder:text-dim focus-visible:border-accent focus-visible:outline-none"
        />
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isPending || code.length < 8}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Tritt bei …
            </>
          ) : (
            "Beitreten"
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setError(null);
            setCode("");
          }}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
