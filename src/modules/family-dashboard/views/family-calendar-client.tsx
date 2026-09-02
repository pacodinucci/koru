"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

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
import { FamilyEventDetailDialog } from "@/modules/family-dashboard/components/family-event-detail-dialog";
import type {
  FamilyCalendarEventItem,
  NormalizedFamilyCalendarEvent,
} from "@/modules/family-dashboard/lib/family-calendar-event";

type FamilyCalendarContextValue = {
  events: NormalizedFamilyCalendarEvent[];
  upcomingEvents: NormalizedFamilyCalendarEvent[];
  dateCursor: Date;
  viewMode: CalendarViewMode;
  selectedEventId?: string;
  isUpcomingListOpen: boolean;
  navigate: (cursor: Date, viewMode: CalendarViewMode) => void;
  selectEvent: (eventId: string) => void;
  toggleUpcomingList: () => void;
};

const FamilyCalendarContext = createContext<FamilyCalendarContextValue | null>(
  null,
);

function normalizeEvents(events: FamilyCalendarEventItem[]) {
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
  initialSelectedEventId,
  initialFeedback,
  viewer,
  children,
}: {
  initialEvents: FamilyCalendarEventItem[];
  initialUpcomingEvents: FamilyCalendarEventItem[];
  initialDateCursor: Date;
  initialViewMode: CalendarViewMode;
  initialSelectedEventId?: string;
  initialFeedback?: { ok?: string; error?: string };
  viewer: { name: string; email: string };
  children: ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dateCursor, setDateCursor] = useState(toDateOnly(initialDateCursor));
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialViewMode);
  const [selectedEventId, setSelectedEventId] = useState(
    initialSelectedEventId,
  );
  const [feedbackEventId, setFeedbackEventId] = useState(
    initialSelectedEventId,
  );
  const [isUpcomingListOpen, setIsUpcomingListOpen] = useState(false);
  const [events, setEvents] = useState(() => normalizeEvents(initialEvents));
  const [upcomingEvents] = useState(() =>
    normalizeEvents(initialUpcomingEvents),
  );
  const cacheRef = useRef<Map<string, ReturnType<typeof normalizeEvents>>>(
    new Map(),
  );

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return undefined;
    return (
      events.find((event) => event.id === selectedEventId) ??
      upcomingEvents.find((event) => event.id === selectedEventId)
    );
  }, [events, selectedEventId, upcomingEvents]);

  const makeKey = (cursor: Date, view: CalendarViewMode) => {
    const { start, end } = getRangeForView(cursor, view);
    return `${view}:${start.toISOString()}:${end.toISOString()}`;
  };

  const makeUrl = (
    cursor: Date,
    view: CalendarViewMode,
    eventId?: string,
  ) => {
    const params = new URLSearchParams();
    params.set("date", serializeDate(cursor));
    params.set("view", view);
    if (eventId) params.set("event", eventId);
    return `/family-dashboard/calendario?${params.toString()}`;
  };

  const syncUrl = (cursor: Date, view: CalendarViewMode) => {
    startTransition(() => {
      router.replace(makeUrl(cursor, view), { scroll: false });
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
    const response = await fetch(
      `/api/family-dashboard/calendar/events?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );
    if (!response.ok) return;
    const payload = (await response.json()) as {
      events?: FamilyCalendarEventItem[];
    };
    const nextEvents = normalizeEvents(payload.events ?? []);
    cacheRef.current.set(key, nextEvents);
    setEvents(nextEvents);
  };

  const navigate = (cursor: Date, nextViewMode: CalendarViewMode) => {
    const normalizedCursor = toDateOnly(cursor);
    setDateCursor(normalizedCursor);
    setViewMode(nextViewMode);
    setSelectedEventId(undefined);
    setFeedbackEventId(undefined);
    syncUrl(normalizedCursor, nextViewMode);
    void loadRange(normalizedCursor, nextViewMode);
  };

  const selectEvent = (eventId: string) => {
    setFeedbackEventId(undefined);
    setSelectedEventId(eventId);
  };

  const closeSelectedEvent = () => {
    setSelectedEventId(undefined);
    setFeedbackEventId(undefined);
    syncUrl(dateCursor, viewMode);
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
      <FamilyEventDetailDialog
        event={selectedEvent}
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => {
          if (!open) closeSelectedEvent();
        }}
        returnTo={makeUrl(dateCursor, viewMode, selectedEventId)}
        viewer={viewer}
        feedback={
          feedbackEventId === selectedEventId ? initialFeedback : undefined
        }
      />
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
    return (
      <DashboardCalendarUpcomingTable
        events={upcomingEvents}
        onSelectEvent={selectEvent}
      />
    );
  }

  return (
    <DashboardCalendarGrid
      events={events}
      dateCursor={dateCursor}
      viewMode={viewMode}
      selectedEventId={selectedEventId}
      onChangeView={(nextView) => navigate(dateCursor, nextView)}
      onMoveCursor={(direction) =>
        navigate(getNextCursor(dateCursor, viewMode, direction), viewMode)
      }
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
      onMoveMiniMonth={(direction) =>
        navigate(getNextCursor(dateCursor, "month", direction), "month")
      }
      onToggleUpcomingList={toggleUpcomingList}
      isUpcomingListOpen={isUpcomingListOpen}
    />
  );
}
