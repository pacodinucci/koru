import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { cloneElement, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Exercise public entry points with persistence and post-response work isolated.
const state = { writes: [], callbacks: [], notifications: [], syncs: [] };
globalThis.__calendarMexicoPolicyTest = state;
globalThis.__calendarDialogClose = ({ render, children }) => cloneElement(render, {}, children);
globalThis.__calendarDialogPart = ({ children, className, render }) => render
  ? cloneElement(render, {}, children)
  : createElement("div", { className }, children);
const mocks = new Map([
  ["@/components/ui/responsive-dialog", `export const ResponsiveDialogClose = globalThis.__calendarDialogClose;
    export const ResponsiveDialog = globalThis.__calendarDialogPart;
    export const ResponsiveDialogBody = globalThis.__calendarDialogPart;
    export const ResponsiveDialogContent = globalThis.__calendarDialogPart;
    export const ResponsiveDialogDescription = globalThis.__calendarDialogPart;
    export const ResponsiveDialogFooter = globalThis.__calendarDialogPart;
    export const ResponsiveDialogHeader = globalThis.__calendarDialogPart;
    export const ResponsiveDialogTitle = globalThis.__calendarDialogPart;
    export const ResponsiveDialogTrigger = globalThis.__calendarDialogPart;`],
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
      const tsUrl = new URL(`${specifier}.ts`, context.parentURL);
      return { url: existsSync(fileURLToPath(tsUrl)) ? tsUrl.href : new URL(`${specifier}.tsx`, context.parentURL).href, shortCircuit: true };
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
const { CalendarEventGuestPicker } = await import("../../src/modules/dashboard/components/calendar-event-guest-picker.tsx");

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
      const data = form({ id: "existing-event", attendanceConfirmationEnabled: "on", sendEmails: "on" });
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
  test(`${entry}: saving with attendance enabled sends email only with explicit opt-in`, async () => {
    for (const sendEmails of [undefined, "", "true", "on"]) {
      reset();
      const data = form({ attendanceConfirmationEnabled: "on" });
      if (sendEmails !== undefined) data.set("sendEmails", sendEmails);
      const optedIn = sendEmails === "on";
      assert.deepEqual(await submit(entry, data), { status: 303, location: `/dashboard/calendar?ok=${optedIn ? "invitation_scheduled" : "saved"}` });
      assert.equal(state.writes.length, 1);
      assert.equal(state.writes[0].attendanceConfirmationEnabled, true);
      assert.equal(state.writes[0].startsAt.toISOString(), "2026-11-01T22:00:00.000Z");
      assert.equal(state.callbacks.length, 1);
      assert.deepEqual(state.notifications, []);
      await state.callbacks[0]();
      assert.deepEqual(state.notifications, optedIn ? ["saved-event"] : []);
      assert.deepEqual(state.syncs, ["saved-event"]);
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

test("event form has labeled sections, a scrollable body and separate persistent actions", () => {
  const html = renderToStaticMarkup(createElement(CalendarEventForm, { users: [] }));
  for (const heading of ["Información general", "Fecha y horario", "Ubicación y descripción", "Visibilidad y audiencia", "Inscripción y asistencia", "Imagen del evento"]) {
    assert.ok(html.includes(heading), `Missing section: ${heading}`);
  }
  for (const field of ["title", "eventDate", "startTime", "durationMinutes", "location", "description", "visibility", "audienceType", "kind"]) {
    assert.match(html, new RegExp(`<label[^>]*for="[^"]*${field}"`), `Missing label: ${field}`);
  }
  assert.match(html, /data-slot="calendar-event-body"[^>]*class="[^"]*overflow-y-auto/);
  assert.match(html, /data-slot="calendar-event-footer"[^>]*class="[^"]*shrink-0/);
  assert.match(html, /action="\/api\/dashboard\/calendar\/events\/save"/);
  assert.match(html, /<input(?=[^>]*name="durationMinutes")(?=[^>]*min="15")(?=[^>]*step="15")(?=[^>]*value="60")[^>]*>/);
});

test("email checkbox is present and unchecked by default", () => {
  const html = renderToStaticMarkup(createElement(CalendarEventForm, { users: [] }));
  const checkbox = html.match(/<input[^>]*name="sendEmails"[^>]*>/)?.[0];
  assert.ok(checkbox, "Missing sendEmails checkbox");
  assert.doesNotMatch(checkbox, /checked/);
  assert.match(html, /Enviar invitaciones por email/);
});

test("event dialog uses the existing responsive dialog with a wide desktop and full-height mobile layout", () => {
  const source = readFileSync(new URL("../../src/modules/dashboard/components/responsive-event-sheet.tsx", import.meta.url), "utf8");
  assert.match(source, /@\/components\/ui\/responsive-dialog/);
  assert.doesNotMatch(source, /@\/components\/ui\/sheet|useIsMobile/);
  assert.match(source, /h-\[100dvh\]/);
  assert.match(source, /md:w-\[min\(calc\(100vw-2rem\),70rem\)\]/);
  assert.match(source, /closeHref\) router.push\(closeHref\)/);
  assert.match(source, /onClose\?\.\(\)/);
});

test("private edit preserves audience selection, duration and cancellation action", () => {
  const html = renderToStaticMarkup(createElement(CalendarEventForm, {
    users: [{ id: "teacher-1", name: "Docente", role: "TEACHER" }], mode: "edit", event: {
      id: "private-event", title: "Reunión", startsAt: new Date("2026-11-02T04:00:00Z"), endsAt: new Date("2026-11-02T05:30:00Z"),
      timeZone: "America/Mexico_City", visibility: "MEMBERS", audienceType: "PRIVATE", kind: "MEETING", audiences: [{ userId: "teacher-1" }],
    },
  }));
  assert.match(html, /name="id"[^>]*value="private-event"/);
  assert.match(html, /<input[^>]*type="hidden"[^>]*name="privateAudienceUserIds"[^>]*value="teacher-1"/);
  assert.doesNotMatch(html, /<select[^>]*name="privateAudienceUserIds"/);
  assert.match(html, /Seleccionar invitados/);
  assert.match(html, /1 seleccionado/);
  assert.match(html, /name="durationMinutes"[^>]*value="90"/);
  assert.match(html, /data-server-action="true"/);
  assert.match(html, /Cancelar evento/);
  assert.match(html, /Guardar cambios/);
});

test("guest picker separates available and invited users and places search in the right container", () => {
  const html = renderToStaticMarkup(createElement(CalendarEventGuestPicker, {
    triggerId: "guests", selectedIds: ["selected"], onChange: () => {},
    users: [{ id: "available", name: "Ana", roleLabel: "Maestro" }, { id: "selected", name: "José", roleLabel: "Familia" }],
  }));
  const sections = html.match(/<section\b[^>]*>[\s\S]*?<\/section>/g);
  assert.equal(sections.length, 2);
  assert.match(sections[0], /Personas disponibles/);
  assert.match(sections[0], /Agregar a Ana/);
  assert.doesNotMatch(sections[0], /Agregar a José|type="search"/);
  assert.match(sections[1], /Invitados seleccionados/);
  assert.match(sections[1], /Quitar a José/);
  assert.doesNotMatch(sections[1], /Quitar a Ana/);
  assert.match(sections[1], /type="search"/);
  assert.match(html, /md:grid-cols-2/);
  assert.match(html, /Aplicar selección/);
  assert.match(html, /Cancelar/);
  for (const button of html.matchAll(/<button\b[^>]*>/g)) assert.match(button[0], /type="button"/);
});

test("guest picker shows empty lists without adding submitted form fields", () => {
  const html = renderToStaticMarkup(createElement(CalendarEventGuestPicker, {
    triggerId: "empty-guests", selectedIds: [], onChange: () => {}, users: [],
  }));
  assert.match(html, /No quedan personas disponibles/);
  assert.match(html, /Todavía no seleccionaste invitados/);
  assert.doesNotMatch(html, /<form|name="privateAudienceUserIds"/);
});

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
