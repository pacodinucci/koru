import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_CALENDAR_TIME_ZONE,
  calendarDateValue,
  calendarTimeValue,
  parseCalendarLocalDateTime,
} from "../../src/modules/calendar/lib/calendar-time-zone";

test("usa Ciudad de México como zona inicial del calendario", () => {
  assert.equal(DEFAULT_CALENDAR_TIME_ZONE, "America/Mexico_City");
});

test("interpreta la hora de Buenos Aires sin depender de la zona del servidor", () => {
  const date = parseCalendarLocalDateTime("2026-10-05", "12:30", "America/Argentina/Buenos_Aires");
  assert.equal(date.toISOString(), "2026-10-05T15:30:00.000Z");
  assert.equal(calendarDateValue(date, "America/Argentina/Buenos_Aires"), "2026-10-05");
  assert.equal(calendarTimeValue(date, "America/Argentina/Buenos_Aires"), "12:30");
});

test("interpreta la hora de México y conserva la fecha local al editar", () => {
  const date = parseCalendarLocalDateTime("2026-10-05", "23:30", "America/Mexico_City");
  assert.equal(date.toISOString(), "2026-10-06T05:30:00.000Z");
  assert.equal(calendarDateValue(date, "America/Mexico_City"), "2026-10-05");
  assert.equal(calendarTimeValue(date, "America/Mexico_City"), "23:30");
});

test("rechaza fechas inexistentes y zonas no permitidas", () => {
  assert.throws(() => parseCalendarLocalDateTime("2026-02-30", "12:30", "America/Argentina/Buenos_Aires"), /invalid_date/);
  assert.throws(() => parseCalendarLocalDateTime("2026-10-05", "12:30", "Mars/Olympus"), /invalid_time_zone/);
});

test("rechaza horas inexistentes o ambiguas por horario de verano", () => {
  assert.throws(() => parseCalendarLocalDateTime("2026-03-08", "02:30", "America/New_York"), /invalid_date/);
  assert.throws(() => parseCalendarLocalDateTime("2026-11-01", "01:30", "America/New_York"), /ambiguous_date/);
});
