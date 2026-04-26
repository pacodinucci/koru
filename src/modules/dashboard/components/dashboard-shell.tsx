"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronUp,
  LayoutDashboard,
  FileText,
  NotebookPen,
  HandCoins,
  ShieldCheck,
  Settings,
  User2,
  SlidersHorizontal,
} from "lucide-react";

import { CmsLandingEditor } from "@/modules/admin/components/cms-landing-editor";
import {
  AdminEditorPanelLayout,
  AdminEditorPanelProvider,
  useAdminEditorPanel,
} from "@/modules/admin/components/admin-editor-panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { LandingTextMap } from "@/modules/landing/types/landing-text";

type DashboardShellProps = {
  userEmail: string;
  initialTextMap: LandingTextMap;
};

const dashboardItems = [
  { title: "CMS", href: "/dashboard", icon: LayoutDashboard },
  { title: "Pages", href: "#", icon: FileText },
  { title: "Blog", href: "#", icon: NotebookPen },
  { title: "Donaciones", href: "#", icon: HandCoins },
  { title: "Seguridad", href: "#", icon: ShieldCheck },
  { title: "Configuración", href: "#", icon: Settings },
] as const;

export function DashboardShell({
  userEmail,
  initialTextMap,
}: DashboardShellProps) {
  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-center px-3 py-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2">
            <Image
              src="/branding/koru-logo.png"
              alt="Koru"
              width={120}
              height={34}
              className="h-8 w-auto object-contain group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7"
              priority
            />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-slate-500">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {dashboardItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={item.title === "CMS"}
                      className="h-10 rounded-xl px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 data-active:bg-slate-100 data-active:text-slate-900"
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="h-10 w-full justify-start rounded-xl border border-slate-200 bg-white px-2"
                />
              }
            >
              <Avatar className="size-6">
                <AvatarFallback>
                  {userEmail.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm">{userEmail}</span>
              <ChevronUp className="ml-auto h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuItem>
                <User2 className="h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="h-svh overflow-hidden bg-slate-50">
        <AdminEditorPanelProvider>
          <DashboardCanvas initialTextMap={initialTextMap} />
        </AdminEditorPanelProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DashboardCanvas({
  initialTextMap,
}: {
  initialTextMap: LandingTextMap;
}) {
  const { open, setOpen } = useAdminEditorPanel();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md">
        <SidebarTrigger />
        <SidebarSeparator orientation="vertical" className="h-5" />

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>Dashboard</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>CMS</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Button
          type="button"
          variant={open ? "secondary" : "ghost"}
          size="icon-sm"
          className="ml-auto"
          onClick={() => setOpen(!open)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="sr-only">Toggle right sidebar</span>
        </Button>
      </header>

      <AdminEditorPanelLayout className="min-h-0 h-full flex-1" variant="flush">
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden p-0">
          <CmsLandingEditor
            initialTextMap={initialTextMap}
            frameVariant="flush"
          />
        </main>
      </AdminEditorPanelLayout>
    </div>
  );
}
