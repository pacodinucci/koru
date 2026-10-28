import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = new URL("../../src/", import.meta.url);
const event = (id) => ({ id, title: id, startsAt: "2026-10-30T22:00:00Z", endsAt: "2026-10-30T23:00:00Z" });
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const response = (events) => ({ ok: true, json: async () => ({ events }) });

// Small deterministic hook host: execute the real providers and shared modules,
// but isolate network, history and presentational components from Next/DOM.
function mount(kind, search = "?date=2026-10-30&view=day&filter=area#calendar") {
  let index = 0, tree, props, effects = [], calls = [], routerCalls = [];
  const slots = [], listeners = new Map(), modules = new Map();
  const path = kind === "dashboard" ? "/dashboard/calendar" : "/family-dashboard/calendario";
  const entries = [`https://koru.test${path}${search}`];
  let position = 0;
  const browser = {
    location: new URL(entries[0]),
    canonicalUrl: entries[0],
    // Next's history wrapper skips canonical URL updates for its own __NA/_N states.
    history: { state: { __NA: true },
      pushState(state, _, url) { if (!state?.__NA && !state?._N) browser.canonicalUrl = new URL(url, browser.location).href;
        this.state = { __NA: true }; entries.splice(++position); entries.push(new URL(url, browser.location).href); browser.location = new URL(entries[position]); },
      replaceState(state, _, url) { if (!state?.__NA && !state?._N) browser.canonicalUrl = new URL(url, browser.location).href;
        this.state = { __NA: true }; entries[position] = new URL(url, browser.location).href; browser.location = new URL(entries[position]); },
    },
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name) { listeners.delete(name); },
  };
  const react = {
    createContext: () => ({ Provider: "provider" }),
    useContext: () => tree.props.value,
    useState(initial) { const slot = index++; if (!(slot in slots)) slots[slot] = typeof initial === "function" ? initial() : initial;
      return [slots[slot], value => { slots[slot] = typeof value === "function" ? value(slots[slot]) : value; }]; },
    useRef(initial) { const slot = index++; return slots[slot] ??= { current: initial }; },
    useMemo(compute) { index++; return compute(); },
    useTransition: () => [false, callback => callback()],
    useEffect(callback, deps) { const slot = index++; const previous = slots[slot];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) effects.push(() => { previous?.cleanup?.(); slots[slot] = { deps, cleanup: callback() }; }); },
  };
  function load(relative) {
    if (modules.has(relative)) return modules.get(relative).exports;
    const source = readFileSync(new URL(relative, root), "utf8");
    const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const module = { exports: {} }; modules.set(relative, module);
    vm.runInNewContext(compiled, { module, exports: module.exports, Date, URL, URLSearchParams, Map, Error, Array, window: browser,
      fetch: (url, options) => { const request = deferred(); calls.push({ url, options, ...request }); return request.promise; },
      require(id) {
        if (id === "react") return react;
        if (id === "react/jsx-runtime") return require(id);
        if (id === "next/navigation") return { useRouter: () => ({ replace: (...args) => routerCalls.push(args) }) };
        if (id.includes("calendar-area-types")) return { filterCalendarEventsByAreas: items => items };
        if (id.startsWith("@/") && !id.includes("/views/") && !id.includes("/components/") && !id.includes("family-calendar-event")) return load(`${id.slice(2)}.ts`);
        return new Proxy({}, { get: (_, name) => String(name) });
      },
    });
    return module.exports;
  }
  const exports = load(kind === "dashboard" ? "modules/dashboard/views/dashboard-calendar-client.tsx" : "modules/family-dashboard/views/family-calendar-client.tsx");
  const Provider = exports[kind === "dashboard" ? "DashboardCalendarClientProvider" : "FamilyCalendarClientProvider"];
  props = { initialEvents: [event("initial")], initialUpcomingEvents: [event("upcoming")], initialDateCursor: "2026-10-30", initialViewMode: "day", users: [], viewer: { name: "Family", email: "family@example.test" }, children: null };
  function render() { index = 0; tree = Provider(props); const pending = effects; effects = []; pending.forEach(effect => effect()); return tree; }
  render(); render();
  return {
    calls, routerCalls, browser, render,
    get context() { render(); return tree.props.value; },
    get tree() { return render(); },
    async settle() { for (let i = 0; i < 12; i++) await Promise.resolve(); render(); },
    refresh(changes) { props = { ...props, ...changes }; render(); render(); },
    pop(direction) { position += direction; browser.location = new URL(entries[position]); listeners.get("popstate")?.(); render(); },
  };
}
const cursor = (day) => new Date(2026, 9, day, 12);
function findElement(node, predicate) {
  if (!node || typeof node !== "object") return undefined;
  if (predicate(node)) return node;
  const children = Array.isArray(node.props?.children) ? node.props.children : [node.props?.children];
  for (const child of children.flat(Infinity)) { const found = findElement(child, predicate); if (found) return found; }
}

for (const kind of ["dashboard", "family"]) {
  test(`${kind}: SSR/cache hits make no request; uncached range makes one API request and no RSC navigation`, async () => {
    const app = mount(kind);
    assert.equal(app.context.events[0].id, "initial");
    assert.equal(app.calls.length, 0);
    app.context.navigate(cursor(30), "day");
    assert.equal(app.calls.length, 0, "initial range is seeded");
    app.context.navigate(cursor(31), "day");
    assert.equal(app.calls.length, 1);
    assert.match(app.calls[0].url, /date=2026-10-31&view=day/);
    assert.equal(app.calls[0].options.cache, "no-store");
    assert.equal(app.context.events.length, 0, "old range is not presented as the new range");
    app.calls[0].resolve(response([event("next")])); await app.settle();
    assert.equal(app.context.events[0].id, "next");
    app.context.navigate(cursor(30), "day"); app.context.navigate(cursor(31), "day");
    assert.equal(app.calls.length, 1);
    assert.equal(app.context.events[0].id, "next");
    assert.equal(app.browser.location.searchParams.get("filter"), "area");
    assert.equal(app.browser.location.hash, "#calendar");
    assert.equal(app.browser.canonicalUrl, app.browser.location.href, "a later Next refresh targets the visible range");
    assert.deepEqual(app.routerCalls, []);
  });

  test(`${kind}: back/forward restores cursor, view, event URL and unrelated query`, async () => {
    const selection = kind === "dashboard" ? "edit" : "event";
    const app = mount(kind, `?date=2026-10-30&view=day&${selection}=initial&filter=area`);
    app.refresh({ initialSelectedEventId: "initial" });
    app.context.navigate(cursor(31), "week");
    app.calls[0].resolve(response([event("other")])); await app.settle();
    app.pop(-1);
    assert.equal(app.context.dateCursor.getDate(), 30);
    assert.equal(app.context.viewMode, "day");
    assert.equal(app.context.selectedEventId, "initial");
    assert.equal(app.context.events[0].id, "initial");
    app.pop(1);
    assert.equal(app.context.dateCursor.getDate(), 31);
    assert.equal(app.context.viewMode, "week");
    assert.equal(app.context.selectedEventId, undefined);
    assert.equal(app.context.events[0].id, "other");
    assert.equal(app.browser.location.searchParams.get("filter"), "area");
    assert.equal(app.calls.length, 1);
    app.context.selectEvent("other");
    assert.equal(app.browser.location.searchParams.get(selection), "other");
    if (kind === "dashboard") app.context.clearSelectedEvent();
    else findElement(app.tree, node => node.type === "FamilyEventDetailDialog").props.onOpenChange(false);
    assert.equal(app.browser.location.searchParams.has(selection), false);
    assert.deepEqual(app.routerCalls, []);
  });

  test(`${kind}: rapid changes deduplicate in-flight ranges and ignore late responses`, async () => {
    const app = mount(kind);
    app.context.navigate(cursor(29), "day");
    app.context.navigate(cursor(31), "day");
    app.context.navigate(cursor(29), "day");
    assert.equal(app.calls.length, 2);
    app.calls[1].resolve(response([event("stale")])); await app.settle();
    assert.equal(app.context.events.length, 0);
    app.calls[0].resolve(response([event("current")])); await app.settle();
    assert.equal(app.context.events[0].id, "current");
    app.context.navigate(cursor(30), "day");
    assert.equal(app.context.events[0].id, "initial");
  });

  test(`${kind}: HTTP, network and malformed payload errors expose retry without caching a failure`, async () => {
    for (const failure of ["http", "network", "payload"]) {
      const app = mount(kind);
      app.context.navigate(cursor(31), "day");
      if (failure === "network") app.calls[0].reject(new Error("offline"));
      else app.calls[0].resolve(failure === "http" ? { ok: false, status: 503 } : { ok: true, json: async () => ({}) });
      await app.settle();
      const alert = findElement(app.tree, node => node.props.role === "alert");
      assert.ok(alert, `${failure} error is visible`);
      const retry = findElement(alert, node => node.type === "button");
      assert.equal(retry.props.children, "Reintentar");
      retry.props.onClick();
      assert.equal(app.calls.length, 2);
      app.calls[1].resolve(response([event("recovered")])); await app.settle();
      assert.equal(app.context.events[0].id, "recovered");
      assert.equal(findElement(app.tree, node => node.props.role === "alert"), undefined);
      app.context.navigate(cursor(30), "day");
      assert.equal(app.context.events[0].id, "initial");
      assert.deepEqual(app.routerCalls, []);
    }
  });

  test(`${kind}: server refresh replaces current and upcoming data, invalidates other ranges and late work`, async () => {
    const app = mount(kind);
    app.context.navigate(cursor(29), "day");
    app.calls[0].resolve(response([event("old-cached")])); await app.settle();
    app.context.navigate(cursor(31), "day");
    app.refresh({ initialEvents: [event("saved")], initialUpcomingEvents: [event("saved-upcoming")], initialDateCursor: "2026-10-31" });
    app.calls[1].resolve(response([event("pre-mutation")])); await app.settle();
    assert.equal(app.context.events[0].id, "saved");
    assert.equal(app.context.upcomingEvents[0].id, "saved-upcoming");
    app.context.navigate(cursor(31), "day");
    assert.equal(app.calls.length, 2);
    assert.equal(app.context.events[0].id, "saved");
    app.context.navigate(cursor(29), "day");
    assert.equal(app.calls.length, 3, "old ranges were invalidated");
    app.calls[2].resolve(response([event("fresh")])); await app.settle();
    assert.equal(app.context.events[0].id, "fresh");
    assert.deepEqual(app.routerCalls, []);
  });
}

test("family: mutation refresh displays new modal feedback without remounting", () => {
  const app = mount("family");
  app.context.selectEvent("initial");
  app.refresh({ initialEvents: [event("initial")], initialSelectedEventId: "initial", initialFeedback: { ok: "attendance_updated" } });
  const dialog = findElement(app.tree, node => node.type === "FamilyEventDetailDialog");
  assert.equal(dialog.props.open, true);
  assert.equal(dialog.props.feedback?.ok, "attendance_updated");
  assert.equal(app.calls.length, 0);
});

for (const kind of ["dashboard", "family"]) {
  test(`${kind}: civil initial/cache/request cursors survive UTC, Argentina and Tokyo`, async () => {
    const oldZone = process.env.TZ;
    try {
      for (const zone of ["UTC", "America/Argentina/Buenos_Aires", "Asia/Tokyo"]) {
        process.env.TZ = zone;
        const app = mount(kind);
        assert.equal(app.context.dateCursor.getDate(), 30);
        assert.equal(app.context.dateCursor.getHours(), 12);
        app.context.navigate(cursor(30), "day");
        assert.equal(app.calls.length, 0);
        app.context.navigate(cursor(31), "day");
        assert.match(app.calls[0].url, /date=2026-10-31&view=day/);
        app.calls[0].resolve(response([])); await app.settle();
        assert.equal(app.browser.location.searchParams.get("date"), "2026-10-31");
        app.context.navigate(cursor(30), "day");
        assert.equal(app.context.events[0].id, "initial");
      }
    } finally {
      if (oldZone === undefined) delete process.env.TZ;
      else process.env.TZ = oldZone;
    }
  });
}

test("family: selected event still opens the existing modal with a civil return URL", () => {
  const app = mount("family");
  app.context.selectEvent("initial");
  const dialog = findElement(app.tree, node => node.type === "FamilyEventDetailDialog");
  assert.equal(dialog.props.open, true);
  assert.equal(dialog.props.event.id, "initial");
  assert.match(dialog.props.returnTo, /date=2026-10-30&view=day.*event=initial/);
  assert.equal(app.calls.length, 0);
  assert.deepEqual(app.routerCalls, []);
});
