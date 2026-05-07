import type { LucideIcon } from "lucide-react";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type AdminStat = {
  label: string;
  value: string;
  hint: string;
};

export type AdminRecentPage = {
  title: string;
  slug: string;
  status: "Draft" | "Published" | "Archived";
  updatedAt: string;
};
