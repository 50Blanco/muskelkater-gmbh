"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createCustomExercise } from "@/app/(app)/training/actions";
import {
  EQUIPMENT_OPTIONS,
  EXPERIENCE_LEVELS,
  MUSCLE_GROUPS,
  TRAINING_LOCATIONS,
} from "@/lib/validation/workout";
import {
  LEVEL_LABELS,
  LOCATION_LABELS,
  MUSCLE_GROUP_LABELS,
} from "@/lib/training/labels";
import type { CustomExerciseRow } from "@/lib/workout/session-data";

const EQUIPMENT_LABELS: Record<string, string> = {
  bodyweight: "Körpergewicht",
  dumbbell: "Kurzhantel",
  barbell: "Langhantel",
  cable: "Kabelzug",
  machine: "Maschine",
  bands: "Widerstandsband",
  kettlebell: "Kettlebell",
  other: "Sonstiges",
};

const selectClass =
  "h-11 w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none";

interface FormState {
  name: string;
  muscleGroup: string;
  equipment: string;
  location: string;
  level: string;
  instructions: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  muscleGroup: "chest",
  equipment: "bodyweight",
  location: "both",
  level: "beginner",
  instructions: "",
  notes: "",
};

interface Props {
  customExercises: CustomExerciseRow[];
}

export function CustomExerciseSection({ customExercises }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createCustomExercise(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setForm(EMPTY_FORM);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Eigene Übungen
          </h2>
          <p className="text-sm text-muted">
            Ergänze Übungen, die in deinem Plan fehlen — nur für dich sichtbar.
          </p>
        </div>
        <Button
          type="button"
          variant={open ? "ghost" : "secondary"}
          size="sm"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <>
              <X className="size-4" /> Schließen
            </>
          ) : (
            <>
              <Plus className="size-4" /> Übung
            </>
          )}
        </Button>
      </div>

      {/* Bestehende eigene Übungen */}
      {customExercises.length > 0 && (
        <ul className="space-y-2">
          {customExercises.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border bg-surface px-3.5 py-2.5"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-3 text-muted">
                <Dumbbell className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {c.name}
                </p>
                <p className="text-xs text-muted">
                  {MUSCLE_GROUP_LABELS[c.muscleGroup] ?? c.muscleGroup}
                  {" · "}
                  {LOCATION_LABELS[c.location] ?? c.location}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Formular */}
      {open && (
        <div className="space-y-4 rounded-[var(--radius)] border border-border bg-surface-2/80 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="ce-name">Name der Übung</Label>
            <Input
              id="ce-name"
              value={form.name}
              maxLength={60}
              onChange={(e) => set("name", e.target.value)}
              placeholder="z. B. Bulgarian Split Squat"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ce-muscle">Muskelgruppe</Label>
              <select
                id="ce-muscle"
                className={selectClass}
                value={form.muscleGroup}
                onChange={(e) => set("muscleGroup", e.target.value)}
              >
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {MUSCLE_GROUP_LABELS[g] ?? g}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ce-equipment">Equipment</Label>
              <select
                id="ce-equipment"
                className={selectClass}
                value={form.equipment}
                onChange={(e) => set("equipment", e.target.value)}
              >
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <option key={eq} value={eq}>
                    {EQUIPMENT_LABELS[eq] ?? eq}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ce-location">Trainingsort</Label>
              <select
                id="ce-location"
                className={selectClass}
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              >
                {TRAINING_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {LOCATION_LABELS[loc] ?? loc}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ce-level">Schwierigkeit</Label>
              <select
                id="ce-level"
                className={selectClass}
                value={form.level}
                onChange={(e) => set("level", e.target.value)}
              >
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {LEVEL_LABELS[lvl] ?? lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ce-instructions">Technik-Hinweis</Label>
            <textarea
              id="ce-instructions"
              value={form.instructions}
              maxLength={500}
              rows={2}
              onChange={(e) => set("instructions", e.target.value)}
              placeholder="Kurz: Ausführung, worauf du achtest …"
              className={cn(
                selectClass,
                "h-auto resize-none py-2.5 leading-relaxed",
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ce-notes">
              Notiz{" "}
              <span className="font-normal text-dim">(optional)</span>
            </Label>
            <textarea
              id="ce-notes"
              value={form.notes}
              maxLength={500}
              rows={2}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="z. B. Alternative oder Erinnerung"
              className={cn(
                selectClass,
                "h-auto resize-none py-2.5 leading-relaxed",
              )}
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
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Speichert …
                </>
              ) : (
                <>
                  <Plus className="size-4" /> Übung speichern
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
