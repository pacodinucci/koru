"use client";

import { ChevronDownIcon, LayoutGridIcon, LogOutIcon } from "lucide-react";

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
} from "@/components/ui/sidebar";
import { AdminAppSidebar } from "@/modules/admin/components/admin-app-sidebar";
import { CmsLandingEditor } from "@/modules/admin/components/cms-landing-editor";

type AdminDashboardShellProps = {
  userEmail: string;
  initialTextMap: Record<string, string>;
  onSignOut: (formData: FormData) => void;
};

export function AdminDashboardShell({
  userEmail,
  initialTextMap,
  onSignOut,
}: AdminDashboardShellProps) {
  return (
    <SidebarProvider>
      <AdminAppSidebar userEmail={userEmail} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <SidebarSeparator orientation="vertical" className="h-5" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>Admin</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>CMS</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm">
              Text editing mode
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="sm">
                  <Avatar className="size-6">
                    <AvatarFallback>
                      {userEmail.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDownIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <LayoutGridIcon />
                  Account
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={onSignOut}>
                  <DropdownMenuItem render={<button type="submit" />}>
                    <LogOutIcon />
                    Sign out
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <CmsLandingEditor initialTextMap={initialTextMap} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
