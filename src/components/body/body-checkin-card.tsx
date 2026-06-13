"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { submitBodyCheckin } from "@/app/(app)/heute/actions";

interface Props {
  checkinDone: boolean;
  isSunday: boolean;
}

/**
 * Wöchentlicher Körper-Check-in.
 * Messwerte (Gewicht, Bauchumfang, Armumfang) bleiben privat —
 * das Team sieht nur den Erledigt-Status.
 */
export function BodyCheckinCard({ checkinDone, isSunday }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [arm, setArm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(checkinDone);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const weightKg = weight !== "" ? parseFloat(weight) : undefined;
    const waistCm = waist !== "" ? parseFloat(waist) : undefined;
    const armCm = arm !== "" ? parseFloat(arm) : undefined;

    if (weightKg == null && waistCm == null && armCm == null) {
      setError("Bitte mindestens einen Wert eintragen.");
      return;
    }

    startTransition(async () => {
      const result = await submitBodyCheckin({ weightKg, waistCm, armCm });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)] border bg-surface",
        saved
          ? "border-success/40"
          : isSunday
            ? "border-accent/50"
            : "border-border",
      )}
    >
      <button
        type="button"
        onClick={() => !saved && setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3 text-left",
          saved && "cursor-default",
        )}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <ClipboardCheck
            className={cn(
              "size-4 shrink-0",
              saved ? "text-success" : isSunday ? "text-accent" : "text-muted",
            )}
          />
          <div>
            <p className="text-sm font-medium text-foreground">
              Wöchentlicher Check-in
              {isSunday && !saved && (
                <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                  Heute ist Sonntag
                </span>
              )}
            </p>
            <p className="text-xs text-muted">
              {saved
                ? "Diese Woche erledigt · +50 Punkte"
                : "Gewicht, Bauch- und Armumfang — nur für dich sichtbar"}
            </p>
          </div>
        </div>
        {saved ? (
          <Check className="size-4 shrink-0 text-success" />
        ) : (
          open ? (
            <ChevronUp className="size-4 shrink-0 text-dim" />
          ) : (
            <ChevronDown className="size-4 shrink-0 text-dim" />
          )
        )}
      </button>

      {open && !saved && (
        <form
          onSubmit={handleSubmit}
          className="border-t border-border px-4 pb-4 pt-3 space-y-3"
        >
          <p className="text-xs text-muted">
            Alle Felder optional — mindestens eines muss ausgefüllt sein.
            Dein Team sieht nur, ob du den Check-in erledigt hast.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="text-xs font-medium text-foreground">
                Gewicht (kg)
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min={20}
                max={400}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="z. B. 82,5"
                className="h-10 w-full rounded-[var(--radius-sm)] border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-dim focus-visible:border-accent focus-visible:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-foreground">
                Bauchumfang (cm)
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min={30}
                max={300}
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                placeholder="z. B. 90"
                className="h-10 w-full rounded-[var(--radius-sm)] border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-dim focus-visible:border-accent focus-visible:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-foreground">
                Armumfang (cm)
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min={10}
                max={100}
                value={arm}
                onChange={(e) => setArm(e.target.value)}
                placeholder="z. B. 35"
                className="h-10 w-full rounded-[var(--radius-sm)] border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-dim focus-visible:border-accent focus-visible:outline-none"
              />
            </label>
          </div>

          {error && (
            <p role="alert" className="text-xs text-danger">
              {error}
            </p>
          )}

          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Check-in speichern"
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
