import type { LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type DashboardStat = {
  label: string;
  value: string;
  hint: string;
};

export type DashboardRecentPage = {
  title: string;
  slug: string;
  status: "Draft" | "Published" | "Archived";
  updatedAt: string;
};

export type CmsTextField = {
  id: string;
  label: string;
  value: string;
  multiline?: boolean;
  fontSize: number;
};

export type CmsSection = {
  id: string;
  title: string;
  note: string;
  fields: CmsTextField[];
};

