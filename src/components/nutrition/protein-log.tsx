"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { logProtein } from "@/app/(app)/ernaehrung/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  currentG: number | null;
}

export function ProteinLog({ currentG }: Props) {
  const [value, setValue] = useState(currentG !== null ? String(currentG) : "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    const raw = value.trim().replace(",", ".");
    const g = Number(raw);
    if (!raw || !Number.isFinite(g) || !Number.isInteger(g) || g < 0 || g > 500) {
      setError("Bitte einen Wert von 0–500 g eingeben (ganze Zahl).");
      return;
    }
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await logProtein({ proteinG: g });
      if ("error" in result) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          max={500}
          placeholder="z.B. 150"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="h-11"
          aria-label="Protein heute in Gramm"
        />
        <Button
          type="button"
          onClick={save}
          disabled={isPending || value.trim() === ""}
          className="h-11 shrink-0"
        >
          {saved ? (
            <>
              <Check className="size-4" /> Gespeichert
            </>
          ) : isPending ? (
            "…"
          ) : (
            "Speichern"
          )}
        </Button>
      </div>
      <p className="text-xs text-dim">
        Gib deinen Tageswert ein — nicht pro Mahlzeit.
      </p>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
