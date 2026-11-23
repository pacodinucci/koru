import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import React from "react";
import ts from "typescript";

const require = createRequire(import.meta.url);
function harness(extra = {}) {
  let search = "";
  const mocks = { react: { ...React, useState: () => [search, (value) => { search = value; }] } };
  for (const [module, names] of Object.entries({ card: ["Card", "CardContent"], input: ["Input"], table: ["Table", "TableHeader", "TableBody", "TableRow", "TableHead", "TableCell"] })) {
    mocks[`@/components/ui/${module}`] = Object.fromEntries(names.map((name) => [name, () => null]));
  }
  const source = readFileSync("src/modules/dashboard/components/dashboard-searchable-table.tsx", "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(output, { module: loaded, exports: loaded.exports, require: (id) => mocks[id] ?? require(id) });
  const action = () => {};
  const rows = [
    { id: "a", searchText: "Ana Pérez", content: React.createElement("tr", null, React.createElement("td", null, React.createElement("form", { action }, "Ana"))), mobileContent: React.createElement("article", null, "Ana") },
    { id: "b", searchText: "Juan Gómez", content: React.createElement("tr", null, React.createElement("td", null, "Juan")), mobileContent: React.createElement("article", null, "Juan") },
  ];
  function find(predicate, node) {
    if (!React.isValidElement(node)) return [];
    return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap((child) => find(predicate, child))];
  }
  const render = () => loaded.exports.DashboardSearchableTable({ searchId: "sample-search", searchPlaceholder: "Buscar por nombre", header: React.createElement("thead", null), rows, columnCount: 1, emptyMessage: "Sin registros.", tableClassName: "min-w-[800px]", ...extra });
  return { render, find, mocks, rows, action };
}

test("listing search sits above a compact white table and preserves server-rendered actions", () => {
  const h = harness(); const tree = h.render();
  const input = h.find((node) => node.type === h.mocks["@/components/ui/input"].Input, tree)[0];
  assert.equal(input.props.id, "sample-search"); assert.equal(input.props.type, "search");
  assert.equal(h.find((node) => node.type === "label" && node.props.htmlFor === input.props.id && node.props.children === "Buscar", tree).length, 1);
  const card = h.find((node) => node.type === h.mocks["@/components/ui/card"].Card, tree)[0];
  assert.equal(card.props.size, "sm"); assert.match(card.props.className, /bg-white/);
  assert.equal(h.find((node) => node.type === h.mocks["@/components/ui/input"].Input, card).length, 0);
  assert.equal(h.find((node) => node.type === "form", tree)[0].props.action, h.action);
  assert.equal(h.find((node) => node.type === h.mocks["@/components/ui/table"].Table, tree)[0].props.className, "min-w-[800px]");
});

test("live search trims input, ignores case, filters desktop and mobile rows and restores all rows", () => {
  const h = harness(); let tree = h.render();
  const input = () => h.find((node) => node.type === h.mocks["@/components/ui/input"].Input, tree)[0];
  input().props.onChange({ target: { value: " ANA " } }); tree = h.render();
  assert.equal(h.find((node) => node.type === "tr", tree).length, 1);
  assert.equal(h.find((node) => node.type === "article", tree).length, 1);
  assert.equal(h.find((node) => node.type === "article", tree)[0].props.children, "Ana");
  input().props.onChange({ target: { value: "" } }); tree = h.render();
  assert.equal(h.find((node) => node.type === "tr", tree).length, 2);
});

test("search exposes no-results separately from an empty dataset, with correct column span", () => {
  const h = harness(); let tree = h.render();
  h.find((node) => node.type === h.mocks["@/components/ui/input"].Input, tree)[0].props.onChange({ target: { value: "nadie" } }); tree = h.render();
  const cell = h.find((node) => node.type === h.mocks["@/components/ui/table"].TableCell, tree)[0];
  assert.equal(cell.props.colSpan, 1); assert.equal(cell.props.children, "No encontramos resultados para esta búsqueda.");
  const empty = harness({ rows: [] });
  assert.equal(empty.find((node) => node.type === empty.mocks["@/components/ui/table"].TableCell, empty.render())[0].props.children, "Sin registros.");
});
