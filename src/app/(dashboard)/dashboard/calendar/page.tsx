import { listCalendarAreaOptions, getCalendarAreaGrants } from "@/modules/calendar/server/calendar-areas.repository";
import { requirePermission } from "@/modules/auth/server/auth-guards";
import { calendarTodayCursor, serializeDate } from "@/modules/dashboard/lib/calendar-range";
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
  const user = await requirePermission("calendar.view");

  const { ok, error, date, view, edit } = await searchParams;
  const parsedDate = date ? new Date(`${date}T12:00:00`) : calendarTodayCursor();
  const dateCursor = Number.isNaN(parsedDate.getTime()) ? calendarTodayCursor() : parsedDate;
  const viewMode = view === "day" || view === "month" ? view : "week";
  const [events, upcomingEvents, cmsPages, areas, grants] = await Promise.all([
    listCalendarEventsForAdminByRange(dateCursor, viewMode),
    listUpcomingCalendarEventsForAdmin(6),
    discoverPagesGroupRoutes(),
    listCalendarAreaOptions(),
    getCalendarAreaGrants(user.id),
  ]);
  const users = user.permissionKeys.includes("calendar.manage") || grants.some(grant => grant.canEdit)
    ? await listAudienceUsers()
    : [];

  return (
    <DashboardCalendarClientProvider
      key={dateCursor.toISOString() + "-" + viewMode + "-" + (ok ?? "") + "-" + (error ?? "")}
      areas={areas}
      editableAreaIds={grants.filter(grant => grant.canEdit).map(grant => grant.areaId)}
      canManageCalendar={user.permissionKeys.includes("calendar.manage")}
      currentUserId={user.id}
      initialEvents={events}
      initialDateCursor={serializeDate(dateCursor)}
      initialViewMode={viewMode}
      initialSelectedEventId={edit}
      initialUpcomingEvents={upcomingEvents}
      users={users}
      ok={ok}
      error={error}
    >
      <DashboardShell
        userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
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
