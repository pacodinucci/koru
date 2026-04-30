"use client";

import {
  ChevronDownIcon,
  LayoutGridIcon,
  LogOutIcon,
} from "lucide-react";
import { useRef } from "react";
import type { ReactNode } from "react";

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
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DashboardEditorPanelLayout,
  DashboardEditorPanelProvider,
  DashboardEditorPanelToggleButton,
  useDashboardEditorPanel,
} from "@/modules/dashboard/components/dashboard-editor-panel";
import { DashboardAppSidebar } from "@/modules/dashboard/components/dashboard-app-sidebar";

type DashboardShellLegacyProps = {
  userEmail: string;
  currentPath: string;
  breadcrumbPage: string;
  children: ReactNode;
  showEditingModeButton?: boolean;
  onSignOut: (formData: FormData) => void;
};

export function DashboardShellLegacy({
  userEmail,
  currentPath,
  breadcrumbPage,
  children,
  showEditingModeButton = false,
  onSignOut,
}: DashboardShellLegacyProps) {
  return (
    <SidebarProvider>
      <DashboardAppSidebar userEmail={userEmail} currentPath={currentPath} />
      <SidebarInset className="bg-slate-50">
        <DashboardEditorPanelProvider>
          <DashboardMain
            userEmail={userEmail}
            breadcrumbPage={breadcrumbPage}
            showEditingModeButton={showEditingModeButton}
            onSignOut={onSignOut}
          >
            {children}
          </DashboardMain>
        </DashboardEditorPanelProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}

type DashboardMainProps = Pick<
  DashboardShellLegacyProps,
  "userEmail" | "breadcrumbPage" | "showEditingModeButton" | "onSignOut" | "children"
>;

function DashboardMain({
  userEmail,
  breadcrumbPage,
  children,
  showEditingModeButton = false,
  onSignOut,
}: DashboardMainProps) {
  const signOutFormRef = useRef<HTMLFormElement | null>(null);
  const { open: sidebarOpen } = useSidebar();
  const { open: panelOpen } = useDashboardEditorPanel();
  const compactMainPadding = sidebarOpen && panelOpen;

  return (
    <DashboardEditorPanelLayout className="min-h-svh">
      <div className="relative min-h-svh w-full max-w-full overflow-x-hidden">
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
          <div className="ml-auto flex items-center gap-2">
            {showEditingModeButton ? <DashboardEditorPanelToggleButton /> : null}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" className="rounded-full border border-slate-200 bg-white px-2.5" />
                }
              >
                <Avatar className="size-6 ring-1 ring-slate-200">
                  <AvatarFallback>
                    {userEmail.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <ChevronDownIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <LayoutGridIcon />
                  Account
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form ref={signOutFormRef} action={onSignOut} className="hidden" />
                <DropdownMenuItem
                  onClick={() => {
                    signOutFormRef.current?.requestSubmit();
                  }}
                >
                  <LogOutIcon />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div
          className={
            compactMainPadding
              ? "relative flex flex-1 min-h-0 min-w-0 flex-col gap-1 p-1 md:p-1.5 lg:p-2"
              : "relative flex flex-1 min-h-0 min-w-0 flex-col gap-3 p-2 md:p-3 lg:p-4"
          }
        >
          <section className="min-h-0 min-w-0">
            {children}
          </section>
        </div>
      </div>
    </DashboardEditorPanelLayout>
  );
}


