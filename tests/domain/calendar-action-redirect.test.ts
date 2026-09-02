import assert from "node:assert/strict";
import test from "node:test";

import {
  getCalendarActionReturnTo,
  withCalendarActionResult,
} from "../../src/modules/calendar/lib/calendar-action-redirect";

test("acepta un retorno interno al calendario familiar", () => {
  const formData = new FormData();
  formData.set(
    "returnTo",
    "/family-dashboard/calendario?date=2026-09-01&view=week&event=event-1",
  );

  assert.equal(
    getCalendarActionReturnTo(formData),
    "/family-dashboard/calendario?date=2026-09-01&view=week&event=event-1",
  );
});

test("rechaza retornos externos", () => {
  const absolute = new FormData();
  absolute.set("returnTo", "https://example.com/steal");
  const protocolRelative = new FormData();
  protocolRelative.set("returnTo", "//example.com/steal");

  assert.equal(getCalendarActionReturnTo(absolute), undefined);
  assert.equal(getCalendarActionReturnTo(protocolRelative), undefined);
});

test("agrega el resultado sin perder el evento seleccionado", () => {
  assert.equal(
    withCalendarActionResult(
      "/family-dashboard/calendario?date=2026-09-01&view=week&event=event-1&error=old",
      "ok",
      "attendance_updated",
    ),
    "/family-dashboard/calendario?date=2026-09-01&view=week&event=event-1&ok=attendance_updated",
  );
});
