import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Exercise public entry points with persistence and post-response work isolated.
const state = { writes: [], callbacks: [], notifications: [], syncs: [] };
globalThis.__calendarMexicoPolicyTest = state;
const mocks = new Map([
  ["@prisma/client", `export const CalendarAudienceType = { ALL: 'ALL', PRIVATE: 'PRIVATE', TEACHERS: 'TEACHERS', PARENTS: 'PARENTS' };
    export const CalendarEventVisibility = { PUBLIC: 'PUBLIC', MEMBERS: 'MEMBERS' };
    export const CalendarEventStatus = { PUBLISHED: 'PUBLISHED' };
    export const CalendarRegistrationAccess = { PUBLIC: 'PUBLIC', MEMBERS: 'MEMBERS' };`],
  ["next/navigation", `export function redirect(url) { throw Object.assign(new Error('redirect'), { location: url }); }`],
  ["next/server", `export function after(callback) { globalThis.__calendarMexicoPolicyTest.callbacks.push(callback); }
    export const NextResponse = { redirect(url, status) { return new Response(null, { status, headers: { location: String(url) } }); } };`],
  ["@/modules/auth/server/auth-guards", `export async function requirePermission() { return { id: 'admin' }; }
    export async function getAuthenticatedUser() { return { id: 'admin', permissionKeys: ['calendar.manage'] }; }`],
  ["@/modules/dashboard/server/calendar.repository", `export async function saveCalendarEvent(input) {
    globalThis.__calendarMexicoPolicyTest.writes.push(input); return { id: input.id ?? 'saved-event' };
    } export async function cancelCalendarEvent() { throw new Error('unexpected_cancel'); }`],
  ["@/modules/calendar/server/calendar-invitation.service", `export async function sendPendingCalendarEventInvitations(id) { globalThis.__calendarMexicoPolicyTest.notifications.push(id); }`],
  ["@/modules/calendar/server/calendar-attendance.repository", `export async function createManualCalendarEventAttendance() { throw new Error('unexpected_attendance'); }`],
  ["@/modules/calendar/server/google-calendar/google-calendar-sync.service", `export async function syncEventForConfirmedUsers(id) { globalThis.__calendarMexicoPolicyTest.syncs.push(id); }
    export async function removeEventFromGoogleCalendars() { throw new Error('unexpected_remove'); }`],
  ["@/modules/dashboard/components/calendar-event-image-field", `export function CalendarEventImageField() { return null; }`],
  ["@/modules/dashboard/components/calendar-event-attendance-dialog", `export function CalendarEventAttendanceDialog() { return null; }`],
]);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (mocks.has(specifier)) return { url: `calendar-mock:${specifier}`, shortCircuit: true };
    if (specifier.startsWith("@/")) return { url: new URL(`../../src/${specifier.slice(2)}.ts`, import.meta.url).href, shortCircuit: true };
    if (specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier)) {
      return { url: new URL(`${specifier}.ts`, context.parentURL).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("calendar-mock:")) return { format: "module", source: mocks.get(url.slice("calendar-mock:".length)), shortCircuit: true };
    if (url.startsWith("file:") && /\.tsx?$/.test(url) && !url.includes("node_modules")) {
      return { format: "module", source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

// Also run the focused domain coverage in memory: no generated build artifacts.
await import("../domain/calendar-time-zone.test.ts");
await import("../domain/google-calendar-event.test.ts");
const { saveCalendarEventAction } = await import("../../src/modules/dashboard/server/calendar.actions.ts");
const { POST } = await import("../../src/app/api/dashboard/calendar/events/save/route.ts");
const { CalendarEventForm } = await import("../../src/modules/dashboard/components/calendar-event-form.tsx");

function form(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ title: "Festejo Día de Muertos", eventDate: "2026-11-01", startTime: "16:00", durationMinutes: "150", visibility: "PUBLIC", ...overrides })) {
    data.set(key, value);
  }
  return data;
}
function reset() {
  for (const entries of Object.values(state)) entries.length = 0;
}
async function submit(entry, data) {
  if (entry === "action") {
    try { await saveCalendarEventAction(data); assert.fail("Expected redirect"); }
    catch (error) { assert.equal(error.message, "redirect"); return { status: 303, location: error.location }; }
  }
  const response = await POST(new Request("https://koru.example/api/dashboard/calendar/events/save", { method: "POST", body: data }));
  assert.equal(await response.text(), "");
  return { status: response.status, location: new URL(response.headers.get("location")).pathname + new URL(response.headers.get("location")).search };
}

for (const entry of ["action", "API"]) {
  test(`${entry}: alternate, invalid, absent, and Mexico zones save the same Mexico instant`, async () => {
    for (const zone of ["America/Argentina/Buenos_Aires", "America/New_York", "Mars/Olympus", "", "America/Mexico_City"]) {
      reset();
      const data = form({ id: "existing-event", attendanceConfirmationEnabled: "on" });
      if (zone) data.set("timeZone", zone);
      assert.deepEqual(await submit(entry, data), { status: 303, location: "/dashboard/calendar?ok=invitation_scheduled" });
      assert.equal(state.writes.length, 1);
      const saved = state.writes[0];
      assert.equal(saved.id, "existing-event");
      assert.equal(saved.timeZone, "America/Mexico_City");
      assert.equal(saved.startsAt.toISOString(), "2026-11-01T22:00:00.000Z");
      assert.equal(saved.endsAt.toISOString(), "2026-11-02T00:30:00.000Z");
      assert.equal(saved.title, "Festejo Día de Muertos");
      assert.equal(saved.createdById, "admin");
      assert.equal(saved.visibility, "PUBLIC");
      assert.equal(saved.audienceType, "ALL");
      assert.equal(saved.registrationAccess, "PUBLIC");
      assert.equal(state.callbacks.length, 1);
      assert.deepEqual(state.notifications, []);
      assert.deepEqual(state.syncs, []);
      await state.callbacks[0]();
      assert.deepEqual(state.notifications, ["existing-event"]);
      assert.deepEqual(state.syncs, ["existing-event"]);
    }
  });
  test(`${entry}: invalid dates and times cause no writes or scheduled side effects`, async () => {
    for (const invalid of [{ eventDate: "2026-02-30" }, { eventDate: "not-a-date" }, { startTime: "24:00" }, { startTime: "noon" }]) {
      reset();
      assert.deepEqual(await submit(entry, form({ timeZone: "America/New_York", ...invalid })), { status: 303, location: "/dashboard/calendar?error=invalid_date" });
      assert.deepEqual(state, { writes: [], callbacks: [], notifications: [], syncs: [] });
    }
  });
  test(`${entry}: existing Mexico creation without invitations still saves and syncs`, async () => {
    reset();
    assert.deepEqual(await submit(entry, form({ timeZone: "America/Mexico_City" })), { status: 303, location: "/dashboard/calendar?ok=saved" });
    assert.equal(state.writes.length, 1);
    assert.equal(state.writes[0].id, undefined);
    assert.equal(state.writes[0].attendanceConfirmationEnabled, false);
    assert.equal(state.callbacks.length, 1);
    await state.callbacks[0]();
    assert.deepEqual(state.notifications, []);
    assert.deepEqual(state.syncs, ["saved-event"]);
  });
}

test("form shows fixed Mexico time, no timezone selector, and ignores a legacy event zone", () => {
  const html = renderToStaticMarkup(createElement(CalendarEventForm, {
    users: [], mode: "edit", event: {
      id: "legacy", title: "Legacy", startsAt: new Date("2026-11-02T04:00:00Z"), endsAt: new Date("2026-11-02T05:00:00Z"),
      timeZone: "Europe/Madrid", visibility: "MEMBERS", audienceType: "ALL", kind: "EVENT",
    },
  }));
  assert.doesNotMatch(html, /<select[^>]*name="timeZone"/);
  assert.doesNotMatch(html, /Buenos Aires|Nueva York|Madrid|seleccionada/);
  assert.match(html, /Ciudad de México/);
  assert.match(html, /name="eventDate"[^>]*value="2026-11-01"/);
  assert.match(html, /name="startTime"[^>]*value="22:00"/);
  assert.match(html, /name="durationMinutes"[^>]*value="60"/);
});
