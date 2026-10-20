import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGoogleCalendarEventPayload,
} from "../../src/modules/calendar/server/google-calendar/google-calendar-event";
import { DEFAULT_CALENDAR_TIME_ZONE } from "../../src/modules/calendar/lib/calendar-time-zone";

test("mapea un evento horario de Koru a Google Calendar", () => {
  const payload = buildGoogleCalendarEventPayload(
    {
      id: "event-1",
      title: "Reunión de familias",
      description: "Encuentro mensual",
      startsAt: new Date("2026-09-10T21:00:00.000Z"),
      endsAt: new Date("2026-09-10T22:30:00.000Z"),
      timeZone: DEFAULT_CALENDAR_TIME_ZONE,
      allDay: false,
      location: "Koru",
    },
    "https://koru.example",
  );

  assert.equal(payload.summary, "Reunión de familias");
  assert.equal(payload.start.dateTime, "2026-09-10T21:00:00.000Z");
  assert.equal(payload.start.timeZone, DEFAULT_CALENDAR_TIME_ZONE);
  assert.equal(payload.location, "Koru");
  assert.match(payload.description, /calendario\/eventos\/event-1/);
  assert.equal(payload.extendedProperties.private.koruEventId, "event-1");
});

test("los eventos de día completo usan fin exclusivo", () => {
  const payload = buildGoogleCalendarEventPayload(
    {
      id: "event-2",
      title: "Jornada Koru",
      description: null,
      startsAt: new Date("2026-09-12T06:00:00.000Z"),
      endsAt: new Date("2026-09-12T23:00:00.000Z"),
      timeZone: DEFAULT_CALENDAR_TIME_ZONE,
      allDay: true,
      location: null,
    },
    "https://koru.example",
  );

  assert.equal(payload.start.date, "2026-09-12");
  assert.equal(payload.end.date, "2026-09-13");
  assert.equal(payload.start.dateTime, undefined);
});

test("Google Calendar uses Mexico for legacy events without changing their instants", () => {
  const payload = buildGoogleCalendarEventPayload(
    {
      id: "event-3",
      title: "Encuentro en México",
      description: null,
      startsAt: new Date("2026-10-05T18:30:00.000Z"),
      endsAt: new Date("2026-10-05T19:30:00.000Z"),
      timeZone: "America/Argentina/Buenos_Aires",
      allDay: false,
      location: null,
    },
    "https://koru.example",
  );

  assert.equal(payload.start.dateTime, "2026-10-05T18:30:00.000Z");
  assert.equal(payload.start.timeZone, DEFAULT_CALENDAR_TIME_ZONE);
  assert.equal(payload.end.dateTime, "2026-10-05T19:30:00.000Z");
  assert.equal(payload.end.timeZone, DEFAULT_CALENDAR_TIME_ZONE);
});

test("all-day legacy events use Mexico dates and an exclusive end", () => {
  const payload = buildGoogleCalendarEventPayload({
    id: "legacy-all-day", title: "Jornada", description: null,
    startsAt: new Date("2026-10-06T04:00:00.000Z"),
    endsAt: new Date("2026-10-06T05:00:00.000Z"),
    timeZone: "Europe/Madrid", allDay: true, location: null,
  }, "https://koru.example");
  assert.deepEqual(payload.start, { date: "2026-10-05" });
  assert.deepEqual(payload.end, { date: "2026-10-06" });
});
