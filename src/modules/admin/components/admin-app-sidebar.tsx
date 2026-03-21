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
};

export function AdminAppSidebar({ userEmail }: AdminAppSidebarProps) {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="rounded-lg border bg-sidebar-accent/40 px-3 py-2">
          <p className="text-xs uppercase tracking-[0.15em] text-sidebar-foreground/60">
            Koru CMS
          </p>
          <p className="mt-1 text-sm font-semibold">Dashboard</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={item.href === "/admin"}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                    {item.badge ? (
                      <Badge variant="secondary" className="ml-auto text-[0.7rem]">
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
        <div className="rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">
          Signed in as
          <p className="mt-1 truncate text-sm font-medium text-foreground">
            {userEmail}
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
