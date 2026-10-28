import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

function load(path, mocks) {
  const module = { exports: {} };
  const output = ts.transpileModule(
    readFileSync(new URL(`../../${path}`, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } },
  ).outputText;
  vm.runInNewContext(output, {
    module, exports: module.exports, Date,
    require(id) {
      assert.ok(id in mocks, `Unexpected dependency: ${id}`);
      return mocks[id];
    },
  });
  return module.exports;
}

test("S2: feedback dismissal belongs to one authoritative SSR snapshot", () => {
  let index = 0;
  const slots = [];
  const event = { id: "event" };
  const navigation = {
    dateCursor: new Date(2026, 9, 30, 12), viewMode: "day",
    selectedEventId: "event", events: [event], upcomingEvents: [],
    navigate: () => { navigation.selectedEventId = undefined; },
    selectEvent: id => { navigation.selectedEventId = id; },
    clearSelectedEvent: () => { navigation.selectedEventId = undefined; },
  };
  const jsx = (type, props) => ({ type, props });
  const { FamilyCalendarClientProvider } = load(
    "src/modules/family-dashboard/views/family-calendar-client.tsx",
    {
      "react/jsx-runtime": { jsx, jsxs: jsx },
      react: {
        createContext: () => ({ Provider: "provider" }),
        useContext: () => {},
        useMemo: fn => fn(),
        useState(initial) {
          const slot = index++;
          if (!(slot in slots)) slots[slot] = initial;
          return [slots[slot], value => { slots[slot] = value; }];
        },
      },
      "@/modules/calendar/lib/calendar-range-loader": { useCalendarRange: () => navigation },
      "@/modules/calendar/lib/calendar-navigation": { calendarNavigationUrl: () => "/family-dashboard/calendario" },
      "@/modules/dashboard/lib/calendar-range": {},
      "@/modules/dashboard/views/dashboard-calendar-view": {},
      "@/modules/family-dashboard/components/family-event-detail-dialog": { FamilyEventDetailDialog: "dialog" },
    },
  );
  let props = {
    initialEvents: [event], initialUpcomingEvents: [],
    initialDateCursor: "2026-10-30", initialViewMode: "day",
    initialSelectedEventId: "event", initialFeedback: { ok: "attendance_updated" },
    viewer: { name: "Family", email: "family@example.test" },
  };
  const render = () => { index = 0; return FamilyCalendarClientProvider(props); };
  const dialog = () => render().props.children.flat().find(node => node?.type === "dialog").props;

  assert.equal(dialog().feedback.ok, "attendance_updated");
  render().props.value.selectEvent("event");
  assert.equal(dialog().feedback, undefined);
  props = { ...props, initialFeedback: { ok: "attendance_updated" } };
  assert.equal(dialog().feedback, undefined);
  props = { ...props, initialEvents: [{ ...event }] };
  assert.equal(dialog().feedback.ok, "attendance_updated");
  dialog().onOpenChange(false);
  assert.equal(dialog().open, false);
  props = { ...props, initialFeedback: { error: "attendance_failed" } };
  navigation.selectedEventId = "event";
  assert.equal(dialog().feedback.error, "attendance_failed");
});

test("S3: React cache outside a server dispatcher is not global identity reuse", async () => {
  const { cache } = await import("react");
  let calls = 0;
  const read = cache(async () => ++calls);
  await read();
  await read();
  assert.equal(calls, 2);
});
