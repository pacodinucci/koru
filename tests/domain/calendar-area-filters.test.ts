import assert from "node:assert/strict";
import test from "node:test";
import { filterCalendarEventsByAreas } from "../../src/modules/calendar/lib/calendar-area-types";

const shared = { id: "shared", areaLinks: [{ areaId: "academic" }, { areaId: "operations" }] };
const academic = { id: "academic", areaLinks: [{ areaId: "academic" }] };
const legacy = { id: "legacy" };
const events = [shared, academic, legacy];

test("area filters preserve all authorized events without a selection and do not duplicate shared events", () => {
  assert.deepEqual(filterCalendarEventsByAreas(events, []), events);
  assert.deepEqual(filterCalendarEventsByAreas(events, ["academic", "operations"]).map(event => event.id), ["shared", "academic"]);
  assert.deepEqual(filterCalendarEventsByAreas(events, ["operations"]).map(event => event.id), ["shared"]);
  assert.deepEqual(filterCalendarEventsByAreas(events, ["unknown"]), []);
});
