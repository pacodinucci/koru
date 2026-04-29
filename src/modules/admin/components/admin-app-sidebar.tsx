"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronDownIcon,
  LayoutDashboardIcon,
  NotebookPenIcon,
  PanelsTopLeftIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

type AdminAppSidebarProps = {
  userEmail: string;
  currentPath: string;
};

export function AdminAppSidebar({
  userEmail,
  currentPath,
}: AdminAppSidebarProps) {
  const isBlogActive = currentPath.startsWith("/admin/blog");
  const isLayoutActive = currentPath === "/admin";
  const isPagesActive = currentPath.startsWith("/admin/pages");
  const isCmsActive = isLayoutActive || isPagesActive;
  const [cmsOpen, setCmsOpen] = useState(isCmsActive);
  const cmsItems = useMemo(
    () => [
      { title: "Layout", href: "/admin", icon: LayoutDashboardIcon },
      { title: "Pages", href: "/admin/pages", icon: PanelsTopLeftIcon },
    ],
    [],
  );

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="[&_[data-slot=sidebar-container]]:border-r-0 [&_[data-slot=sidebar-inner]]:rounded-2xl [&_[data-slot=sidebar-inner]]:border [&_[data-slot=sidebar-inner]]:border-slate-200 [&_[data-slot=sidebar-inner]]:bg-white [&_[data-slot=sidebar-inner]]:text-slate-800 [&_[data-slot=sidebar-inner]]:shadow-sm"
    >
      <SidebarHeader>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Koru CMS
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">Dashboard</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isBlogActive}
                  className="h-10 rounded-xl px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 data-active:bg-slate-100 data-active:text-slate-900 data-active:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.35)]"
                  render={<Link href="/admin/blog" />}
                >
                  <NotebookPenIcon />
                  <span>Blog</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isCmsActive}
                  className="h-10 rounded-xl px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 data-active:bg-slate-100 data-active:text-slate-900 data-active:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.35)]"
                  onClick={() => setCmsOpen((previous) => !previous)}
                >
                  <LayoutDashboardIcon />
                  <span>CMS</span>
                  <ChevronDownIcon
                    className={`ml-auto transition-transform ${cmsOpen ? "rotate-180" : ""}`}
                  />
                </SidebarMenuButton>
                {cmsOpen ? (
                  <SidebarMenuSub>
                    {cmsItems.map((item) => (
                      <SidebarMenuSubItem key={item.href}>
                        <SidebarMenuSubButton
                          isActive={
                            item.href === "/admin"
                              ? isLayoutActive
                              : isPagesActive
                          }
                          render={<Link href={item.href} />}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Signed in as
          <p className="mt-1 truncate text-sm font-medium text-slate-900">
            {userEmail}
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
