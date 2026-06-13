import {
  Dumbbell,
  Home,
  LineChart,
  Sparkles,
  User,
  Users2,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Hauptnavigation der App (Reihenfolge = Bottom-Tab + Sidebar). */
export const navItems: NavItem[] = [
  { href: "/heute", label: "Heute", icon: Home },
  { href: "/team", label: "Team", icon: Users2 },
  { href: "/training", label: "Training", icon: Dumbbell },
  { href: "/ernaehrung", label: "Ernährung", icon: UtensilsCrossed },
  { href: "/fortschritt", label: "Fortschritt", icon: LineChart },
  { href: "/coach", label: "Coach", icon: Sparkles },
  { href: "/profil", label: "Profil", icon: User },
];
