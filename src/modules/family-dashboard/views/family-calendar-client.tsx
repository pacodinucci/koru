"use client";

import { createContext, useContext, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type {
  CalendarAudienceType,
  CalendarEventVisibility,
} from "@prisma/client";

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
  DashboardCalendarUpcomingTable,
} from "@/modules/dashboard/views/dashboard-calendar-view";

type CalendarEventItem = {
  id: string;
  title: string;
  startsAt: string | Date;
  endsAt: string | Date;
  location?: string | null;
  visibility: CalendarEventVisibility;
  audienceType: CalendarAudienceType;
  status: string;
  kind: "EVENT" | "MEETING";
  audiences?: Array<{ userId: string }>;
};

type FamilyCalendarContextValue = {
  events: Array<CalendarEventItem & { startsAt: Date; endsAt: Date }>;
  upcomingEvents: Array<CalendarEventItem & { startsAt: Date; endsAt: Date }>;
  dateCursor: Date;
  viewMode: CalendarViewMode;
  selectedEventId?: string;
  isUpcomingListOpen: boolean;
  navigate: (cursor: Date, viewMode: CalendarViewMode) => void;
  selectEvent: (eventId: string) => void;
  toggleUpcomingList: () => void;
};

const FamilyCalendarContext = createContext<FamilyCalendarContextValue | null>(null);

function normalizeEvents(events: CalendarEventItem[]) {
  return events.map((event) => ({
    ...event,
    startsAt: new Date(event.startsAt),
    endsAt: new Date(event.endsAt),
  }));
}

export function FamilyCalendarClientProvider({
  initialEvents,
  initialUpcomingEvents,
  initialDateCursor,
  initialViewMode,
  children,
}: {
  initialEvents: CalendarEventItem[];
  initialUpcomingEvents: CalendarEventItem[];
  initialDateCursor: Date;
  initialViewMode: CalendarViewMode;
  children: ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dateCursor, setDateCursor] = useState(toDateOnly(initialDateCursor));
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialViewMode);
  const [selectedEventId, setSelectedEventId] = useState<string>();
  const [isUpcomingListOpen, setIsUpcomingListOpen] = useState(false);
  const [events, setEvents] = useState(() => normalizeEvents(initialEvents));
  const [upcomingEvents] = useState(() => normalizeEvents(initialUpcomingEvents));
  const cacheRef = useRef<Map<string, ReturnType<typeof normalizeEvents>>>(new Map());

  const makeKey = (cursor: Date, view: CalendarViewMode) => {
    const { start, end } = getRangeForView(cursor, view);
    return `${view}:${start.toISOString()}:${end.toISOString()}`;
  };

  const syncUrl = (cursor: Date, view: CalendarViewMode) => {
    const params = new URLSearchParams();
    params.set("date", serializeDate(cursor));
    params.set("view", view);
    startTransition(() => {
      router.replace(`/family-dashboard/calendario?${params.toString()}`, {
        scroll: false,
      });
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
    const response = await fetch(`/api/family-dashboard/calendar/events?${params.toString()}`, {
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
  };

  const toggleUpcomingList = () => {
    setIsUpcomingListOpen((prev) => !prev);
  };

  return (
    <FamilyCalendarContext.Provider
      value={{
        events,
        upcomingEvents,
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
    </FamilyCalendarContext.Provider>
  );
}

function useFamilyCalendar() {
  const context = useContext(FamilyCalendarContext);
  if (!context) throw new Error("FamilyCalendarClientProvider missing");
  return context;
}

export function FamilyCalendarGridClient() {
  const {
    events,
    upcomingEvents,
    dateCursor,
    viewMode,
    selectedEventId,
    isUpcomingListOpen,
    navigate,
    selectEvent,
  } = useFamilyCalendar();

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

export function FamilyCalendarSidePanelClient() {
  const {
    upcomingEvents,
    dateCursor,
    viewMode,
    isUpcomingListOpen,
    navigate,
    selectEvent,
    toggleUpcomingList,
  } = useFamilyCalendar();

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
