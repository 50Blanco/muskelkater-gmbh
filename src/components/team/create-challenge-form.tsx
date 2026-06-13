"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trophy } from "lucide-react";
import { addDaysToIso } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { createTeamChallenge } from "@/app/(app)/team/actions";

interface Template {
  label: string;
  days: number;
  stakeText: string;
}

const CHALLENGE_TEMPLATES: Template[] = [
  { label: "7 Tage Neustart", days: 7, stakeText: "" },
  { label: "30 Tage durchziehen", days: 30, stakeText: "" },
  { label: "Schritte-Woche", days: 7, stakeText: "Meiste Schritte gewinnt" },
  { label: "Training & Check-in", days: 14, stakeText: "" },
  { label: "Team-Konstanz", days: 21, stakeText: "" },
];

interface Props {
  groupId: string;
  defaultStart: string;
  defaultEnd: string;
  hasActive: boolean;
}

const inputClass =
  "w-full rounded-[var(--radius-sm)] border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-dim focus-visible:border-accent focus-visible:outline-none";

export function CreateChallengeForm({
  groupId,
  defaultStart,
  defaultEnd,
  hasActive,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startsOn, setStartsOn] = useState(defaultStart);
  const [endsOn, setEndsOn] = useState(defaultEnd);
  const [stakeText, setStakeText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setTitle("");
    setStartsOn(defaultStart);
    setEndsOn(defaultEnd);
    setStakeText("");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTeamChallenge({
        groupId,
        title,
        startsOn,
        endsOn,
        stakeText: stakeText.trim() || undefined,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    });
  };

  const applyTemplate = (tpl: Template) => {
    setTitle(tpl.label);
    setEndsOn(addDaysToIso(defaultStart, tpl.days));
    if (tpl.stakeText) setStakeText(tpl.stakeText);
  };

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant={hasActive ? "secondary" : "primary"}
        onClick={() => setOpen(true)}
      >
        <Trophy className="size-4" />
        {hasActive ? "Neue Challenge starten" : "Challenge starten"}
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Vorlagen */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted">Vorlage wählen</p>
        <div className="flex flex-wrap gap-1.5">
          {CHALLENGE_TEMPLATES.map((tpl) => (
            <button
              key={tpl.label}
              type="button"
              onClick={() => applyTemplate(tpl)}
              className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted hover:border-accent/40 hover:text-accent"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted">Titel</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z. B. Sommerform"
          maxLength={60}
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted">Start</label>
          <input
            type="date"
            value={startsOn}
            onChange={(e) => setStartsOn(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted">Ende</label>
          <input
            type="date"
            value={endsOn}
            onChange={(e) => setEndsOn(e.target.value)}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted">
          Einsatz <span className="text-dim">(optional, nur Spaß)</span>
        </label>
        <input
          type="text"
          value={stakeText}
          onChange={(e) => setStakeText(e.target.value)}
          placeholder="z. B. Verlierer gibt Essen aus"
          maxLength={140}
          className={inputClass}
        />
      </div>

      {hasActive && (
        <p className="text-xs text-dim">
          Die aktuelle Challenge wird dabei abgeschlossen.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={isPending || title.trim().length < 2}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Startet …
            </>
          ) : (
            "Challenge anlegen"
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            reset();
          }}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
