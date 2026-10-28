import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
// UTC has rolled into 2027; Mexico is still in 2026.
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : ["2027-01-01T02:00:00Z"])); }
}
function harness() {
  const calls = [];
  const mocks = {
    "next/navigation": { notFound() { throw new Error("NOT_FOUND"); } },
    "next/link": { default: ({ children, href, ...props }) => createElement("a", { href, ...props }, children) },
    "@/modules/auth/server/auth-guards": { getAuthenticatedUser: async () => { calls.push("auth"); return null; } },
    "@/modules/dashboard/server/calendar.repository": { listPublicCalendarEventsByRange: async () => { calls.push("events"); return []; } },
    "@/modules/calendar/server/google-calendar/google-calendar.repository": { getGoogleCalendarConnectionState: async () => { calls.push("google"); return null; } },
    "@/modules/calendar/components/google-calendar-connection-card": { GoogleCalendarConnectionCard: () => null },
  };
  function load(path) {
    const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
    const output = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const mod = { exports: {} };
    vm.runInNewContext(output, { Date: Clock, URLSearchParams, module: mod, exports: mod.exports, require(id) {
      if (mocks[id]) return mocks[id];
      if (id === "react/jsx-runtime") return require(id);
      if (id.startsWith("@/")) return load(`${id.slice(2)}.${id.includes("views/") ? "tsx" : "ts"}`);
      throw new Error(`Unexpected import: ${id}`);
    } });
    return mod.exports;
  }
  return { Page: load("app/(pages)/calendario/page.tsx").default, calls };
}

test("public calendar rejects extreme, malformed and repeated date/day parameters before data access", async () => {
  for (const params of [
    { date: "1647-03-01" }, { date: "2020-12-31" }, { date: "2029-01-01" },
    { date: "invalid" }, { date: "" }, { date: "2026-02-30" }, { date: "2026-13-01" },
    { date: "2026-1-01" }, { date: ["2026-01-01", "1647-03-01"] },
    { day: "1647-03-01" }, { day: "2029-01-01" }, { day: "invalid" },
    { day: "2026-02-30" }, { day: ["2026-01-01", "2026-01-02"] },
  ]) {
    const { Page, calls } = harness();
    await assert.rejects(Page({ searchParams: Promise.resolve(params) }), /NOT_FOUND/, JSON.stringify(params));
    assert.deepEqual(calls, [], "rejected input must not access auth, events or Google");
  }
});

test("public calendar keeps Mexico today, valid dates, selection and inclusive year boundaries", async () => {
  for (const params of [{}, { date: "2021-01-01" }, { date: "2028-12-31" }, { date: "2024-02-29", day: "2024-02-29" }]) {
    const { Page, calls } = harness();
    const tree = await Page({ searchParams: Promise.resolve(params) });
    const cursor = tree.props.dateCursor;
    assert.equal(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`, params.date ?? "2026-12-31");
    assert.deepEqual(calls, ["auth", "events"]);
    if (params.day) assert.equal(tree.props.selectedDate.getDate(), 29);
    const html = renderToStaticMarkup(tree);
    const urls = [...html.matchAll(/href="([^"]+)"/g)].map((match) => new URL(match[1].replaceAll("&amp;", "&"), "https://koru.test"));
    assert.ok(urls.length >= 28, "valid in-range day links remain available");
    for (const url of urls) {
      const date = url.searchParams.get("date");
      if (date) assert.ok(Number(date.slice(0, 4)) >= 2021 && Number(date.slice(0, 4)) <= 2028, url.href);
    }
    if (params.date === "2021-01-01" || params.date === "2028-12-31") assert.match(html, /aria-disabled="true"/);
  }
});
