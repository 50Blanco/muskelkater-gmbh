import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Show only the mark without the wordmark. */
  iconOnly?: boolean;
}

/** Muskelkater wordmark — sportlich, mit rotem Akzent-Punkt. */
export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid size-8 place-items-center rounded-[10px] bg-accent text-accent-foreground shadow-[0_6px_18px_-8px_var(--color-accent-ring)]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-5"
          aria-hidden="true"
        >
          <path
            d="M4 9.5h2.5M17.5 9.5H20M6.5 7v5M17.5 7v5M9 10h6M9 14.5h6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!iconOnly && (
        <span className="font-display text-base font-bold tracking-tight text-foreground">
          MUSKEL<span className="text-accent">KATER</span>
        </span>
      )}
    </span>
  );
}
