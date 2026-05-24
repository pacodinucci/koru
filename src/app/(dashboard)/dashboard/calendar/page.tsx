import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import {
  listAudienceUsers,
  listCalendarEventsForAdmin,
} from "@/modules/dashboard/server/calendar.repository";
import { DashboardCalendarView } from "@/modules/dashboard/views/dashboard-calendar-view";

type DashboardCalendarPageProps = {
  searchParams: Promise<{
    ok?: string;
    error?: string;
  }>;
};

export default async function DashboardCalendarPage({
  searchParams,
}: DashboardCalendarPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const sessionEmail =
    typeof session.user.email === "string" ? session.user.email.trim() : "";

  if (!sessionEmail) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { email: sessionEmail },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard?error=forbidden");
  }

  const { ok, error } = await searchParams;
  const [events, users, cmsPages] = await Promise.all([
    listCalendarEventsForAdmin(),
    listAudienceUsers(),
    discoverPagesGroupRoutes(),
  ]);

  return (
    <DashboardShell
      userEmail={sessionEmail}
      cmsPages={cmsPages.filter((page) => !page.isDynamic)}
      breadcrumbPage="Calendario"
      showPanelToggle
      panelDefaultOpen
    >
      <DashboardCalendarView events={events} users={users} ok={ok} error={error} />
    </DashboardShell>
  );
}
