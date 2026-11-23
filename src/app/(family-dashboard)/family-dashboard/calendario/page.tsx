import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { GoogleCalendarConnectionCard } from "@/modules/calendar/components/google-calendar-connection-card";
import { getGoogleCalendarConnectionState } from "@/modules/calendar/server/google-calendar/google-calendar.repository";
import { serializeDate } from "@/modules/dashboard/lib/calendar-range";
import { parseCalendarNavigation } from "@/modules/calendar/lib/calendar-navigation";
import {
  listUpcomingVisibleEventsForUser,
  listVisibleEventsForUserByRange,
} from "@/modules/dashboard/server/calendar.repository";
import { FamilyDashboardHeader } from "@/modules/family-dashboard/components/family-dashboard-header";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";
import { requireFamilyDashboardAccess } from "@/modules/family-dashboard/server/family-dashboard-access";
import {
  FamilyCalendarClientProvider,
  FamilyCalendarGridClient,
  FamilyCalendarSidePanelClient,
} from "@/modules/family-dashboard/views/family-calendar-client";

type FamilyCalendarPageProps = {
  searchParams: Promise<{
    date?: string;
    view?: string;
    event?: string;
    ok?: string;
    error?: string;
  }>;
};

export default async function FamilyCalendarPage({
  searchParams,
}: FamilyCalendarPageProps) {
  const { viewer, familyUser } = await requireFamilyDashboardAccess();
  const { date, view, event, ok, error } = await searchParams;
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (view) params.set("view", view);
  const { dateCursor, viewMode } = parseCalendarNavigation(params, "event");
  const [events, upcomingEvents, googleConnection] = await Promise.all([
    listVisibleEventsForUserByRange(familyUser.id, familyUser.role, dateCursor, viewMode),
    listUpcomingVisibleEventsForUser(familyUser.id, familyUser.role, 6),
    getGoogleCalendarConnectionState(familyUser.id),
  ]);

  return (
    <SidebarProvider>
      <FamilySidebar userName={viewer.name} userEmail={viewer.email} />
      <SidebarInset>
        <FamilyDashboardHeader title="Calendario" />
        <FamilyCalendarClientProvider
          initialEvents={events}
          initialUpcomingEvents={upcomingEvents}
          initialDateCursor={serializeDate(dateCursor)}
          initialViewMode={viewMode}
          initialSelectedEventId={event}
          initialFeedback={{ ok, error }}
          viewer={{ name: viewer.name, email: viewer.email }}
        >
          <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 overflow-hidden rounded-xl border bg-white">
              <FamilyCalendarGridClient />
            </div>
            <aside className="rounded-xl border bg-white">
              <FamilyCalendarSidePanelClient />
              <div className="px-4 pb-4">
                <GoogleCalendarConnectionCard
                  connection={googleConnection}
                  compact
                />
              </div>
            </aside>
          </main>
        </FamilyCalendarClientProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
