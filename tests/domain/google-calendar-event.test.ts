import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGoogleCalendarEventPayload,
  KORU_TIME_ZONE,
} from "../../src/modules/calendar/server/google-calendar/google-calendar-event";

test("mapea un evento horario de Koru a Google Calendar", () => {
  const payload = buildGoogleCalendarEventPayload(
    {
      id: "event-1",
      title: "Reunión de familias",
      description: "Encuentro mensual",
      startsAt: new Date("2026-09-10T21:00:00.000Z"),
      endsAt: new Date("2026-09-10T22:30:00.000Z"),
      allDay: false,
      location: "Koru",
    },
    "https://koru.example",
  );

  assert.equal(payload.summary, "Reunión de familias");
  assert.equal(payload.start.dateTime, "2026-09-10T21:00:00.000Z");
  assert.equal(payload.start.timeZone, KORU_TIME_ZONE);
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
      startsAt: new Date("2026-09-12T03:00:00.000Z"),
      endsAt: new Date("2026-09-12T23:00:00.000Z"),
      allDay: true,
      location: null,
    },
    "https://koru.example",
  );

  assert.equal(payload.start.date, "2026-09-12");
  assert.equal(payload.end.date, "2026-09-13");
  assert.equal(payload.start.dateTime, undefined);
});
