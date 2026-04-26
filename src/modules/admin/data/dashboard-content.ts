import {
  BlocksIcon,
  LayoutDashboardIcon,
  NotebookPenIcon,
  Settings2Icon,
  ShieldCheckIcon,
  WalletIcon,
} from "lucide-react";

import type {
  AdminNavItem,
  AdminRecentPage,
  AdminStat,
} from "@/modules/admin/types/dashboard";

export const adminNavItems: AdminNavItem[] = [
  { title: "CMS", href: "/admin", icon: LayoutDashboardIcon },
  { title: "Blog", href: "/admin/blog", icon: NotebookPenIcon },
  { title: "Pages", href: "#", icon: BlocksIcon, badge: "12" },
  { title: "Donaciones", href: "#", icon: WalletIcon, badge: "4" },
  { title: "Seguridad", href: "#", icon: ShieldCheckIcon },
  { title: "Configuración", href: "#", icon: Settings2Icon },
];

export const adminStats: AdminStat[] = [
  { label: "Published pages", value: "08", hint: "+2 this month" },
  { label: "Draft pages", value: "04", hint: "In editorial flow" },
  { label: "New donations", value: "16", hint: "Last 30 days" },
  { label: "Active sessions", value: "03", hint: "Admin area" },
];

export const adminRecentPages: AdminRecentPage[] = [
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
