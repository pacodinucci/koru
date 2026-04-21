"use client";

import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  LayoutGridIcon,
  LogOutIcon,
  SparklesIcon,
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
} from "@/components/ui/sidebar";
import { adminStats } from "@/modules/admin/data/dashboard-content";
import { AdminAppSidebar } from "@/modules/admin/components/admin-app-sidebar";

type AdminDashboardShellProps = {
  userEmail: string;
  currentPath: string;
  breadcrumbPage: string;
  children: ReactNode;
  showEditingModeButton?: boolean;
  onSignOut: (formData: FormData) => void;
};

export function AdminDashboardShell({
  userEmail,
  currentPath,
  breadcrumbPage,
  children,
  showEditingModeButton = false,
  onSignOut,
}: AdminDashboardShellProps) {
  const signOutFormRef = useRef<HTMLFormElement | null>(null);

  return (
    <SidebarProvider>
      <AdminAppSidebar userEmail={userEmail} currentPath={currentPath} />
      <SidebarInset className="bg-slate-50">
        <div className="relative min-h-svh">
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md">
            <SidebarTrigger />
            <SidebarSeparator orientation="vertical" className="h-5" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>Admin</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{breadcrumbPage}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-2">
              {showEditingModeButton ? (
                <Button variant="outline" size="sm" className="rounded-full">
                  <SparklesIcon />
                  Text editing mode
                </Button>
              ) : null}
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

          <div className="relative flex flex-1 flex-col gap-5 p-4 md:p-6 lg:p-8">
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {adminStats.map((stat) => (
                <article
                  key={stat.label}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-xs tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <p className="text-2xl font-semibold leading-none">
                      {stat.value}
                    </p>
                    <ArrowUpRightIcon className="size-4 text-muted-foreground transition group-hover:text-foreground" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{stat.hint}</p>
                </article>
              ))}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm md:p-3">
              {children}
            </section>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
