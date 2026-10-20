import assert from "node:assert/strict";
import test from "node:test";

import {
  CALENDAR_TIME_ZONES,
  DEFAULT_CALENDAR_TIME_ZONE,
  calendarDateValue,
  calendarTimeValue,
  calendarTimeZoneLabel,
  isCalendarTimeZone,
  parseCalendarLocalDateTime,
} from "../../src/modules/calendar/lib/calendar-time-zone";

test("Mexico City is the only calendar timezone", () => {
  assert.equal(DEFAULT_CALENDAR_TIME_ZONE, "America/Mexico_City");
  assert.deepEqual(CALENDAR_TIME_ZONES.map((zone) => zone.value), [DEFAULT_CALENDAR_TIME_ZONE]);
  assert.equal(isCalendarTimeZone(DEFAULT_CALENDAR_TIME_ZONE), true);
  assert.equal(isCalendarTimeZone("America/Argentina/Buenos_Aires"), false);
});

test("legacy timezone arguments cannot change Mexico wall time or labels", () => {
  for (const zone of ["America/Argentina/Buenos_Aires", "America/New_York", "Mars/Olympus"]) {
    const date = parseCalendarLocalDateTime("2026-10-05", "23:30", zone);
    assert.equal(date.toISOString(), "2026-10-06T05:30:00.000Z");
    assert.equal(calendarDateValue(date, zone), "2026-10-05");
    assert.equal(calendarTimeValue(date, zone), "23:30");
    assert.equal(calendarTimeZoneLabel(zone), "Ciudad de México (México)");
  }
});

test("Mexico dates round-trip without depending on the server timezone", () => {
  const date = parseCalendarLocalDateTime("2026-10-05", "23:30", DEFAULT_CALENDAR_TIME_ZONE);
  assert.equal(date.toISOString(), "2026-10-06T05:30:00.000Z");
  assert.equal(calendarDateValue(date, DEFAULT_CALENDAR_TIME_ZONE), "2026-10-05");
  assert.equal(calendarTimeValue(date, DEFAULT_CALENDAR_TIME_ZONE), "23:30");
});

test("malformed dates and times remain invalid regardless of a legacy zone", () => {
  for (const [date, time] of [
    ["2026-02-30", "12:30"], ["2026-13-01", "12:30"], ["2026-10-05", "24:00"],
    ["2026-10-05", "12:60"], ["2026-1-05", "12:30"], ["2026-10-05", "9:30"],
  ]) {
    assert.throws(() => parseCalendarLocalDateTime(date, time, "America/New_York"), /^Error: invalid_date$/);
  }
});

test("other countries' DST rules do not invalidate Mexico wall times", () => {
  assert.equal(parseCalendarLocalDateTime("2026-03-08", "02:30", "America/New_York").toISOString(), "2026-03-08T08:30:00.000Z");
  assert.equal(parseCalendarLocalDateTime("2026-11-01", "01:30", "America/New_York").toISOString(), "2026-11-01T07:30:00.000Z");
});
