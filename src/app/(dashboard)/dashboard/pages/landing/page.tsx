import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getCmsDraftTextMap } from "@/modules/cms/server/cms-text.repository";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";

export default async function DashboardLandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const initialTextMap = await getCmsDraftTextMap();

  return (
    <DashboardShell
      userEmail={session.user.email}
      initialTextMap={initialTextMap}
      editorMode="page"
    />
  );
}
