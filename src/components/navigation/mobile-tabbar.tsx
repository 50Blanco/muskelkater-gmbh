"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

export function MobileTabbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/85 backdrop-blur-lg md:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-7">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-1 px-0.5 py-2.5 text-[9px] font-medium transition-colors",
                  active ? "text-accent" : "text-dim hover:text-muted",
                )}
              >
                <Icon className="size-5" />
                <span className="w-full truncate text-center">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {/* Safe-Area für iOS-Geräte */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
