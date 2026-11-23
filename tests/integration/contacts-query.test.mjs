import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function harness(query = "source=contact&status=NEW&page=2") {
  const output = ts.transpileModule(readFileSync("src/modules/contacts/views/contacts-query.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, { module: mod, exports: mod.exports, URLSearchParams, AbortController, Error, setTimeout, clearTimeout, require });
  const requests = [], navigation = [], timers = new Map();
  let time = 0, id = 0;
  const model = new mod.exports.ContactsQuery(query, {
    fetch: (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })),
    navigate: (query, replace) => navigation.push({ query, replace }),
    schedule: (fn, ms) => { timers.set(++id, { fn, at: time + ms }); return id; },
    cancel: (id) => timers.delete(id),
  });
  const tick = (ms) => { time += ms; for (const [id, timer] of timers) if (timer.at <= time) { timers.delete(id); timer.fn(); } };
  const success = async (index, name = `Person ${index}`, total = 25) => {
    requests[index].resolve({ ok: true, json: async () => ({ items: [{ id: name, name }], total, page: Number(new URL(requests[index].url, "https://test.local").searchParams.get("page") || 1), pageSize: 10 }) });
    await new Promise(setImmediate);
  };
  return { model, requests, navigation, tick, success, timers };
}

test("Zustand subscribers share search, filters, results and cache across list remounts", async () => {
  const h = harness("");
  assert.equal(typeof h.model.store.getState, "function");
  const observed = [];
  const unsubscribe = h.model.store.subscribe((state) => observed.push(state));
  h.model.start(); await h.success(0, "Shared");
  assert.equal(h.model.store.getState().page.items[0].name, "Shared");
  assert.equal(h.model.store.getState().cache.size, 1);
  h.model.search("Draft");
  assert.equal(observed.at(-1).search, "Draft");
  h.model.pause(); h.tick(300);
  assert.equal(h.navigation.length, 0);
  assert.equal(h.model.store.getState().search, "");
  h.model.start("");
  assert.equal(h.model.store.getState().page.items[0].name, "Shared");
  assert.equal(h.model.store.getState().updating, true);
  assert.equal(h.model.store.getState().stale, false);
  assert.equal(h.requests.length, 2);
  h.model.stop();
  assert.equal(h.model.store.getState().page, null);
  assert.equal(h.model.store.getState().cache.size, 0);
  assert.equal(h.requests[1].options.signal.aborted, true);
  unsubscribe();
});

test("dashboard stores are isolated, including cached contacts and in-flight requests", async () => {
  const first = harness(""); const second = harness("");
  first.model.start(); await first.success(0, "First dashboard");
  assert.equal(second.model.store.getState().page, null);
  assert.equal(second.model.store.getState().cache.size, 0);
  second.model.start(); await second.success(0, "Second dashboard");
  first.model.stop();
  assert.equal(first.model.store.getState().page, null);
  assert.equal(second.model.store.getState().page.items[0].name, "Second dashboard");
  second.model.stop();
});

test("search is immediate locally, debounced 300ms, bounded and replaces history; clear retains filters", async () => {
  const h = harness(); h.model.start(); await h.success(0);
  h.model.search("An"); h.tick(200); h.model.search("Ana@example.com");
  assert.equal(h.model.getSnapshot().search, "Ana@example.com");
  h.tick(299); assert.equal(h.requests.length, 1);
  h.tick(1); assert.equal(h.requests.length, 2);
  assert.equal(h.navigation[0].replace, true);
  let params = new URLSearchParams(h.navigation[0].query);
  assert.equal(params.get("q"), "Ana@example.com"); assert.equal(params.get("page"), null);
  assert.equal(params.get("source"), "contact"); assert.equal(params.get("status"), "NEW");
  h.model.search(""); h.tick(300);
  assert.equal(new URLSearchParams(h.navigation[1].query).get("q"), null);
  h.model.search("x".repeat(250)); assert.equal(h.model.getSnapshot().search.length, 200);
  h.model.stop();
});

test("filters include latest draft, cancel debounce and preserve other filters", () => {
  const h = harness(); h.model.start(); h.model.search("Ana"); h.model.filter("source", "admission"); h.tick(300);
  assert.equal(h.requests.length, 2); assert.equal(h.navigation.length, 1);
  const params = new URLSearchParams(h.navigation[0].query);
  assert.equal(params.get("q"), "Ana"); assert.equal(params.get("source"), "admission"); assert.equal(params.get("status"), "NEW"); assert.equal(params.has("page"), false);
  h.model.filter("status", ""); assert.equal(new URLSearchParams(h.navigation[1].query).has("status"), false);
  h.model.stop();
});

test("updates retain rows/count/page, mark stale and ignore aborted late successes and errors", async () => {
  const h = harness(); h.model.start(); await h.success(0, "Original");
  h.model.filter("status", "READ");
  assert.equal(h.model.getSnapshot().page.items[0].name, "Original");
  assert.equal(h.model.getSnapshot().page.page, 2); assert.equal(h.model.getSnapshot().stale, true); assert.equal(h.model.getSnapshot().updating, true);
  h.model.filter("status", "REPLIED"); assert.equal(h.requests[1].options.signal.aborted, true);
  await h.success(2, "Latest", 1); await h.success(1, "Obsolete");
  assert.equal(h.model.getSnapshot().page.items[0].name, "Latest"); assert.equal(h.model.getSnapshot().page.total, 1); assert.equal(h.model.getSnapshot().stale, false);
  h.model.filter("status", "NEW"); h.model.filter("status", "READ"); h.requests[3].reject(new Error("old failure")); await h.success(4, "Newest");
  assert.equal(h.model.getSnapshot().error, ""); assert.equal(h.model.getSnapshot().page.items[0].name, "Newest"); h.model.stop();
});

test("cache restores immediately, revalidates, is LRU bounded at 20 and is discarded on stop", async () => {
  const h = harness(""); h.model.start(); await h.success(0, "Initial");
  for (let i = 1; i <= 19; i++) { h.model.search(String(i)); h.tick(300); await h.success(i); }
  h.model.sync(""); assert.equal(h.model.getSnapshot().page.items[0].name, "Initial"); assert.equal(h.model.getSnapshot().stale, false); assert.equal(h.model.getSnapshot().updating, true); await h.success(20, "Refreshed");
  h.model.search("20"); h.tick(300); await h.success(21);
  h.model.sync("q=1"); assert.equal(h.model.getSnapshot().stale, true); await h.success(22);
  h.model.sync(""); assert.equal(h.model.getSnapshot().page.items[0].name, "Refreshed");
  h.model.stop(); h.model.start(); h.model.sync("q=1"); assert.equal(h.model.getSnapshot().stale, true); h.model.stop();
});

test("failure keeps previous results, retry targets current query; initial failure and empty success work", async () => {
  const h = harness(""); h.model.start(); h.requests[0].reject(new Error("Unavailable")); await new Promise(setImmediate);
  assert.equal(h.model.getSnapshot().page, null); assert.equal(h.model.getSnapshot().error, "Unavailable"); assert.equal(h.model.getSnapshot().updating, false);
  h.model.retry(); await h.success(1, "Original"); h.model.filter("source", "admission");
  h.requests[2].resolve({ ok: false, json: async () => ({ error: "Try later" }) }); await new Promise(setImmediate);
  assert.equal(h.model.getSnapshot().page.items[0].name, "Original"); assert.equal(h.model.getSnapshot().error, "Try later"); assert.equal(h.model.getSnapshot().stale, true);
  h.model.retry(); assert.equal(h.requests[3].url, h.requests[2].url);
  h.requests[3].resolve({ ok: true, json: async () => ({ items: [], total: 0, page: 1, pageSize: 10 }) }); await new Promise(setImmediate);
  assert.equal(h.model.getSnapshot().page.items.length, 0); assert.equal(h.model.getSnapshot().error, ""); h.model.stop();
});

test("URL navigation restores controls and cancels typing; stale pagination cannot navigate", async () => {
  const h = harness("q=Ana&page=2"); h.model.start(); await h.success(0);
  h.model.search("Pending"); h.model.sync("q=Back&source=admission&page=3"); h.tick(300);
  assert.equal(h.model.getSnapshot().search, "Back"); assert.equal(h.navigation.length, 0);
  h.model.paginate(4); assert.equal(h.navigation.length, 0);
  await h.success(1); h.model.paginate(2);
  assert.equal(new URLSearchParams(h.navigation[0].query).get("page"), "2"); assert.equal(new URLSearchParams(h.navigation[0].query).get("q"), "Back");
  h.model.search("Unused"); h.model.stop(); h.tick(300); assert.equal(h.navigation.length, 1); assert.equal(h.requests.at(-1).options.signal.aborted, true);
});

// S2–S4: navigation, ordering, stale pagination, retry, and clearing.
test("late success cannot clear current error; navigation owns query", async () => {
  const h = harness("q=First&page=2");
  h.model.start();
  await h.success(0, "Prior");
  h.model.filter("status", "READ");
  h.model.search("draft");
  h.model.sync("q=Back&source=contact&page=3");
  h.tick(300);
  assert.equal(h.navigation.length, 1);
  assert.equal(h.requests.length, 3);
  assert.equal(h.model.getSnapshot().search, "Back");
  assert.equal(h.requests[1].options.signal.aborted, true);
  h.requests[2].reject(new Error("current failure"));
  await new Promise(setImmediate);
  await h.success(1, "late");
  assert.equal(h.model.getSnapshot().error, "current failure");
  assert.equal(h.model.getSnapshot().page.items[0].name, "Prior");
  h.model.paginate(4);
  assert.equal(h.requests.length, 3);
  h.model.retry();
  assert.equal(h.requests[3].url, h.requests[2].url);
  await h.success(3, "Back", 31);
  assert.equal(h.model.getSnapshot().page.page, 3);
  assert.equal(h.model.getSnapshot().page.total, 31);
  h.model.search("");
  h.tick(299);
  assert.equal(h.requests.length, 4);
  h.tick(1);
  assert.equal(h.requests[4].url, "/api/dashboard/contacts?source=contact");
  assert.equal(h.navigation.at(-1).replace, true);
  h.model.stop();
});

// S3: bounded LRU, promotion, and cancellation on unmount.
test("LRU promotes hits and unmount rejects completion", async () => {
  const h = harness("");
  h.model.start();
  await h.success(0, "zero");
  for (let i = 1; i < 20; i++) {
    h.model.sync("q=" + i);
    await h.success(i, "row" + i);
  }
  h.model.sync("");
  assert.equal(h.model.getSnapshot().page.items[0].name, "zero");
  await h.success(20, "zero");
  h.model.sync("q=20");
  await h.success(21, "twenty");
  h.model.sync("q=1");
  assert.equal(h.model.getSnapshot().stale, true);
  h.model.sync("q=2");
  assert.equal(h.model.getSnapshot().page.items[0].name, "row2");
  h.model.search("pending");
  h.model.stop();
  const stopped = h.model.getSnapshot();
  h.tick(300);
  await h.success(23, "after stop");
  assert.equal(h.model.getSnapshot(), stopped);
  assert.equal(h.requests.length, 24);
});

// S3: initial failure and failed cached revalidation.
test("initial failure and cached refresh failure remain explicit", async () => {
  const h = harness("status=NEW");
  h.model.start();
  h.requests[0].resolve({ ok: false, json: async () => ({ error: "Denied" }) });
  await new Promise(setImmediate);
  assert.equal(h.model.getSnapshot().page, null);
  assert.equal(h.model.getSnapshot().error, "Denied");
  h.model.retry();
  await h.success(1, "saved");
  h.model.filter("status", "READ");
  await h.success(2, "read");
  h.model.sync("status=NEW");
  assert.equal(h.model.getSnapshot().page.items[0].name, "saved");
  h.requests[3].reject(new Error("Refresh failed"));
  await new Promise(setImmediate);
  assert.equal(h.model.getSnapshot().error, "Refresh failed");
  assert.equal(h.model.getSnapshot().updating, false);
  assert.equal(h.model.getSnapshot().page.items[0].name, "saved");
  h.model.stop();
});

// S3/S4/S6: effect cleanup/restart, URL ownership and late-result rejection.
test("effect replay and remount retain URL ownership and reject late results", async () => {
  const h = harness("");
  const query = "q=Ana%40example.com&source=admission&status=READ&page=3";
  h.model.start(query); h.model.pause(); h.model.stop();
  h.model.start(query); h.model.sync(query);
  assert.equal(h.requests.length, 2);
  assert.equal(h.requests[0].options.signal.aborted, true);
  await h.success(1, "current", 31);
  const current = h.model.store.getState();
  await h.success(0, "cancelled", 99);
  assert.equal(h.model.store.getState(), current);
  assert.equal(current.page.page, 3);
  assert.equal(current.search, "Ana@example.com");
  assert.equal(current.cache.size, 1);
  h.model.search("never sent"); h.model.pause();
  h.model.start("source=contact"); h.tick(300);
  assert.equal(h.navigation.length, 0);
  assert.equal(h.requests.length, 3);
  assert.equal(h.requests[2].url, "/api/dashboard/contacts?source=contact");
  assert.equal(h.model.getSnapshot().search, "");
  assert.equal(h.model.getSnapshot().stale, true);
  assert.equal(h.model.getSnapshot().page.page, 3);
  h.model.paginate(4); assert.equal(h.requests.length, 3);
  await h.success(2, "other", 1);
  h.model.pause(); h.model.start(query);
  assert.equal(h.model.getSnapshot().page.items[0].name, "current");
  assert.equal(h.model.getSnapshot().page.total, 31);
  assert.equal(h.model.getSnapshot().stale, false);
  h.model.stop();
  const stopped = h.model.getSnapshot();
  h.requests[3].reject(new Error("late failure"));
  await new Promise(setImmediate);
  assert.equal(h.model.getSnapshot(), stopped);
});
