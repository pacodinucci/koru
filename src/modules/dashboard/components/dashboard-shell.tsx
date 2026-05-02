"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  ChevronDown,
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

import { CmsLandingEditor } from "@/modules/dashboard/components/cms-landing-editor";
import {
  DashboardEditorPanelLayout,
  DashboardEditorPanelProvider,
  useDashboardEditorPanel,
} from "@/modules/dashboard/components/dashboard-editor-panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { LandingTextMap } from "@/modules/landing/types/landing-text";

type DashboardShellProps = {
  userEmail: string;
  cmsPages?: Array<{
    slug: string;
    isDynamic?: boolean;
  }>;
  initialTextMap?: LandingTextMap;
  cmsPageSlug?: string;
  cmsPreviewUrl?: string;
  editorMode?: "layout" | "page";
  breadcrumbPage?: string;
  children?: ReactNode;
  showPanelToggle?: boolean;
  panelDefaultOpen?: boolean;
};

export function DashboardShell({
  userEmail,
  cmsPages = [],
  initialTextMap,
  cmsPageSlug = "/",
  cmsPreviewUrl,
  editorMode = "page",
  breadcrumbPage = "CMS",
  children,
  showPanelToggle = false,
  panelDefaultOpen = false,
}: DashboardShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentEditorSlug = searchParams.get("slug") ?? "/";
  const isBlogActive = pathname.startsWith("/dashboard/blog");
  const isLayoutActive = pathname.startsWith("/dashboard/layout");
  const isPageEditorActive =
    pathname.startsWith("/dashboard/pages/edit") ||
    /^\/dashboard\/pages\/[^/]+$/.test(pathname);
  const pathnamePageSegment = pathname.startsWith("/dashboard/pages/")
    ? pathname.replace("/dashboard/pages/", "")
    : "";
  const currentPathSlug =
    pathnamePageSegment && pathnamePageSegment !== "landing"
      ? `/${decodeURIComponent(pathnamePageSegment)}`
      : null;
  const isLandingActive = pathname.startsWith("/dashboard/pages/landing");
  const isCmsActive = isLayoutActive || isLandingActive || isPageEditorActive;
  const [cmsOpen, setCmsOpen] = useState(isCmsActive);
  const [pagesOpen, setPagesOpen] = useState(isLandingActive);

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
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isBlogActive}
                    className="h-10 rounded-xl px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 data-active:bg-slate-100 data-active:text-slate-900"
                    render={<Link href="/dashboard/blog" />}
                  >
                    <NotebookPen />
                    <span>Blog</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isCmsActive}
                    className="h-10 rounded-xl px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 data-active:bg-slate-100 data-active:text-slate-900"
                    onClick={() => setCmsOpen((previous) => !previous)}
                  >
                    <LayoutDashboard />
                    <span>CMS</span>
                    <ChevronDown
                      className={`ml-auto transition-transform ${cmsOpen ? "rotate-180" : ""}`}
                    />
                  </SidebarMenuButton>

                  {cmsOpen ? (
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          isActive={isLayoutActive}
                          render={<Link href="/dashboard/layout" />}
                        >
                          <LayoutDashboard />
                          <span>Layout</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          isActive={isLandingActive || isPageEditorActive}
                          onClick={() => setPagesOpen((previous) => !previous)}
                        >
                          <FileText />
                          <span>Pages</span>
                          <ChevronDown
                            className={`ml-auto transition-transform ${pagesOpen ? "rotate-180" : ""}`}
                          />
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      {pagesOpen ? (
                        <SidebarMenuSub className="mx-6">
                          {cmsPages.map((page) => {
                            const href =
                              page.slug === "/"
                                ? "/dashboard/pages/landing"
                                : `/dashboard/pages/${encodeURIComponent(page.slug.slice(1))}`;
                            const isCurrent =
                              (pathname === "/dashboard/pages/edit" &&
                                decodeURIComponent(currentEditorSlug) === page.slug) ||
                              currentPathSlug === page.slug;

                            return (
                              <SidebarMenuSubItem key={page.slug}>
                                <SidebarMenuSubButton
                                  isActive={isCurrent}
                                  render={<Link href={href} />}
                                >
                                  <FileText />
                                  <span>{page.slug === "/" ? "Landing" : page.slug}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="h-10 rounded-xl px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    render={<Link href="#" />}
                  >
                    <HandCoins />
                    <span>Donaciones</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="h-10 rounded-xl px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    render={<Link href="#" />}
                  >
                    <ShieldCheck />
                    <span>Seguridad</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="h-10 rounded-xl px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    render={<Link href="#" />}
                  >
                    <Settings />
                    <span>Configuracion</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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

      <SidebarInset className="h-svh bg-slate-50 md:h-[calc(100svh-1rem)]">
        <DashboardEditorPanelProvider
          defaultOpen={
            panelDefaultOpen || editorMode === "layout"
          }
        >
          <DashboardCanvas
            initialTextMap={initialTextMap}
            cmsPageSlug={cmsPageSlug}
            cmsPreviewUrl={cmsPreviewUrl}
            editorMode={editorMode}
            breadcrumbPage={breadcrumbPage}
            showPanelToggle={showPanelToggle}
          >
            {children}
          </DashboardCanvas>
        </DashboardEditorPanelProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DashboardCanvas({
  initialTextMap,
  cmsPageSlug,
  cmsPreviewUrl,
  editorMode,
  breadcrumbPage,
  children,
  showPanelToggle,
}: {
  initialTextMap?: LandingTextMap;
  cmsPageSlug: string;
  cmsPreviewUrl?: string;
  editorMode: "layout" | "page";
  breadcrumbPage: string;
  children?: ReactNode;
  showPanelToggle: boolean;
}) {
  const { open, setOpen } = useDashboardEditorPanel();
  const isCmsEditor = !children;
  const canUsePanel = isCmsEditor || showPanelToggle;

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
              <BreadcrumbPage>{breadcrumbPage}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {canUsePanel ? (
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
        ) : null}
      </header>

      {isCmsEditor ? (
        <DashboardEditorPanelLayout className="min-h-0 h-full flex-1" variant="flush">
          <main className="h-full min-h-0 min-w-0 overflow-hidden p-0">
            <CmsLandingEditor
              initialTextMap={initialTextMap ?? {}}
              pageSlug={cmsPageSlug}
              previewUrl={cmsPreviewUrl}
              frameVariant="flush"
              editorMode={editorMode}
            />
          </main>
        </DashboardEditorPanelLayout>
      ) : canUsePanel ? (
        <DashboardEditorPanelLayout className="min-h-0 h-full flex-1" variant="flush">
          <main className="h-full min-h-0 min-w-0 overflow-y-auto p-2 md:p-3 lg:p-4">
            {children}
          </main>
        </DashboardEditorPanelLayout>
      ) : (
        <main className="h-full min-h-0 min-w-0 overflow-y-auto p-2 md:p-3 lg:p-4">
          {children}
        </main>
      )}
    </div>
  );
}

