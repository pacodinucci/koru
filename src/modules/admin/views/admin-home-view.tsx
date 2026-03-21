import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AdminDashboardShell } from "@/modules/admin/components/admin-dashboard-shell";
import { signOutAction } from "@/modules/auth/server/auth-actions";
import { getCmsDraftTextMap } from "@/modules/cms/server/cms-text.repository";

export async function AdminHomeView() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const initialTextMap = await getCmsDraftTextMap();

  return (
    <AdminDashboardShell
      userEmail={session.user.email}
      initialTextMap={initialTextMap}
      onSignOut={signOutAction}
    />
  );
}
