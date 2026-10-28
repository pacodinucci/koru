import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const NativeDate = Date;
class Clock extends NativeDate {
  constructor(...args) { super(...(args.length ? args : ["2027-01-01T02:00:00Z"])); }
  static now() { return NativeDate.parse("2027-01-01T02:00:00Z"); }
}
function load(path, overrides = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  const repo = new Proxy({}, { get: () => async () => [] });
  const mocks = {
    "@/modules/auth/server/auth-guards": { getAuthenticatedUser: async () => null, requirePermission: async () => ({ email: "admin@example.com", role: "ADMIN", permissionKeys: [] }) },
    "@/modules/dashboard/server/calendar.repository": repo,
    "@/modules/calendar/server/calendar-areas.repository": repo,
    "@/modules/dashboard/server/cms-pages.repository": { discoverPagesGroupRoutes: async () => [] },
    "@/modules/family-dashboard/server/family-dashboard-access": { requireFamilyDashboardAccess: async () => ({ viewer: { name: "Family", email: "family@example.test" }, familyUser: { id: "family", role: "PARENT" } }) },
    "@/modules/calendar/server/google-calendar/google-calendar.repository": repo,
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    ...overrides,
  };
  vm.runInNewContext(compiled, { Date: Clock, URL, URLSearchParams, module: loaded, exports: loaded.exports, require: (id) => {
    if (id === "react/jsx-runtime") return require(id);
    if (id === "@/modules/dashboard/lib/calendar-range") return load("../../src/modules/dashboard/lib/calendar-range.ts", overrides);
    if (id === "@/modules/calendar/lib/calendar-time-zone") return load("../../src/modules/calendar/lib/calendar-time-zone.ts", overrides);
    if (id === "@/modules/calendar/lib/calendar-navigation") return load("../../src/modules/calendar/lib/calendar-navigation.ts", overrides);
    return mocks[id] ?? new Proxy({}, { get: () => () => null });
  } });
  return loaded.exports;
}

function findProvider(node) {
  if (!node || typeof node !== "object") return undefined;
  if (node?.props?.initialEvents) return node;
  for (const child of [node?.props?.children].flat(Infinity)) {
    const found = findProvider(child);
    if (found) return found;
  }
}

test("calendar entry pages use Mexico today and serialize dashboard/family civil cursors", async () => {
  const oldZone = process.env.TZ;
  try {
    for (const zone of ["UTC", "America/Argentina/Buenos_Aires", "Asia/Tokyo"]) {
      process.env.TZ = zone;
      const PublicPage = load("../../src/app/(pages)/calendario/page.tsx").default;
      const DashboardPage = load("../../src/app/(dashboard)/dashboard/calendar/page.tsx").default;
      const FamilyPage = load("../../src/app/(family-dashboard)/family-dashboard/calendario/page.tsx").default;
      for (const date of [undefined, "invalid", "2026-10-30"]) {
        const publicTree = await PublicPage({ searchParams: Promise.resolve({ date }) });
        const dashboardTree = await DashboardPage({ searchParams: Promise.resolve({ date }) });
        const familyTree = findProvider(await FamilyPage({ searchParams: Promise.resolve({ date, event: "direct-event" }) }));
        const expected = date === "2026-10-30" ? "2026-10-30" : "2026-12-31";
        const cursor = publicTree.props.dateCursor;
        const actual = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
        assert.equal(actual, expected, `public ${zone}`);
        assert.equal(dashboardTree.props.initialDateCursor, expected, `dashboard ${zone}`);
        assert.equal(familyTree.props.initialDateCursor, expected, `family ${zone}`);
        assert.equal(familyTree.props.initialSelectedEventId, "direct-event");
      }
    }
  } finally {
    if (oldZone === undefined) delete process.env.TZ;
    else process.env.TZ = oldZone;
  }
});

for (const kind of ["dashboard", "family-dashboard"]) {
  test(`${kind} API: authorized civil ranges and Mexico fallback are independent of server timezone`, async () => {
    const oldZone = process.env.TZ;
    try {
      for (const zone of ["UTC", "America/Argentina/Buenos_Aires", "Asia/Tokyo"]) {
        process.env.TZ = zone;
        const calls = [];
        const repository = {
          listCalendarEventsForAdminByRange: async (...args) => { calls.push(args); return [{ id: "authorized" }]; },
          listVisibleEventsForUserByRange: async (...args) => { calls.push(args); return [{ id: "authorized" }]; },
        };
        const { GET } = load(`../../src/app/api/${kind}/calendar/events/route.ts`, {
          "@/modules/auth/server/auth-guards": { getAuthenticatedUser: async () => ({ permissionKeys: ["calendar.view"] }) },
          "@/modules/dashboard/server/calendar.repository": repository,
        });
        for (const date of [undefined, "invalid", "2026-02-30", "2026-10-30"]) {
          for (const view of ["day", "week", "month", "invalid"]) {
            const params = new URLSearchParams({ view }); if (date) params.set("date", date);
            const result = await GET(new Request(`https://koru.test/api/${kind}/calendar/events?${params}`));
            assert.equal(result.status, 200);
            assert.deepEqual(await result.json(), { events: [{ id: "authorized" }] });
            assert.match(result.headers.get("cache-control"), /private.*no-store/);
            const args = calls.at(-1);
            if (kind === "family-dashboard") assert.deepEqual(args.slice(0, 2), ["family", "PARENT"]);
            const cursor = args.at(-2);
            const value = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
            assert.equal(value, date === "2026-10-30" ? date : "2026-12-31", `${zone} ${date}`);
            assert.equal(args.at(-1), view === "invalid" ? "week" : view);
          }
        }
        assert.equal(calls.length, 16);
      }
    } finally {
      if (oldZone === undefined) delete process.env.TZ;
      else process.env.TZ = oldZone;
    }
  });
}

test("dashboard range API still rejects unauthenticated and unauthorized requests without repository access", async () => {
  let reads = 0;
  for (const user of [null, { permissionKeys: [] }]) {
    const { GET } = load("../../src/app/api/dashboard/calendar/events/route.ts", {
      "@/modules/auth/server/auth-guards": { getAuthenticatedUser: async () => user },
      "@/modules/dashboard/server/calendar.repository": { listCalendarEventsForAdminByRange: async () => { reads++; return []; } },
    });
    const result = await GET(new Request("https://koru.test/api/dashboard/calendar/events?date=2026-10-30"));
    assert.equal(result.status, 403);
    assert.deepEqual(await result.json(), { error: "forbidden" });
  }
  assert.equal(reads, 0);
});
