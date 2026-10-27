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
function load(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  const repo = new Proxy({}, { get: () => async () => [] });
  const mocks = {
    "@/modules/auth/server/auth-guards": { getAuthenticatedUser: async () => null, requirePermission: async () => ({ email: "admin@example.com", role: "ADMIN", permissionKeys: [] }) },
    "@/modules/dashboard/server/calendar.repository": repo,
    "@/modules/calendar/server/calendar-areas.repository": repo,
    "@/modules/dashboard/server/cms-pages.repository": { discoverPagesGroupRoutes: async () => [] },
  };
  vm.runInNewContext(compiled, { Date: Clock, URLSearchParams, module: loaded, exports: loaded.exports, require: (id) => {
    if (id === "react/jsx-runtime") return require(id);
    if (id === "@/modules/dashboard/lib/calendar-range") return load("../../src/modules/dashboard/lib/calendar-range.ts");
    if (id === "@/modules/calendar/lib/calendar-time-zone") return load("../../src/modules/calendar/lib/calendar-time-zone.ts");
    return mocks[id] ?? new Proxy({}, { get: () => () => null });
  } });
  return loaded.exports;
}

test("calendar entry pages use Mexico today and serialize dashboard civil cursors", async () => {
  const oldZone = process.env.TZ;
  try {
    for (const zone of ["UTC", "America/Argentina/Buenos_Aires", "Asia/Tokyo"]) {
      process.env.TZ = zone;
      const PublicPage = load("../../src/app/(pages)/calendario/page.tsx").default;
      const DashboardPage = load("../../src/app/(dashboard)/dashboard/calendar/page.tsx").default;
      for (const date of [undefined, "invalid", "2026-10-30"]) {
        const publicTree = await PublicPage({ searchParams: Promise.resolve({ date }) });
        const dashboardTree = await DashboardPage({ searchParams: Promise.resolve({ date }) });
        const expected = date === "2026-10-30" ? "2026-10-30" : "2026-12-31";
        const cursor = publicTree.props.dateCursor;
        const actual = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
        assert.equal(actual, expected, `public ${zone}`);
        assert.equal(dashboardTree.props.initialDateCursor, expected, `dashboard ${zone}`);
      }
    }
  } finally {
    if (oldZone === undefined) delete process.env.TZ;
    else process.env.TZ = oldZone;
  }
});
