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
let events = [];

function loadComponent(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} };
  const mockedRequire = (specifier) => {
    if (specifier === "react/jsx-runtime") return require(specifier);
    if (specifier === "@/modules/calendar/lib/calendar-time-zone") return loadComponent("../../src/modules/calendar/lib/calendar-time-zone.ts");
    if (specifier === "@/modules/auth/server/auth-guards") return { getAuthenticatedUser: async () => null };
    if (specifier === "@/modules/blog/server/blog.repository") return { getPublishedPosts: async () => [], getPublishedBlogTags: async () => [] };
    if (specifier === "@/modules/dashboard/server/calendar.repository") return { listUpcomingPublicCalendarEvents: async () => events };
    if (specifier === "@/modules/blog/components/blog-event-dialog") return loadComponent("../../src/modules/blog/components/blog-event-dialog.tsx");
    return new Proxy({}, { get: () => passthrough });
  };
  vm.runInNewContext(output, { require: mockedRequire, module: loadedModule, exports: loadedModule.exports });
  return loadedModule.exports;
}

const { BlogListView } = loadComponent("../../src/modules/blog/views/blog-list-view.tsx");
const { BlogEventDialog } = loadComponent("../../src/modules/blog/components/blog-event-dialog.tsx");

for (const hostZone of ["UTC", "America/Argentina/Buenos_Aires", "Asia/Tokyo"]) {
  test(`blog list and detail use Mexico despite legacy metadata with host zone ${hostZone}`, async () => {
    const previousZone = process.env.TZ;
    process.env.TZ = hostZone;
    try {
      for (const timeZone of ["America/Mexico_City", "America/Cancun", "Asia/Tokyo"]) {
        events = [{
          id: "event-1", title: "Festejo Día de Muertos", startsAt: new Date("2026-10-30T22:00:00Z"),
          endsAt: new Date("2026-10-31T00:30:00Z"), timeZone, location: "Koru", visibility: "PUBLIC",
          registrationsEnabled: false, attendanceConfirmationEnabled: false, attendances: [],
        }];
        for (const [startsAt, endsAt, day, month, year] of [
          ["2026-10-30T22:00:00Z", "2026-10-31T00:30:00Z", "30", "OCT", "2026"],
          ["2027-01-01T04:00:00Z", "2027-01-01T04:30:00Z", "31", "DIC", "2026"],
        ]) {
          const event = { ...events[0], startsAt: new Date(startsAt), endsAt: new Date(endsAt) };
          events = [event];
          const expectedRange = startsAt.includes("10-30") ? "16:00 - 18:30" : "22:00 - 22:30";
          const detail = renderToStaticMarkup(createElement(BlogEventDialog, { event, isAuthenticated: false }));
          const list = renderToStaticMarkup(await BlogListView({}));
          assert.ok(detail.includes(expectedRange), detail);
          assert.ok(list.includes(`<span>${expectedRange}</span>`), list);
          assert.ok(list.includes(`>${day}</span>`), list);
          assert.ok(list.includes(`>${month}</span>`), list);
          assert.ok(list.includes(`>${year}</span>`), list);
          const expectedDate = event.startsAt.toLocaleDateString("es-AR", { timeZone: "America/Mexico_City", day: "numeric", month: "long", year: "numeric" });
          assert.ok(detail.includes(expectedDate), detail);
          assert.ok(list.includes(event.title));
          assert.ok(list.includes("Koru"));
          assert.ok(detail.includes("Ver evento completo"));
        }
      }
      events = [];
      assert.match(renderToStaticMarkup(await BlogListView({})), /No hay próximos eventos publicados\./);
    } finally {
      if (previousZone === undefined) delete process.env.TZ;
      else process.env.TZ = previousZone;
    }
  });
}
