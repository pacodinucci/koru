import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { CmsLandingEditor } from "@/modules/dashboard/components/cms-landing-editor";
import { DashboardShellLegacy } from "@/modules/dashboard/components/dashboard-shell-legacy";
import { signOutAction } from "@/modules/auth/server/auth-actions";
import { getCmsDraftTextMap } from "@/modules/cms/server/cms-text.repository";

export async function DashboardHomeView() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const initialTextMap = await getCmsDraftTextMap();

  return (
    <DashboardShellLegacy
      userEmail={session.user.email}
      currentPath="/dashboard"
      breadcrumbPage="CMS"
      showEditingModeButton
      onSignOut={signOutAction}
    >
      <CmsLandingEditor initialTextMap={initialTextMap} />
    </DashboardShellLegacy>
  );
}


