"use client";

import { useEffect, useRef, useState } from "react";
import { getRangeForView, serializeDate, type CalendarViewMode } from "@/modules/dashboard/lib/calendar-range";
import { calendarNavigationUrl, parseCalendarCursor, parseCalendarNavigation } from "@/modules/calendar/lib/calendar-navigation";

type Navigation = {
  dateCursor: Date;
  viewMode: CalendarViewMode;
  selectedEventId?: string;
};

function rangeKey(cursor: Date, view: CalendarViewMode) {
  const { start, end } = getRangeForView(cursor, view);
  return `${view}:${start.toISOString()}:${end.toISOString()}`;
}

export function useCalendarRange<Raw, Event>({
  initialEvents, initialUpcomingEvents, initialDateCursor, initialViewMode,
  initialSelectedEventId, endpoint, selectionKey, normalizeEvents,
}: {
  initialEvents: Raw[];
  initialUpcomingEvents: Raw[];
  initialDateCursor: string | Date;
  initialViewMode: CalendarViewMode;
  initialSelectedEventId?: string;
  endpoint: string;
  selectionKey: "edit" | "event";
  normalizeEvents: (events: Raw[]) => Event[];
}) {
  const initialNavigation = {
    dateCursor: parseCalendarCursor(initialDateCursor),
    viewMode: initialViewMode,
    selectedEventId: initialSelectedEventId,
  };
  const [navigation, setNavigation] = useState<Navigation>(initialNavigation);
  const [events, setEvents] = useState(() => normalizeEvents(initialEvents));
  const [upcomingEvents, setUpcomingEvents] = useState(() => normalizeEvents(initialUpcomingEvents));
  const [rangeError, setRangeError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const cache = useRef(new Map([[rangeKey(initialNavigation.dateCursor, initialViewMode), events]]));
  const pending = useRef(new Map<string, Promise<Event[]>>());
  const requestId = useRef(0);
  const generation = useRef(0);
  const serverSnapshot = useRef({ initialEvents, initialUpcomingEvents, initialDateCursor, initialViewMode, initialSelectedEventId });

  async function loadRange(cursor: Date, view: CalendarViewMode) {
    const id = ++requestId.current;
    const epoch = generation.current;
    const key = rangeKey(cursor, view);
    setRangeError(false);
    const cached = cache.current.get(key);
    if (cached) {
      setEvents(cached);
      setIsLoading(false);
      return;
    }
    // Never render events belonging to another date under the new range heading.
    setEvents([]);
    setIsLoading(true);
    try {
      let work = pending.current.get(key);
      if (!work) {
        const params = new URLSearchParams({ date: serializeDate(cursor), view });
        work = (async () => {
          const response = await fetch(`${endpoint}?${params}`, { method: "GET", cache: "no-store" });
          if (!response.ok) throw new Error("calendar_range_failed");
          const payload = await response.json() as { events?: Raw[] };
          if (!Array.isArray(payload.events)) throw new Error("calendar_range_invalid");
          const result = normalizeEvents(payload.events);
          if (epoch === generation.current) cache.current.set(key, result);
          return result;
        })();
        pending.current.set(key, work);
      }
      try {
        const result = await work;
        if (id === requestId.current && epoch === generation.current) setEvents(result);
      } finally {
        if (pending.current.get(key) === work) pending.current.delete(key);
      }
    } catch {
      if (id === requestId.current && epoch === generation.current) setRangeError(true);
    } finally {
      if (id === requestId.current && epoch === generation.current) setIsLoading(false);
    }
  }

  // A server action/refresh is authoritative, even when this provider stays mounted.
  // Invalidate both visited ranges and in-flight pre-mutation requests.
  useEffect(() => {
    const previous = serverSnapshot.current;
    if (previous.initialEvents === initialEvents && previous.initialUpcomingEvents === initialUpcomingEvents
      && previous.initialDateCursor === initialDateCursor && previous.initialViewMode === initialViewMode
      && previous.initialSelectedEventId === initialSelectedEventId) return;
    serverSnapshot.current = { initialEvents, initialUpcomingEvents, initialDateCursor, initialViewMode, initialSelectedEventId };
    generation.current++;
    requestId.current++;
    pending.current.clear();
    const fresh = normalizeEvents(initialEvents);
    const cursor = parseCalendarCursor(initialDateCursor);
    cache.current = new Map([[rangeKey(cursor, initialViewMode), fresh]]);
    setEvents(fresh);
    setUpcomingEvents(normalizeEvents(initialUpcomingEvents));
    setNavigation({ dateCursor: cursor, viewMode: initialViewMode, selectedEventId: initialSelectedEventId });
    setRangeError(false);
    setIsLoading(false);
  }, [initialEvents, initialUpcomingEvents, initialDateCursor, initialViewMode, initialSelectedEventId, normalizeEvents]);

  useEffect(() => {
    const onPopState = () => {
      const next = parseCalendarNavigation(new URLSearchParams(window.location.search), selectionKey);
      setNavigation(next);
      void loadRange(next.dateCursor, next.viewMode);
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      generation.current++;
      requestId.current++;
      pending.current.clear();
    };
    // Endpoints, selection keys and normalizers are fixed for each provider lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function syncUrl(next: Navigation, replace = false) {
    const url = calendarNavigationUrl(window.location.href, next.dateCursor, next.viewMode, selectionKey, next.selectedEventId);
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` === url) return;
    // Pass null, not history.state: Next skips canonical URL updates for its own
    // __NA/_N states. Its wrapper copies the internal tree into this new entry.
    window.history[replace ? "replaceState" : "pushState"](null, "", url);
  }

  function navigate(cursor: Date, viewMode: CalendarViewMode) {
    const next = { dateCursor: parseCalendarCursor(cursor), viewMode, selectedEventId: undefined };
    setNavigation(next);
    syncUrl(next);
    void loadRange(next.dateCursor, viewMode);
  }

  function selectEvent(selectedEventId?: string) {
    const next = { ...navigation, selectedEventId };
    setNavigation(next);
    syncUrl(next, !selectedEventId);
  }

  return {
    ...navigation, events, upcomingEvents, rangeError, isLoading, navigate, selectEvent,
    clearSelectedEvent: () => selectEvent(undefined),
    retryRange: () => { void loadRange(navigation.dateCursor, navigation.viewMode); },
  };
}
