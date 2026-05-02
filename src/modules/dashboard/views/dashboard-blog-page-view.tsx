import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { auth } from "@/lib/auth";
import { DashboardShellLegacy } from "@/modules/dashboard/components/dashboard-shell-legacy";
import { signOutAction } from "@/modules/auth/server/auth-actions";

type DashboardBlogPageViewProps = {
  children: ReactNode;
};

export async function DashboardBlogPageView({ children }: DashboardBlogPageViewProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <DashboardShellLegacy
      userEmail={session.user.email}
      currentPath="/dashboard/blog"
      breadcrumbPage="Blog"
      onSignOut={signOutAction}
    >
      {children}
    </DashboardShellLegacy>
  );
}


