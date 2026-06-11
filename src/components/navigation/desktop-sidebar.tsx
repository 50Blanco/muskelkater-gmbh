"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { navItems } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface/60 px-4 py-6 backdrop-blur-md md:flex">
      <div className="px-2">
        <Logo />
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-soft text-foreground"
                  : "text-muted hover:bg-surface-2 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-5 shrink-0",
                  active ? "text-accent" : "text-dim group-hover:text-muted",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 text-xs text-dim">v0.4 · MVP</div>
    </aside>
  );
}
