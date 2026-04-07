import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { auth } from "@/lib/auth";
import { AdminDashboardShell } from "@/modules/admin/components/admin-dashboard-shell";
import { signOutAction } from "@/modules/auth/server/auth-actions";

type AdminBlogPageViewProps = {
  children: ReactNode;
};

export async function AdminBlogPageView({ children }: AdminBlogPageViewProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <AdminDashboardShell
      userEmail={session.user.email}
      currentPath="/admin/blog"
      breadcrumbPage="Blog"
      onSignOut={signOutAction}
    >
      {children}
    </AdminDashboardShell>
  );
}
