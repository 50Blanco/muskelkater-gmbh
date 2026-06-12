"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSocialGroup } from "@/app/(app)/heute/social-actions";

export function CreateGroupForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createSocialGroup({ name });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setName("");
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Neues Team erstellen
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted">
          Team-Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Team Montag"
          maxLength={50}
          required
          className="w-full rounded-[var(--radius-sm)] border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-dim focus-visible:border-accent focus-visible:outline-none"
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
        <Button type="submit" size="sm" disabled={isPending || name.trim().length < 2}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Erstellt …
            </>
          ) : (
            "Erstellen"
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setError(null);
            setName("");
          }}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
