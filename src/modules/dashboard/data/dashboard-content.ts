import {
  BlocksIcon,
  LayoutDashboardIcon,
  NotebookPenIcon,
  Settings2Icon,
  ShieldCheckIcon,
  WalletIcon,
} from "lucide-react";

import type {
  DashboardNavItem,
  DashboardRecentPage,
  DashboardStat,
} from "@/modules/dashboard/types/dashboard";

export const DashboardNavItems: DashboardNavItem[] = [
  { title: "CMS", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Blog", href: "/dashboard/blog", icon: NotebookPenIcon },
  { title: "Pages", href: "#", icon: BlocksIcon, badge: "12" },
  { title: "Donaciones", href: "#", icon: WalletIcon, badge: "4" },
  { title: "Seguridad", href: "#", icon: ShieldCheckIcon },
  { title: "ConfiguraciÃ³n", href: "#", icon: Settings2Icon },
];

export const DashboardStats: DashboardStat[] = [
  { label: "Published pages", value: "08", hint: "+2 this month" },
  { label: "Draft pages", value: "04", hint: "In editorial flow" },
  { label: "New donations", value: "16", hint: "Last 30 days" },
  { label: "Active sessions", value: "03", hint: "Dashboard area" },
];

export const DashboardRecentPages: DashboardRecentPage[] = [
  {
    title: "Home - Koru OSA",
    slug: "/",
    status: "Published",
    updatedAt: "Today, 10:24",
  },
  {
    title: "About Koru",
    slug: "/about",
    status: "Draft",
    updatedAt: "Yesterday, 18:40",
  },
  {
    title: "Donation Journey",
    slug: "/donate",
    status: "Draft",
    updatedAt: "Yesterday, 11:15",
  },
  {
    title: "Community Manifesto",
    slug: "/community",
    status: "Archived",
    updatedAt: "Mar 19, 09:02",
  },
];

