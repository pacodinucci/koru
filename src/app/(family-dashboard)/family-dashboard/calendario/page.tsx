import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { requireUser } from "@/modules/auth/server/auth-guards";
import { type CalendarViewMode } from "@/modules/dashboard/lib/calendar-range";
import {
  listUpcomingVisibleEventsForUser,
  listVisibleEventsForUserByRange,
} from "@/modules/dashboard/server/calendar.repository";
import { FamilyDashboardHeader } from "@/modules/family-dashboard/components/family-dashboard-header";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";
import {
  FamilyCalendarClientProvider,
  FamilyCalendarGridClient,
  FamilyCalendarSidePanelClient,
} from "@/modules/family-dashboard/views/family-calendar-client";

type FamilyCalendarPageProps = {
  searchParams: Promise<{
    date?: string;
    view?: string;
  }>;
};

function parseView(view?: string): CalendarViewMode {
  return view === "day" || view === "month" ? view : "week";
}

export default async function FamilyCalendarPage({
  searchParams,
}: FamilyCalendarPageProps) {
  const user = await requireUser();
  const { date, view } = await searchParams;
  const parsedDate = date ? new Date(`${date}T00:00:00`) : new Date();
  const dateCursor = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const viewMode = parseView(view);
  const [events, upcomingEvents] = await Promise.all([
    listVisibleEventsForUserByRange(user.id, user.role, dateCursor, viewMode),
    listUpcomingVisibleEventsForUser(user.id, user.role, 6),
  ]);

  return (
    <SidebarProvider>
      <FamilySidebar userName={user.name} userEmail={user.email} />
      <SidebarInset>
        <FamilyDashboardHeader title="Calendario" />
        <FamilyCalendarClientProvider
          initialEvents={events}
          initialUpcomingEvents={upcomingEvents}
          initialDateCursor={dateCursor}
          initialViewMode={viewMode}
        >
          <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 overflow-hidden rounded-xl border bg-white">
              <FamilyCalendarGridClient />
            </div>
            <aside className="rounded-xl border bg-white">
              <FamilyCalendarSidePanelClient />
            </aside>
          </main>
        </FamilyCalendarClientProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
