import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useStore } from "zustand";

const require = createRequire(import.meta.url);
function loadProvider(react = React, extra = {}) {
  function compile(file, mocks = {}) {
    const output = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const mod = { exports: {} };
    vm.runInNewContext(output, { module: mod, exports: mod.exports, URLSearchParams, AbortController, Error, setTimeout, clearTimeout, ...extra, require: (id) => mocks[id] ?? require(id) });
    return mod.exports;
  }
  const model = compile("src/modules/contacts/views/contacts-query.ts");
  return compile("src/modules/contacts/views/contacts-store-provider.tsx", { react, "./contacts-query": model });
}

test("dashboard provider shares a real Zustand store across consumers, but not SSR trees", () => {
  const { ContactsStoreProvider, useContactsModel } = loadProvider();
  const models = [];
  function Consumer() {
    const model = useContactsModel();
    models.push(model);
    const page = useStore(model.store, (state) => state.page);
    return React.createElement("span", null, page ? "loaded" : "empty");
  }
  const render = () => renderToStaticMarkup(React.createElement(ContactsStoreProvider, null, React.createElement(Consumer), React.createElement(Consumer)));
  assert.equal(render(), "<span>empty</span><span>empty</span>");
  assert.equal(models[0], models[1]);
  assert.equal(render(), "<span>empty</span><span>empty</span>");
  assert.equal(models[2], models[3]);
  assert.notEqual(models[0], models[2]);
  assert.notEqual(models[0].store, models[2].store);
});

test("dashboard cleanup resets data, cancels pending work and rejects late completion", async () => {
  const cleanups = [], requests = [];
  const { ContactsStoreProvider } = loadProvider({ ...React,
    useState: (initial) => [initial(), () => {}],
    useEffect: (effect) => cleanups.push(effect()),
  }, { fetch: (url, options) => new Promise((resolve) => requests.push({ url, options, resolve })) });
  const tree = ContactsStoreProvider({ children: null });
  const model = tree.props.value;
  model.start();
  requests[0].resolve({ ok: true, json: async () => ({ items: [{ id: "private", name: "Private" }], total: 1, page: 1, pageSize: 20 }) });
  await new Promise(setImmediate);
  assert.equal(model.store.getState().page.total, 1);
  model.retry();
  model.search("pending");
  cleanups[0]();
  assert.equal(requests[1].options.signal.aborted, true);
  assert.equal(model.store.getState().cache.size, 0);
  assert.equal(model.store.getState().page, null);
  const stopped = model.store.getState();
  requests[1].resolve({ ok: true, json: async () => ({ items: [{ id: "late" }], total: 1, page: 1, pageSize: 20 }) });
  await new Promise(setImmediate);
  assert.equal(model.store.getState(), stopped);
});
