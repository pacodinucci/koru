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
const link = ({ children, href }) => createElement("a", { href }, children);
const now = "2026-10-01T04:00:00Z";
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [now])); }
}
function load(path) {
  const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} };
  const mockedRequire = (specifier) => {
    if (["react", "react/jsx-runtime"].includes(specifier)) return require(specifier);
    if (specifier === "next/link") return { default: link };
    if (specifier === "next/navigation") return { useRouter: () => ({ replace() {} }) };
    if (specifier === "@/modules/dashboard/views/dashboard-calendar-view") return load("modules/dashboard/views/dashboard-calendar-view.tsx");
    if (specifier === "@/modules/calendar/lib/calendar-time-zone") return load("modules/calendar/lib/calendar-time-zone.ts");
    if (specifier === "@/modules/calendar/lib/calendar-area-types") return load("modules/calendar/lib/calendar-area-types.ts");
    if (specifier === "@/modules/calendar/lib/calendar-navigation") return load("modules/calendar/lib/calendar-navigation.ts");
    if (specifier === "@/modules/calendar/lib/public-calendar-window") return load("modules/calendar/lib/public-calendar-window.ts");
    if (specifier === "@/modules/calendar/lib/calendar-range-loader") return load("modules/calendar/lib/calendar-range-loader.ts");
    if (specifier === "@/modules/dashboard/lib/calendar-range") return load("modules/dashboard/lib/calendar-range.ts");
    return new Proxy({}, { get: () => passthrough });
  };
  vm.runInNewContext(output, { require: mockedRequire, module: loadedModule, exports: loadedModule.exports, Date: FixedDate, URLSearchParams, URL });
  return loadedModule.exports;
}
const render = (Component, props) => renderToStaticMarkup(createElement(Component, props));
const fixture = {
  id: "festejo", title: "Festejo Día de Muertos", startsAt: new Date("2026-10-30T22:00:00Z"),
  endsAt: new Date("2026-10-31T00:30:00Z"), timeZone: "Asia/Tokyo", location: "Koru",
  allDay: false, visibility: "PUBLIC", kind: "EVENT", status: "PUBLISHED", audienceType: "ALL",
  registrationsEnabled: false, attendanceConfirmationEnabled: false, attendances: [],
};

for (const hostZone of ["UTC", "America/Argentina/Buenos_Aires", "Asia/Tokyo"]) {
  test(`Mexico calendar rendering and civil ranges on host ${hostZone}`, () => {
    const previousZone = process.env.TZ;
    process.env.TZ = hostZone;
    try {
      const { FamilyUpcomingEvents } = load("modules/family-dashboard/views/family-upcoming-events.tsx");
      const { FamilyEventDetailDialog } = load("modules/family-dashboard/components/family-event-detail-dialog.tsx");
      const { PublicCalendarView } = load("modules/calendar/views/public-calendar-view.tsx");
      const { DashboardCalendarGrid, DashboardCalendarSidePanel, DashboardCalendarUpcomingTable } = load("modules/dashboard/views/dashboard-calendar-view.tsx");
      const range = load("modules/dashboard/lib/calendar-range.ts");
      const civil = (year, month, day) => new Date(year, month - 1, day, 12);
      const dialogProps = { open: true, onOpenChange() {}, returnTo: "/family-dashboard/calendario", viewer: { name: "", email: "" } };
      const upcoming = render(FamilyUpcomingEvents, { events: [fixture] });
      assert.match(upcoming, />16:00</);
      assert.match(upcoming, /Ciudad de México/);
      assert.match(upcoming, /Festejo Día de Muertos/);
      assert.match(upcoming, /Koru/);
      assert.match(render(FamilyEventDetailDialog, { ...dialogProps, event: fixture }), /16:00 - 18:30/);
      assert.match(render(FamilyEventDetailDialog, { ...dialogProps, event: { ...fixture, allDay: true } }), /Todo el día/);
      assert.match(render(FamilyUpcomingEvents, { events: [] }), /No hay próximos eventos\./);
      assert.match(render(FamilyUpcomingEvents, { events: [{ ...fixture, allDay: true }] }), /Todo el día/);
      assert.equal(render(FamilyEventDetailDialog, { ...dialogProps }), "");

      for (const [event, cursor, dateText] of [
        [fixture, civil(2026, 10, 30), "30 de octubre de 2026"],
        [{ ...fixture, startsAt: new Date("2027-01-01T04:00:00Z"), endsAt: new Date("2027-01-01T04:30:00Z") }, civil(2026, 12, 31), "31 de diciembre de 2026"],
        [{ ...fixture, startsAt: new Date("2027-01-01T06:00:00Z"), endsAt: new Date("2027-01-01T06:30:00Z") }, civil(2027, 1, 1), "1 de enero de 2027"],
      ]) {
        const events = [event];
        const detail = render(FamilyEventDetailDialog, { ...dialogProps, event });
        assert.ok(detail.includes(dateText), detail);
        const publicCalendar = render(PublicCalendarView, { dateCursor: cursor, selectedDate: cursor, events });
        assert.match(publicCalendar, /Festejo Día de Muertos/);
        const expectedRange = event === fixture ? "16:00 - 18:30" : cursor.getDate() === 31 ? "22:00 - 22:30" : "00:00 - 00:30";
        assert.ok(publicCalendar.includes(expectedRange), publicCalendar);
        // Both the selected list and the day marker must use Mexico's date.
        const dateParam = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
        const markedDays = [...publicCalendar.matchAll(/<a href="([^"]*day=[^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].filter((match) => match[2].includes("rounded-full border-"));
        assert.equal(markedDays.length, 1);
        assert.ok(markedDays[0][1].includes(`day=${dateParam}`));
        const month = render(DashboardCalendarGrid, { dateCursor: cursor, viewMode: "month", events });
        const monthCells = [...month.matchAll(/<div[^>]*class="min-h-24 border-r border-b border-slate-100 p-2">([\s\S]*?)<\/a>/g)];
        const eventCell = monthCells.find((cell) => cell[1].includes(event.title));
        assert.ok(eventCell, month);
        assert.match(eventCell[1], new RegExp(`>${cursor.getDate()}</p>`));
        const upcomingTable = render(DashboardCalendarUpcomingTable, { events });
        assert.match(upcomingTable, new RegExp(expectedRange.split(" - ")[0]));
        assert.ok(upcomingTable.includes(event.startsAt.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City", day: "2-digit", month: "2-digit", year: "numeric" })));
        const sidePanel = render(DashboardCalendarSidePanel, { events, dateCursor: cursor, viewMode: "month", onSelectEvent() {} });
        assert.ok(sidePanel.includes(event.startsAt.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City", day: "2-digit", month: "2-digit" })));
        assert.ok(sidePanel.includes(expectedRange.split(" - ")[0]));
      }
      for (const viewMode of ["day", "week"]) {
        const grid = render(DashboardCalendarGrid, { dateCursor: civil(2026, 10, 30), viewMode, events: [fixture] });
        assert.match(grid, /16:00 - 18:30/);
        assert.match(grid, /Ciudad de México/);
        assert.doesNotMatch(grid, /tu dispositivo|tu zona/);
        const rows = grid.split('<div class="contents">');
        const row = rows.find((part) => part.includes(fixture.title));
        assert.ok(row?.startsWith('<div class="border-r border-b border-slate-200 p-2.5 text-xs text-slate-500">16:00</div>'), grid);
        assert.ok(grid.includes("date=2026-10-30"), grid);
      }
      const { DashboardCalendarClientProvider, DashboardCalendarGridClient } = load("modules/dashboard/views/dashboard-calendar-client.tsx");
      const clientGrid = render(DashboardCalendarClientProvider, {
        initialEvents: [fixture], initialUpcomingEvents: [fixture], initialDateCursor: "2026-10-30", initialViewMode: "day", users: [],
        children: createElement(DashboardCalendarGridClient),
      });
      assert.match(clientGrid, /16:00 - 18:30/);
      assert.match(clientGrid, /30 de octubre de 2026/);
      assert.match(clientGrid, /<button[^>]*>.*?Hoy<\/button>/);
      assert.match(render(PublicCalendarView, { dateCursor: civil(2026, 10, 1), events: [fixture] }), /16:00 - 18:30/);
      assert.match(render(DashboardCalendarSidePanel, { events: [fixture], dateCursor: civil(2026, 10, 30), viewMode: "month" }), />16:00</);
      const table = render(DashboardCalendarUpcomingTable, { events: [fixture] });
      assert.match(table, />18:30</);
      assert.match(table, /Ciudad de México/);
      assert.doesNotMatch(table, /tu zona/);
      assert.match(render(PublicCalendarView, { dateCursor: civil(2026, 10, 30), events: [] }), /No hay eventos para este periodo\./);
      assert.match(render(DashboardCalendarUpcomingTable, { events: [] }), /No hay próximos eventos\./);
      assert.match(render(DashboardCalendarSidePanel, { dateCursor: civil(2026, 10, 30), viewMode: "month", events: [] }), /No hay próximos eventos\./);

      assert.equal(range.serializeDate(civil(2026, 10, 30)), "2026-10-30");
      const today = range.calendarTodayCursor(new Date("2027-01-01T04:00:00Z"));
      assert.equal(range.serializeDate(today), "2026-12-31");
      assert.equal(today.getHours(), 12);
      assert.equal(range.serializeDate(range.calendarTodayCursor()), "2026-09-30");
      for (const [view, start, end] of [
        ["day", "2026-10-30T06:00:00.000Z", "2026-10-31T06:00:00.000Z"],
        ["week", "2026-10-26T06:00:00.000Z", "2026-11-02T06:00:00.000Z"],
        ["month", "2026-10-01T06:00:00.000Z", "2026-11-01T06:00:00.000Z"],
      ]) {
        const actual = range.getRangeForView(civil(2026, 10, 30), view);
        assert.equal(actual.start.toISOString(), start);
        assert.equal(actual.end.toISOString(), end);
      }
      assert.equal(range.serializeDate(range.getNextCursor(civil(2026, 10, 30), "day", 1)), "2026-10-31");
      assert.equal(range.serializeDate(range.getNextCursor(civil(2026, 10, 30), "week", -1)), "2026-10-23");
    } finally {
      if (previousZone === undefined) delete process.env.TZ;
      else process.env.TZ = previousZone;
    }
  });
}
