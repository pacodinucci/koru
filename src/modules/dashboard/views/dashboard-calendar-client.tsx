"use client";

import { createContext, useContext, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { CalendarAudienceType, UserRole } from "@prisma/client";

import {
  type CalendarViewMode,
  getNextCursor,
  getRangeForView,
  serializeDate,
  toDateOnly,
} from "@/modules/dashboard/lib/calendar-range";
import {
  DashboardCalendarGrid,
  DashboardCalendarSidePanel,
  DashboardCalendarTopBar,
  DashboardCalendarUpcomingTable,
} from "@/modules/dashboard/views/dashboard-calendar-view";

type CalendarEventItem = {
  id: string;
  title: string;
  startsAt: string | Date;
  endsAt: string | Date;
  audienceType: CalendarAudienceType;
  status: string;
  kind: "EVENT" | "MEETING";
  audiences?: Array<{ userId: string }>;
};

type CalendarClientContextValue = {
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
  initialDateCursor,
  initialViewMode,
  initialSelectedEventId,
  initialUpcomingEvents,
  users,
  ok,
  error,
  children,
}: {
  initialEvents: CalendarEventItem[];
  initialDateCursor: Date;
  initialViewMode: CalendarViewMode;
  initialSelectedEventId?: string;
  initialUpcomingEvents: CalendarEventItem[];
  users: Array<{ id: string; name: string; role: UserRole }>;
  ok?: string;
  error?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dateCursor, setDateCursor] = useState(toDateOnly(initialDateCursor));
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialViewMode);
  const [selectedEventId, setSelectedEventId] = useState(initialSelectedEventId);
  const [isUpcomingListOpen, setIsUpcomingListOpen] = useState(false);
  const [events, setEvents] = useState(() => normalizeEvents(initialEvents));
  const [upcomingEvents] = useState(() => normalizeEvents(initialUpcomingEvents));
  const cacheRef = useRef<Map<string, ReturnType<typeof normalizeEvents>>>(new Map());

  const makeKey = (cursor: Date, view: CalendarViewMode) => {
    const { start, end } = getRangeForView(cursor, view);
    return `${view}:${start.toISOString()}:${end.toISOString()}`;
  };

  const syncUrl = (cursor: Date, view: CalendarViewMode, edit?: string) => {
    const params = new URLSearchParams();
    params.set("date", serializeDate(cursor));
    params.set("view", view);
    if (edit) params.set("edit", edit);
    startTransition(() => {
      router.replace(`/dashboard/calendar?${params.toString()}`, { scroll: false });
    });
  };

  const loadRange = async (cursor: Date, view: CalendarViewMode) => {
    const key = makeKey(cursor, view);
    const cached = cacheRef.current.get(key);
    if (cached) {
      setEvents(cached);
      return;
    }

    const params = new URLSearchParams();
    params.set("date", serializeDate(cursor));
    params.set("view", view);
    const response = await fetch(`/api/dashboard/calendar/events?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { events?: CalendarEventItem[] };
    const nextEvents = normalizeEvents(payload.events ?? []);
    cacheRef.current.set(key, nextEvents);
    setEvents(nextEvents);
  };

  const navigate = (cursor: Date, nextViewMode: CalendarViewMode) => {
    const normalizedCursor = toDateOnly(cursor);
    setDateCursor(normalizedCursor);
    setViewMode(nextViewMode);
    setSelectedEventId(undefined);
    syncUrl(normalizedCursor, nextViewMode);
    void loadRange(normalizedCursor, nextViewMode);
  };

  const selectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    syncUrl(dateCursor, viewMode, eventId);
  };

  const toggleUpcomingList = () => {
    setIsUpcomingListOpen((prev) => !prev);
  };

  return (
    <CalendarClientContext.Provider
      value={{
        events,
        upcomingEvents,
        users,
        ok,
        error,
        dateCursor,
        viewMode,
        selectedEventId,
        isUpcomingListOpen,
        navigate,
        selectEvent,
        toggleUpcomingList,
      }}
    >
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
  const { users, ok, error, events, dateCursor, viewMode, selectedEventId } = useCalendarClient();
  return <DashboardCalendarTopBar users={users} ok={ok} error={error} events={events} dateCursor={dateCursor} viewMode={viewMode} selectedEventId={selectedEventId} />;
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
    return <DashboardCalendarUpcomingTable events={upcomingEvents} onSelectEvent={selectEvent} />;
  }

  return (
    <DashboardCalendarGrid
      events={events}
      dateCursor={dateCursor}
      viewMode={viewMode}
      selectedEventId={selectedEventId}
      onChangeView={(nextView) => navigate(dateCursor, nextView)}
      onMoveCursor={(direction) => navigate(getNextCursor(dateCursor, viewMode, direction), viewMode)}
      onGoToday={() => navigate(new Date(), viewMode)}
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
