"use client";

import { filterCalendarEventsByAreas, type CalendarEventAreaFields, type CalendarAreaFormOptions } from "@/modules/calendar/lib/calendar-area-types";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useCalendarRange } from "@/modules/calendar/lib/calendar-range-loader";
import type {
  CalendarAudienceType,
  CalendarEventVisibility,
  CalendarRegistrationAccess,
  UserRole,
} from "@prisma/client";

import {
  type CalendarViewMode,
  calendarTodayCursor,
  getNextCursor,
} from "@/modules/dashboard/lib/calendar-range";
import {
  DashboardCalendarGrid,
  DashboardCalendarSidePanel,
  DashboardCalendarTopBar,
  DashboardCalendarUpcomingTable,
} from "@/modules/dashboard/views/dashboard-calendar-view";

type CalendarEventItem = CalendarEventAreaFields & {
  id: string;
  title: string;
  startsAt: string | Date;
  endsAt: string | Date;
  timeZone: string;
  location?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  visibility: CalendarEventVisibility;
  audienceType: CalendarAudienceType;
  status: string;
  kind: "EVENT" | "MEETING";
  registrationsEnabled: boolean;
  attendanceConfirmationEnabled: boolean;
  attendances?: Array<{
    id: string;
    userId?: string | null;
    name: string;
    email: string;
    status: "PENDING" | "CONFIRMED" | "DECLINED";
    invitationSentAt?: Date | string | null;
    invitationError?: string | null;
    respondedAt?: Date | string | null;
  }>;
  registrationAccess: CalendarRegistrationAccess;
  audiences?: Array<{ userId: string }>;
};

type CalendarClientContextValue = CalendarAreaFormOptions & {
  selectedAreaIds: string[];
  toggleArea: (id: string) => void;
  events: Array<CalendarEventItem & { startsAt: Date; endsAt: Date }>;
  upcomingEvents: Array<CalendarEventItem & { startsAt: Date; endsAt: Date }>;
  users: Array<{ id: string; name: string; role: UserRole }>;
  ok?: string;
  error?: string;
  dateCursor: Date;
  viewMode: CalendarViewMode;
  selectedEventId?: string;
  isUpcomingListOpen: boolean;
  navigate: (cursor: Date, viewMode: CalendarViewMode) => void;
  selectEvent: (eventId: string) => void;
  clearSelectedEvent: () => void;
  toggleUpcomingList: () => void;
};

const CalendarClientContext = createContext<CalendarClientContextValue | null>(null);

function normalizeEvents(events: CalendarEventItem[]) {
  return events.map((event) => ({
    ...event,
    startsAt: new Date(event.startsAt),
    endsAt: new Date(event.endsAt),
  }));
}

export function DashboardCalendarClientProvider({
  initialEvents,
  areas = [], editableAreaIds = [], canManageCalendar = false, currentUserId,
  initialDateCursor,
  initialViewMode,
  initialSelectedEventId,
  initialUpcomingEvents,
  users,
  ok,
  error,
  children,
}: CalendarAreaFormOptions & {
  initialEvents: CalendarEventItem[];
  initialDateCursor: Date | string;
  initialViewMode: CalendarViewMode;
  initialSelectedEventId?: string;
  initialUpcomingEvents: CalendarEventItem[];
  users: Array<{ id: string; name: string; role: UserRole }>;
  ok?: string;
  error?: string;
  children: ReactNode;
}) {
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const filtered = (items: ReturnType<typeof normalizeEvents>) => filterCalendarEventsByAreas(items, selectedAreaIds);
  const [isUpcomingListOpen, setIsUpcomingListOpen] = useState(false);
  const {
    dateCursor, viewMode, selectedEventId, events, upcomingEvents,
    navigate, selectEvent, clearSelectedEvent, rangeError, isLoading, retryRange,
  } = useCalendarRange({
    initialEvents, initialUpcomingEvents, initialDateCursor, initialViewMode, initialSelectedEventId,
    endpoint: "/api/dashboard/calendar/events", selectionKey: "edit", normalizeEvents,
  });

  const toggleUpcomingList = () => {
    setIsUpcomingListOpen((prev) => !prev);
  };

  return (
    <CalendarClientContext.Provider
      value={{
        events: filtered(events),
        upcomingEvents: filtered(upcomingEvents),
        areas, editableAreaIds, canManageCalendar, currentUserId,
        selectedAreaIds,
        toggleArea: id => setSelectedAreaIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]),
        users,
        ok,
        error,
        dateCursor,
        viewMode,
        selectedEventId,
        isUpcomingListOpen,
        navigate,
        selectEvent,
        clearSelectedEvent,
        toggleUpcomingList,
      }}
    >
      {isLoading && <p role="status" className="px-4 py-2 text-sm">Cargando eventos…</p>}
      {rangeError && <div role="alert" className="px-4 py-2 text-sm">No se pudieron cargar los eventos. <button type="button" onClick={retryRange}>Reintentar</button></div>}
      {children}
    </CalendarClientContext.Provider>
  );
}

function useCalendarClient() {
  const context = useContext(CalendarClientContext);
  if (!context) throw new Error("DashboardCalendarClientProvider missing");
  return context;
}

export function DashboardCalendarTopBarClient() {
  const { users, ok, error, events, upcomingEvents, dateCursor, viewMode, selectedEventId, clearSelectedEvent, areas, editableAreaIds, canManageCalendar, currentUserId, selectedAreaIds, toggleArea } = useCalendarClient();
  const selectableEvents = [
    ...events,
    ...upcomingEvents.filter((upcomingEvent) => !events.some((event) => event.id === upcomingEvent.id)),
  ];

  return <div><div className="flex flex-wrap items-center gap-2 border-b px-4 py-2"><span className="text-xs text-slate-500">Filtrar por área · sin selección: todos los eventos autorizados</span>{areas?.map(area => <button key={area.id} type="button" aria-pressed={selectedAreaIds.includes(area.id)} onClick={() => toggleArea(area.id)} className={`rounded-full border px-3 py-1 text-xs ${selectedAreaIds.includes(area.id) ? "bg-slate-100 font-semibold" : ""}`} style={{ borderColor: area.color }}>{area.name}</button>)}</div><DashboardCalendarTopBar areas={areas} editableAreaIds={editableAreaIds} canManageCalendar={canManageCalendar} currentUserId={currentUserId} users={users} ok={ok} error={error} events={selectableEvents} dateCursor={dateCursor} viewMode={viewMode} selectedEventId={selectedEventId} onCloseSelectedEvent={clearSelectedEvent} /></div>;
}

export function DashboardCalendarGridClient() {
  const {
    events,
    upcomingEvents,
    dateCursor,
    viewMode,
    selectedEventId,
    isUpcomingListOpen,
    navigate,
    selectEvent,
  } = useCalendarClient();

  if (isUpcomingListOpen) {
    return <DashboardCalendarUpcomingTable events={upcomingEvents} />;
  }

  return (
    <DashboardCalendarGrid
      events={events}
      dateCursor={dateCursor}
      viewMode={viewMode}
      selectedEventId={selectedEventId}
      onChangeView={(nextView) => navigate(dateCursor, nextView)}
      onMoveCursor={(direction) => navigate(getNextCursor(dateCursor, viewMode, direction), viewMode)}
      onGoToday={() => navigate(calendarTodayCursor(), viewMode)}
      onSelectEvent={selectEvent}
    />
  );
}

export function DashboardCalendarSidePanelClient() {
  const { upcomingEvents, dateCursor, viewMode, isUpcomingListOpen, navigate, selectEvent, toggleUpcomingList } = useCalendarClient();
  return (
    <DashboardCalendarSidePanel
      events={upcomingEvents}
      dateCursor={dateCursor}
      viewMode={viewMode}
      onSelectEvent={selectEvent}
      onMoveMiniMonth={(direction) => navigate(getNextCursor(dateCursor, "month", direction), "month")}
      onToggleUpcomingList={toggleUpcomingList}
      isUpcomingListOpen={isUpcomingListOpen}
    />
  );
}


