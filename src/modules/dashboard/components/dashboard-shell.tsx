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
  CalendarDays,
  ClipboardList,
  Mail,
  Users,
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
  userRole?: "ADMIN" | "TEACHER" | "PARENT";
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
  contentHeader?: ReactNode;
  sidePanelContent?: ReactNode;
  contentNoPadding?: boolean;
  showPanelToggle?: boolean;
  panelDefaultOpen?: boolean;
};

export function DashboardShell({
  userEmail,
  userRole = "ADMIN",
  cmsPages = [],
  initialTextMap,
  cmsPageSlug = "/",
  cmsPreviewUrl,
  editorMode = "page",
  breadcrumbPage = "CMS",
  children,
  contentHeader,
  sidePanelContent,
  contentNoPadding = false,
  showPanelToggle = false,
  panelDefaultOpen = false,
}: DashboardShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentEditorSlug = searchParams.get("slug") ?? "/";
  const isBlogActive = pathname.startsWith("/dashboard/blog");
  const isCalendarActive = pathname.startsWith("/dashboard/calendar");
  const isUsersActive = pathname.startsWith("/dashboard/users");
  const isMailingActive = pathname.startsWith("/dashboard/mailing");
  const isStudentsActive = pathname.startsWith("/dashboard/students");
  const isTeachersActive = pathname.startsWith("/dashboard/teachers");
  const isExamsActive = pathname.startsWith("/dashboard/exams");
  const isLayoutActive = pathname.startsWith("/dashboard/layout");
  const isContentActive = pathname.startsWith("/dashboard/content");
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
  const isCmsActive =
    isLayoutActive || isLandingActive || isPageEditorActive || isContentActive;
  const [cmsOpen, setCmsOpen] = useState(isCmsActive);
  const [pagesOpen, setPagesOpen] = useState(isLandingActive);
  const [contentOpen, setContentOpen] = useState(isContentActive);
  const isAdmin = userRole === "ADMIN";
  const sidebarMenuButtonClass = "h-10 rounded-xl px-3 text-slate-600 hover:bg-[color-mix(in_srgb,var(--brand-600)_14%,white)] hover:text-[var(--brand-700)] data-active:bg-[color-mix(in_srgb,var(--brand-600)_14%,white)] data-active:text-[var(--brand-700)]";


  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-center px-3 py-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2">
            <Link href="/" aria-label="Volver al inicio">
              <Image
                src="/branding/koru-logo.png"
                alt="Koru"
                width={120}
                height={34}
                className="h-8 w-auto object-contain group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7"
                priority
              />
            </Link>
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
                    className={sidebarMenuButtonClass}
                    render={<Link href="/dashboard/blog" />}
                  >
                    <NotebookPen />
                    <span>Blog</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {isAdmin ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isCmsActive}
                      className={sidebarMenuButtonClass}
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
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          isActive={isContentActive}
                          onClick={() => setContentOpen((previous) => !previous)}
                        >
                          <FileText />
                          <span>Contenido</span>
                          <ChevronDown
                            className={`ml-auto transition-transform ${contentOpen ? "rotate-180" : ""}`}
                          />
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      {contentOpen ? (
                        <SidebarMenuSub className="mx-6">
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              isActive={pathname === "/dashboard/content/landing"}
                              render={<Link href="/dashboard/content/landing" />}
                            >
                              <FileText />
                              <span>Landing</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      ) : null}
                      </SidebarMenuSub>
                    ) : null}
                  </SidebarMenuItem>
                ) : null}

                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isCalendarActive}
                    className={sidebarMenuButtonClass}
                    render={<Link href="/dashboard/calendar" />}
                  >
                    <CalendarDays />
                    <span>Calendario</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {isAdmin ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isUsersActive}
                      className={sidebarMenuButtonClass}
                      render={<Link href="/dashboard/users" />}
                    >
                      <Users />
                      <span>Usuarios</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}

                {isAdmin ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isMailingActive}
                      className={sidebarMenuButtonClass}
                      render={<Link href="/dashboard/mailing" />}
                    >
                      <Mail />
                      <span>Mailing</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}

                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isStudentsActive}
                    className={sidebarMenuButtonClass}
                    render={<Link href="/dashboard/students" />}
                  >
                    <Users />
                    <span>Alumnos</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isExamsActive}
                    className={sidebarMenuButtonClass}
                    render={<Link href="/dashboard/exams" />}
                  >
                    <ClipboardList />
                    <span>Notas</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {isAdmin ? (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isTeachersActive}
                        className={sidebarMenuButtonClass}
                        render={<Link href="/dashboard/teachers" />}
                      >
                        <User2 />
                        <span>Docentes</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        className={sidebarMenuButtonClass}
                        render={<Link href="#" />}
                      >
                        <HandCoins />
                        <span>Donaciones</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        className={sidebarMenuButtonClass}
                        render={<Link href="#" />}
                      >
                        <ShieldCheck />
                        <span>Seguridad</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        className={sidebarMenuButtonClass}
                        render={<Link href="#" />}
                      >
                        <Settings />
                        <span>Configuracion</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                ) : null}
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
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-56 [font-family:var(--font-montserrat)]"
            >
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
            contentHeader={contentHeader}
            sidePanelContent={sidePanelContent}
            contentNoPadding={contentNoPadding}
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
  contentHeader,
  sidePanelContent,
  contentNoPadding,
  showPanelToggle,
}: {
  initialTextMap?: LandingTextMap;
  cmsPageSlug: string;
  cmsPreviewUrl?: string;
  editorMode: "layout" | "page";
  breadcrumbPage: string;
  children?: ReactNode;
  contentHeader?: ReactNode;
  sidePanelContent?: ReactNode;
  contentNoPadding: boolean;
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
        <div className="flex min-h-0 h-full flex-1 flex-col overflow-hidden">
          {contentHeader ? (
            <div className="border-b border-slate-200 bg-white px-2 py-2 md:px-3 lg:px-4">
              {contentHeader}
            </div>
          ) : null}
          <DashboardEditorPanelLayout
            className="min-h-0 flex-1"
            variant="flush"
            panelContent={sidePanelContent}
          >
            <main
              className={`h-full min-h-0 min-w-0 overflow-y-auto ${contentNoPadding ? "p-0" : "p-2 md:p-3 lg:p-4"}`}
            >
              {children}
            </main>
          </DashboardEditorPanelLayout>
        </div>
      ) : (
        <main className="h-full min-h-0 min-w-0 overflow-y-auto p-2 md:p-3 lg:p-4">
          {children}
        </main>
      )}
    </div>
  );
}

