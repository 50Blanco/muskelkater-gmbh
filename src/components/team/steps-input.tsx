"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Footprints, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateMyDailySteps } from "@/app/(app)/team/actions";
import { STEPS_MAX } from "@/lib/validation/challenge";

interface Props {
  date: string;
  initialSteps: number | null;
}

/** Eigene Schritte für heute eintragen (nur für den eingeloggten Nutzer). */
export function StepsInput({ date, initialSteps }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(
    initialSteps != null ? String(initialSteps) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const steps = Number(value);
    if (!Number.isInteger(steps) || steps < 0 || steps > STEPS_MAX) {
      setError(`Bitte eine ganze Zahl zwischen 0 und ${STEPS_MAX.toLocaleString("de-DE")}.`);
      return;
    }

    startTransition(async () => {
      const result = await updateMyDailySteps({ date, steps });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Footprints className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim" />
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={STEPS_MAX}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="z. B. 8000"
            className="w-full rounded-[var(--radius-sm)] border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm tabular-nums text-foreground placeholder:text-dim focus-visible:border-accent focus-visible:outline-none"
          />
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : saved ? (
            <Check className="size-4" />
          ) : (
            "Speichern"
          )}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
