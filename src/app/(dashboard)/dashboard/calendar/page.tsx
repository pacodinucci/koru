import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import {
  listAudienceUsers,
  listCalendarEventsForAdminByRange,
  listUpcomingCalendarEventsForAdmin,
} from "@/modules/dashboard/server/calendar.repository";
import {
  DashboardCalendarGridClient,
  DashboardCalendarSidePanelClient,
  DashboardCalendarTopBarClient,
  DashboardCalendarClientProvider,
} from "@/modules/dashboard/views/dashboard-calendar-client";

type DashboardCalendarPageProps = {
  searchParams: Promise<{
    ok?: string;
    error?: string;
    date?: string;
    view?: string;
    edit?: string;
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

  const { ok, error, date, view, edit } = await searchParams;
  const parsedDate = date ? new Date(`${date}T00:00:00`) : new Date();
  const dateCursor = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const viewMode = view === "day" || view === "month" ? view : "week";
  const [events, upcomingEvents, users, cmsPages] = await Promise.all([
    listCalendarEventsForAdminByRange(dateCursor, viewMode),
    listUpcomingCalendarEventsForAdmin(6),
    listAudienceUsers(),
    discoverPagesGroupRoutes(),
  ]);

  return (
    <DashboardCalendarClientProvider
      initialEvents={events}
      initialDateCursor={dateCursor}
      initialViewMode={viewMode}
      initialSelectedEventId={edit}
      initialUpcomingEvents={upcomingEvents}
      users={users}
      ok={ok}
      error={error}
    >
      <DashboardShell
        userEmail={sessionEmail}
        cmsPages={cmsPages.filter((page) => !page.isDynamic)}
        breadcrumbPage="Calendario"
        showPanelToggle
        panelDefaultOpen
        contentNoPadding
        contentHeader={<DashboardCalendarTopBarClient />}
        sidePanelContent={<DashboardCalendarSidePanelClient />}
      >
        <DashboardCalendarGridClient />
      </DashboardShell>
    </DashboardCalendarClientProvider>
  );
}
