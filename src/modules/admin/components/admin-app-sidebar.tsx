"use client";

import Link from "next/link";

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
} from "@/components/ui/sidebar";
import { adminNavItems } from "@/modules/admin/data/dashboard-content";
import { Badge } from "@/components/ui/badge";

type AdminAppSidebarProps = {
  userEmail: string;
  currentPath: string;
};

export function AdminAppSidebar({
  userEmail,
  currentPath,
}: AdminAppSidebarProps) {
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
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={item.href === currentPath}
                    className="h-10 rounded-xl px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 data-active:bg-slate-100 data-active:text-slate-900 data-active:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.35)]"
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                    {item.badge ? (
                      <Badge
                        variant="secondary"
                        className="ml-auto border border-slate-300 bg-slate-100 text-[0.7rem] text-slate-700"
                      >
                        {item.badge}
                      </Badge>
                    ) : null}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
