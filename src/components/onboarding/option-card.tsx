"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

/** Große auswählbare Karte für Onboarding-Optionen (Single-Select). */
export function OptionCard({
  selected,
  onSelect,
  title,
  description,
  icon,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-[var(--radius)] border px-4 py-3.5 text-left transition-colors",
        selected
          ? "border-accent bg-accent-soft"
          : "border-border bg-surface hover:bg-surface-2",
      )}
    >
      {icon && (
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-[10px]",
            selected ? "bg-accent text-accent-foreground" : "bg-surface-3 text-muted",
          )}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">
          {title}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted">{description}</span>
        )}
      </span>
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border",
          selected
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border-strong bg-transparent text-transparent",
        )}
      >
        <Check className="size-3" />
      </span>
    </button>
  );
}

interface ChipProps {
  selected: boolean;
  onSelect: () => void;
  label: string;
}

/** Kompakter Auswahl-Chip (z. B. Trainingstage, Minuten, Wochentage). */
export function OptionChip({ selected, onSelect, label }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "h-11 min-w-11 rounded-[var(--radius-sm)] border px-3 text-sm font-medium transition-colors",
        selected
          ? "border-accent bg-accent-soft text-foreground"
          : "border-border bg-surface text-muted hover:bg-surface-2 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
