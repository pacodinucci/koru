import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
function harness(query = "q=Ana&source=contact&status=NEW&page=2") {
  const pushes = [];
  const params = new URLSearchParams(query);
  const page = { total: 25, page: 2, pageSize: 10, items: [{ id: "one", source: "contact", name: "Ana", email: "ana@example.com", phone: null, receivedAt: "2026-01-01T12:00:00Z", status: "NEW" }] };
  const calls = [];
  const snapshot = { query, search: params.get("q") ?? "", resultQuery: query, page, error: "", updating: false, stale: false };
  class ContactsQuery {
    store = { getState: () => snapshot };
    filter = (...args) => calls.push(["filter", ...args]);
    search = (...args) => calls.push(["search", ...args]);
    paginate = (...args) => calls.push(["paginate", ...args]);
    retry = () => calls.push(["retry"]);
  }
  const component = (tag) => function MockComponent({ children, render, ...props }) {
    delete props.variant;
    delete props.size;
    delete props.onValueChange;
    return render ? React.cloneElement(render, props, children) : React.createElement(tag, props, children);
  };
  const mocks = {
    react: { ...React, useEffect: () => {} },
    zustand: { useStore: (store) => store.getState() },
    "./contacts-store-provider": { useContactsModel: () => new ContactsQuery() },
    "next/link": { __esModule: true, default: component("a") },
    "next/navigation": { useSearchParams: () => params, usePathname: () => "/dashboard/contactos", useRouter: () => ({ push: (url) => pushes.push(url) }) },
    "../contacts.domain": { SOURCE_LABELS: { contact: "Formulario de contacto", admission: "Cuestionario inicial" }, STATUS_LABELS: { NEW: "Nuevo", READ: "Leído", REPLIED: "Respondido" } },
    "@/components/ui/button": { Button: component("button") },
    "@/components/ui/input": { Input: component("input") },
    "@/components/ui/badge": { Badge: component("span") },
    "@/components/ui/tabs": { Tabs: component("div"), TabsList: component("div"), TabsTrigger: component("button") },
    "@/components/ui/table": Object.fromEntries(Object.entries({ Table: "table", TableHeader: "thead", TableBody: "tbody", TableRow: "tr", TableHead: "th", TableCell: "td" }).map(([name, tag]) => [name, component(tag)])),
  };
  const output = ts.transpileModule(readFileSync("src/modules/contacts/views/contacts-list.tsx", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, { module: mod, exports: mod.exports, URLSearchParams, FormData: class { constructor(form) { return new Map(form); } }, AbortController, require: (id) => mocks[id] ?? require(id) });
  const tree = mod.exports.ContactsList();
  function find(predicate, node = tree) {
    if (!React.isValidElement(node)) return [];
    return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap((child) => find(predicate, child)), ...(node.props.render ? find(predicate, node.props.render) : [])];
  }
  return { tree, find, pushes, mocks, calls, snapshot, render: () => mod.exports.ContactsList() };
}

test("contacts use the family table components, compact border and status badges", () => {
  const { tree, find, mocks } = harness();
  assert.equal(find((node) => node.type === mocks["@/components/ui/table"].Table).length, 1);
  assert.equal(find((node) => node.type === mocks["@/components/ui/badge"].Badge).length, 1);
  const html = renderToStaticMarkup(tree);
  assert.match(html, /rounded-xl border border-slate-200/);
  assert.match(html, /Ana/);
  assert.match(html, /ana@example.com/);
  assert.match(html, /Sin teléfono/);
  assert.match(html, /Página 2 de 3/);
  assert.match(html, /contactos\/contact\/one\?q=Ana&amp;source=contact&amp;status=NEW&amp;page=2/);
});

test("segmented source and status filters preserve the other filters and reset pagination", () => {
  const { find, calls, mocks } = harness();
  const tabs = find((node) => node.type === mocks["@/components/ui/tabs"].Tabs);
  assert.equal(tabs.length, 2);
  tabs[0].props.onValueChange("admission");
  tabs[1].props.onValueChange("");
  assert.deepEqual(calls, [["filter", "source", "admission"], ["filter", "status", ""]]);
  assert.equal(find((node) => node.type === "select" && ["source", "status"].includes(node.props.name)).length, 0);
});

test("live search and filters share a wrapping toolbar, without a submit button", () => {
  const { find, calls, mocks } = harness();
  assert.equal(find((node) => node.type === "form").length, 0);
  const toolbar = find((node) => node.props["aria-label"] === "Buscar y filtrar contactos")[0];
  assert.match(toolbar.props.className, /flex flex-wrap/);
  const input = find((node) => node.type === mocks["@/components/ui/input"].Input, toolbar)[0];
  assert.equal(input.props.value, "Ana"); assert.equal(input.props.maxLength, 200);
  input.props.onChange({ target: { value: "María" } });
  assert.deepEqual(calls, [["search", "María"]]);
  assert.equal(find((node) => node.type === mocks["@/components/ui/tabs"].Tabs, toolbar).length, 2);
  const filters = find((node) => node.props["aria-label"] === "Filtros de contactos", toolbar)[0];
  assert.ok(filters, "both filters have a right-aligned group");
  assert.match(filters.props.className, /ml-auto/);
  assert.match(filters.props.className, /justify-end/);
  assert.equal(find((node) => node.type === mocks["@/components/ui/tabs"].Tabs, filters).length, 2);
  const buttons = find((node) => node.type === mocks["@/components/ui/button"].Button);
  assert.equal(buttons.some((node) => node.props.children === "Buscar"), false);
  buttons.find((node) => node.props.children === "Anterior").props.onClick();
  buttons.find((node) => node.props.children === "Siguiente").props.onClick();
  assert.deepEqual(calls.slice(1), [["paginate", 1], ["paginate", 3]]);
});

test("stale updates retain table and detail context, announce activity and disable pagination", () => {
  const h = harness();
  h.snapshot.updating = true; h.snapshot.stale = true; h.snapshot.query = "source=admission";
  const tree = h.render();
  const html = renderToStaticMarkup(tree);
  assert.match(html, /Actualizando…/); assert.match(html, /resultados anteriores/); assert.match(html, /aria-busy="true"/); assert.match(html, /Ana/); assert.doesNotMatch(html, /Cargando contactos/);
  const buttons = h.find((node) => node.type === h.mocks["@/components/ui/button"].Button, tree);
  assert.ok(buttons.filter((node) => ["Anterior", "Siguiente"].includes(node.props.children)).every((node) => node.props.disabled));
  assert.match(html, /contactos\/contact\/one\?q=Ana&amp;source=contact&amp;status=NEW&amp;page=2/);
  h.snapshot.updating = false; h.snapshot.error = "Try again";
  const failure = h.render(); assert.match(renderToStaticMarkup(failure), /role="alert"/);
  assert.match(renderToStaticMarkup(failure), /Ana/);
  h.find((node) => node.props.children === "Reintentar", failure)[0].props.onClick();
  assert.deepEqual(h.calls, [["retry"]]);
});

test("initial loading, initial error and empty results retain accessible states", () => {
  const h = harness(); h.snapshot.page = null; h.snapshot.updating = true;
  assert.match(renderToStaticMarkup(h.render()), /Cargando contactos/);
  h.snapshot.updating = false; h.snapshot.error = "Unavailable";
  let html = renderToStaticMarkup(h.render()); assert.match(html, /Unavailable/); assert.doesNotMatch(html, /Cargando contactos/);
  h.snapshot.error = ""; h.snapshot.page = { items: [], total: 0, page: 1, pageSize: 10 };
  html = renderToStaticMarkup(h.render()); assert.match(html, /No hay contactos para estos filtros/); assert.match(html, /Página 1 de 1/);
});
