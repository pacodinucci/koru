import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getCmsDraftTextMap } from "@/modules/cms/server/cms-text.repository";
import { discoverPagesGroupRoutes } from "@/modules/admin/server/cms-pages.repository";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";

export default async function DashboardLayoutPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const initialTextMap = await getCmsDraftTextMap();
  const cmsPages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic,
  );

  return (
    <DashboardShell
      userEmail={session.user.email}
      cmsPages={cmsPages}
      initialTextMap={initialTextMap}
      editorMode="layout"
    />
  );
}
