import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const passthrough = ({ children }) => createElement("div", null, children);
const event = {
  id: "festejo", title: "Festejo Día de Muertos", startsAt: new Date("2026-10-30T22:00:00Z"),
  endsAt: new Date("2026-10-31T00:30:00Z"), timeZone: "America/Argentina/Buenos_Aires",
  visibility: "PUBLIC", attendances: [], registrations: [], registrationsEnabled: false,
};
function loadPage(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  const mocks = {
    "@prisma/client": { CalendarAttendanceStatus: { PENDING: "PENDING", CONFIRMED: "CONFIRMED", DECLINED: "DECLINED" } },
    "@/modules/auth/server/auth-guards": { getAuthenticatedUser: async () => null, requirePermission: async () => ({ email: "admin@example.com", role: "ADMIN", permissionKeys: [] }) },
    "@/modules/calendar/lib/calendar-time-zone": { DEFAULT_CALENDAR_TIME_ZONE: "America/Mexico_City", calendarTimeZoneLabel: () => "Ciudad de México (México)" },
    "@/modules/calendar/server/calendar-registration.repository": { getCalendarEventForViewer: async () => event },
    "@/modules/calendar/server/calendar-external-invitation": { getExternalCalendarInvitationByToken: async () => ({ name: "Guest", email: "guest@example.com", status: "PENDING", event }) },
    "@/modules/dashboard/server/calendar.repository": { getCalendarEventAttendanceForAdmin: async () => event },
    "@/modules/dashboard/server/cms-pages.repository": { discoverPagesGroupRoutes: async () => [] },
  };
  vm.runInNewContext(output, { module: loaded, exports: loaded.exports, require: (id) => id === "react/jsx-runtime" ? require(id) : mocks[id] ?? new Proxy({}, { get: () => passthrough }) });
  return loaded.exports.default;
}
const pages = [
  "../../src/app/(pages)/calendario/eventos/[id]/page.tsx",
  "../../src/app/(pages)/calendario/invitacion/[token]/page.tsx",
  "../../src/app/(dashboard)/dashboard/calendar/[id]/page.tsx",
].map(loadPage);

test("event, invitation and attendance pages always show Mexico City time", async () => {
  const oldZone = process.env.TZ;
  try {
    for (const zone of ["UTC", "America/Argentina/Buenos_Aires", "Asia/Tokyo"]) {
      process.env.TZ = zone;
      for (const Page of pages) {
        const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: "festejo", token: "test-token" }), searchParams: Promise.resolve({}) }));
        const locale = Page.name === "CalendarEventPage" || Page.name === "DashboardCalendarAttendancePage" ? "es-MX" : "es-AR";
        const options = { timeZone: "America/Mexico_City", hour: "2-digit", minute: "2-digit" };
        assert.ok(html.includes(event.startsAt.toLocaleTimeString(locale, options)), html);
        assert.ok(html.includes(event.endsAt.toLocaleTimeString(locale, options)), html);
        assert.ok(html.includes("30 de octubre de 2026"), html);
        assert.ok(html.includes(event.title));
      }
    }
  } finally {
    if (oldZone === undefined) delete process.env.TZ;
    else process.env.TZ = oldZone;
  }
});
