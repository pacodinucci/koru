"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useCalendarRange } from "@/modules/calendar/lib/calendar-range-loader";
import { calendarNavigationUrl } from "@/modules/calendar/lib/calendar-navigation";

import {
  type CalendarViewMode,
  getNextCursor,
  calendarTodayCursor,
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
  initialDateCursor: Date | string;
  initialViewMode: CalendarViewMode;
  initialSelectedEventId?: string;
  initialFeedback?: { ok?: string; error?: string };
  viewer: { name: string; email: string };
  children: ReactNode;
}) {
  const {
    dateCursor, viewMode, selectedEventId, events, upcomingEvents,
    navigate: navigateRange, selectEvent: selectRangeEvent, clearSelectedEvent,
    rangeError, isLoading, retryRange,
  } = useCalendarRange({
    initialEvents, initialUpcomingEvents, initialDateCursor, initialViewMode, initialSelectedEventId,
    endpoint: "/api/family-dashboard/calendar/events", selectionKey: "event", normalizeEvents,
  });
  const [dismissedFeedback, setDismissedFeedback] = useState<{
    events: FamilyCalendarEventItem[];
    eventId?: string;
    ok?: string;
    error?: string;
  } | null>(null);
  const [isUpcomingListOpen, setIsUpcomingListOpen] = useState(false);

  // Dismiss only this server snapshot; a refresh makes new feedback visible
  // without synchronizing redundant state in a post-render effect.
  const feedbackDismissed = dismissedFeedback?.events === initialEvents
    && dismissedFeedback.eventId === initialSelectedEventId
    && dismissedFeedback.ok === initialFeedback?.ok
    && dismissedFeedback.error === initialFeedback?.error;
  const dismissFeedback = () => setDismissedFeedback({
    events: initialEvents, eventId: initialSelectedEventId,
    ok: initialFeedback?.ok, error: initialFeedback?.error,
  });

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return undefined;
    return (
      events.find((event) => event.id === selectedEventId) ??
      upcomingEvents.find((event) => event.id === selectedEventId)
    );
  }, [events, selectedEventId, upcomingEvents]);

  const navigate = (cursor: Date, nextViewMode: CalendarViewMode) => {
    dismissFeedback();
    navigateRange(cursor, nextViewMode);
  };

  const selectEvent = (eventId: string) => {
    dismissFeedback();
    selectRangeEvent(eventId);
  };

  const closeSelectedEvent = () => {
    dismissFeedback();
    clearSelectedEvent();
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
      {isLoading && <p role="status" className="px-4 py-2 text-sm">Cargando eventos…</p>}
      {rangeError && <div role="alert" className="px-4 py-2 text-sm">No se pudieron cargar los eventos. <button type="button" onClick={retryRange}>Reintentar</button></div>}
      {children}
      <FamilyEventDetailDialog
        event={selectedEvent}
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => {
          if (!open) closeSelectedEvent();
        }}
        returnTo={calendarNavigationUrl("/family-dashboard/calendario", dateCursor, viewMode, "event", selectedEventId)}
        viewer={viewer}
        feedback={
          !feedbackDismissed && initialSelectedEventId === selectedEventId ? initialFeedback : undefined
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
      onGoToday={() => navigate(calendarTodayCursor(), viewMode)}
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
