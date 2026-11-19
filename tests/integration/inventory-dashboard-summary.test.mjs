import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);

/**
 * The stock listing now renders through the shared DashboardSearchableTable. Load the real
 * component (real React hooks/renderer) so the listing slots still reach the markup instead
 * of being swallowed by the primitive UI stand-in below.
 */
function loadSearchableTable(primitive) {
  const source = readFileSync(new URL("../../src/modules/dashboard/components/dashboard-searchable-table.tsx", import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(output, { module: loaded, exports: loaded.exports, require: (id) => {
    if (id.startsWith("@/components/ui/")) return new Proxy({}, { get: () => primitive });
    if (id === "react" || id === "react/jsx-runtime") return require(id);
    throw Error(`Unexpected dependency ${id}`);
  } });
  return loaded.exports;
}

async function renderInventory() {
  const source = readFileSync(new URL("../../src/modules/operations/views/inventory-dashboard-view.tsx", import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const primitive = ({ children }) => React.createElement("div", null, children);
  const product = { id: "p1", name: "Lápiz negro", unit: "unidad", stock: 24, minimumStock: 30 };
  const viewModule = { exports: {} };
  const mocks = {
    "@/lib/prisma": { prisma: { teacherProfile: { findUnique: async () => null } } },
    "@/modules/dashboard/components/dashboard-searchable-table": loadSearchableTable(primitive),
    "@/modules/operations/server/inventory.repository": {
      listInventoryProductsWithStock: async () => [product],
      listInventoryProductsBelowMinimum: async () => [product],
      listInventoryRequestsForReview: async () => [],
      listInventoryMovementsForAdmin: async () => [],
    },
    "@/modules/operations/server/inventory.actions": {},
    "@/modules/operations/components/inventory-admin-actions": {
      InventoryAdminActions: () => React.createElement("button", null, "Registrar ingreso"),
    },
  };
  vm.runInNewContext(output, { module: viewModule, exports: viewModule.exports, require: (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === "react/jsx-runtime") return require(id);
    if (id.startsWith("@/components/ui/") || id.startsWith("@/modules/operations/components/")) {
      return new Proxy({}, { get: () => primitive });
    }
    throw Error(`Unexpected dependency ${id}`);
  } });
  const tree = await viewModule.exports.InventoryDashboardView({ user: {
    id: "operator", role: "SUPER_ADMIN", permissionKeys: ["inventory.operate", "inventory.configure"],
  } });
  return renderToStaticMarkup(tree);
}

test("inventory header omits aggregate stock and product counters", async () => {
  const html = await renderInventory();
  const summary = html.slice(html.indexOf("</header>") + "</header>".length, html.indexOf("Stock por producto"));
  assert.doesNotMatch(summary, /Stock disponible/);
  assert.doesNotMatch(summary, /Productos registrados/);
  assert.match(summary, /Alertas de stock/);
  assert.match(summary, /Solicitudes pendientes/);
  assert.match(summary, /Registrar ingreso/);
});

test("individual stock, minimums and alerts remain visible", async () => {
  const html = await renderInventory();
  assert.match(html, /Stock por producto/);
  assert.match(html, /Lápiz negro/);
  assert.match(html, /24 unidad/);
  assert.match(html, /Mínimo esperado/);
  assert.match(html, /Requiere reposición/);
});
