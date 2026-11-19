import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import React from "react";

const require = createRequire(import.meta.url);
const ROOT = new URL("../../", import.meta.url);

function loadModule(path, mocks) {
  const source = readFileSync(new URL(path, ROOT), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(output, {
    module: loaded,
    exports: loaded.exports,
    require: (id) => (Object.hasOwn(mocks, id) ? mocks[id] : require(id)),
  });
  return loaded.exports;
}

const cn = (...inputs) => inputs.filter(Boolean).join(" ");
const uiMocks = { "@/lib/utils": { cn } };
const cardModule = loadModule("src/components/ui/card.tsx", uiMocks);
const tableModule = loadModule("src/components/ui/table.tsx", uiMocks);
const badgeModule = loadModule("src/components/ui/badge.tsx", uiMocks);
const inputModule = { Input: (props) => React.createElement("input", props) };
const buttonModule = { Button: (props) => React.createElement("button", null, props.children) };

/** Loads the real shared table component so search state behaves like production. */
function createSearchableTable() {
  const state = { query: "" };
  const loadedModule = loadModule("src/modules/dashboard/components/dashboard-searchable-table.tsx", {
    react: { ...React, useState: () => [state.query, (value) => { state.query = value; }] },
    "@/components/ui/card": cardModule,
    "@/components/ui/input": inputModule,
    "@/components/ui/table": tableModule,
  });
  return { module: loadedModule, state };
}

/**
 * Views render the shared table as one slot. Expanding it keeps a single representation
 * of desktop rows and mobile cards so both can be asserted together.
 */
function expandSearchableTables(node, searchable, extra = []) {
  const types = [searchable.module.DashboardSearchableTable, ...extra];
  if (Array.isArray(node)) return node.map((child) => expandSearchableTables(child, searchable, extra));
  if (!React.isValidElement(node)) return node;
  if (types.includes(node.type)) {
    return expandSearchableTables(node.type(node.props), searchable, extra);
  }
  const children = React.Children.toArray(node.props?.children).map((child) => expandSearchableTables(child, searchable, extra));
  if (!children.length) return node;
  return React.cloneElement(node, undefined, ...children);
}

function findAll(node, predicate, found = []) {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    if (predicate(child)) found.push(child);
    findAll(child.props?.children, predicate, found);
  });
  return found;
}

function flatten(node, found = []) {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    found.push(child);
    flatten(child.props?.children, found);
  });
  return found;
}

function textOf(node) {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement(node)) return textOf(node.props.children);
  return "";
}

const isCard = (node) => node.type === cardModule.Card;
const isTable = (node) => node.type === tableModule.Table;
const isRow = (node) => node.type === tableModule.TableRow;

const tableOf = (tree) => findAll(tree, isTable)[0];
const headerRows = (tree) => findAll(tableOf(tree), isRow).slice(0, 1);
const dataRows = (tree) => findAll(tableOf(tree), isRow).slice(1);
const searchInput = (tree) => findAll(tree, (node) => node.type === inputModule.Input)[0];
const articles = (tree) => findAll(tree, (node) => node.type === "article");
const tableCard = (tree) => findAll(tree, isCard).filter((card) => findAll(card, isTable).length > 0)[0];
const classNames = (tree) => flatten(tree).map((node) => node.props?.className).filter((value) => typeof value === "string");

const baselineProduct = { id: "p1", name: "Lápiz negro", unit: "unidad", stock: 24, minimumStock: 30 };
const healthyProduct = { id: "p2", name: "Goma de borrar", unit: "unidad", stock: 40, minimumStock: 10 };

const adminInventoryUser = {
  id: "operator",
  role: "SUPER_ADMIN",
  permissionKeys: ["inventory.operate", "inventory.configure"],
};
const adminCashFundUser = {
  id: "operator",
  role: "SUPER_ADMIN",
  permissionKeys: ["cash-fund.operate", "cash-fund.configure"],
};

const cashFundGroups = [
  {
    id: "g1",
    name: "Esporas",
    cashFundBudget: { amountPerPeriod: 1500 },
    cashFundEntries: [{ amount: 500 }],
    teacherResponsibilities: [{ teacher: { displayName: "Ana Docente" } }],
    cashExpenseReports: [{ requestedAmount: 200 }],
  },
  {
    id: "g2",
    name: "Helechos",
    cashFundBudget: null,
    cashFundEntries: [{ amount: 120 }],
    teacherResponsibilities: [],
    cashExpenseReports: [],
  },
];

async function renderInventory({ user = adminInventoryUser, products = [baselineProduct, healthyProduct], requests = [], teacherRequests = [], movements = [], searchable }) {
  const editorCalls = [];
  const editorModule = {
    InventoryProductEditor: (props) => {
      editorCalls.push(props);
      return React.createElement("span", null, props.children);
    },
  };
  const view = loadModule("src/modules/operations/views/inventory-dashboard-view.tsx", {
    "@/components/ui/card": cardModule,
    "@/components/ui/table": tableModule,
    "@/components/ui/badge": badgeModule,
    "@/components/ui/button": buttonModule,
    "@/modules/dashboard/components/dashboard-searchable-table": searchable.module,
    "@/lib/prisma": { prisma: { teacherProfile: { findUnique: async () => ({ id: "teacher-1" }) } } },
    "@/modules/operations/server/inventory.repository": {
      listInventoryProductsWithStock: async () => products,
      listInventoryProductsBelowMinimum: async () => products.filter((product) => product.stock <= Number(product.minimumStock)),
      listInventoryRequestsForReview: async () => requests,
      listInventoryMovementsForAdmin: async () => movements,
      listTeacherInventoryRequests: async () => teacherRequests,
    },
    "@/modules/operations/server/inventory.actions": {
      cancelInventoryRequestAction: () => undefined,
      decideInventoryRequestLineAction: () => undefined,
      reverseInventoryMovementAction: () => undefined,
    },
    "@/modules/operations/components/inventory-admin-actions": {
      InventoryAdminActions: () => React.createElement("button", null, "Registrar ingreso"),
    },
    "@/modules/operations/components/inventory-product-editor": editorModule,
    "@/modules/operations/components/inventory-request-form": {
      InventoryRequestForm: () => React.createElement("form", null, "Solicitar productos"),
    },
    "@/modules/operations/components/inventory-request-decision-form": {
      InventoryRequestDecisionForm: () => React.createElement("form", null, "Resolver solicitud"),
    },
  });
  const tree = expandSearchableTables(await view.InventoryDashboardView({ user }), searchable, [editorModule.InventoryProductEditor]);
  return { tree, editorCalls };
}

async function renderCashFund({ user = adminCashFundUser, groups = cashFundGroups, reports = [], teacherGroups = [], teacherReports = [], searchable }) {
  const view = loadModule("src/modules/operations/views/cash-fund-dashboard-view.tsx", {
    "@/components/ui/card": cardModule,
    "@/components/ui/table": tableModule,
    "@/components/ui/badge": badgeModule,
    "@/components/ui/button": buttonModule,
    "@/modules/dashboard/components/dashboard-searchable-table": searchable.module,
    "@/lib/prisma": { prisma: { teacherProfile: { findUnique: async () => ({ id: "teacher-1", isActive: true }) } } },
    "@/modules/operations/server/cash-fund.repository": {
      listCashFundGroupsWithBudget: async () => groups,
      listCashFundConfiguration: async () => ({ renewalFrequency: "MONTHLY" }),
      listCashFundReportsForReview: async () => reports,
      listCashFundCategories: async () => [{ id: "c1", name: "Materiales" }],
      listTeacherCashFundGroups: async () => teacherGroups,
      listTeacherCashExpenseReports: async () => teacherReports,
    },
    "@/modules/operations/server/cash-fund.actions": {
      cancelCashExpenseReportAction: () => undefined,
      decideCashExpenseReportAction: () => undefined,
      submitCashExpenseReportAction: () => undefined,
    },
    "@/modules/operations/components/cash-fund-admin-actions": {
      CashFundAdminActions: () => React.createElement("button", null, "Configurar caja chica"),
    },
    "@/modules/operations/components/cash-expense-attachment-upload": {
      CashExpenseAttachmentUpload: () => null,
    },
  });
  const tree = expandSearchableTables(await view.CashFundDashboardView({ user }), searchable);
  return { tree };
}

function typeSearch(tree, value) {
  searchInput(tree).props.onChange({ target: { value } });
}

test("cash-fund budget listing adds a labelled live search above its white table", async () => {
  const searchable = createSearchableTable();
  const { tree } = await renderCashFund({ searchable });
  const input = searchInput(tree);
  assert.ok(input, "the budget listing must expose a live search input");
  assert.equal(input.props.id, "cash-fund-budget-search");
  assert.equal(input.props.type, "search");
  assert.equal(input.props.placeholder, "Buscar por grupo o docente");
  const labels = findAll(tree, (node) => node.type === "label" && node.props.htmlFor === "cash-fund-budget-search" && node.props.children === "Buscar");
  assert.equal(labels.length, 1, "the search input needs its visible Buscar label");

  const card = tableCard(tree);
  assert.equal(card.props.size, "sm");
  assert.match(String(card.props.className), /bg-white/);
  assert.equal(findAll(card, (node) => node.type === inputModule.Input).length, 0, "the search toolbar stays outside the table card");
  const order = flatten(tree);
  assert.ok(order.indexOf(input) < order.indexOf(card), "search sits above the table card");
  assert.equal(findAll(tree, (node) => node.type === "h2" && textOf(node) === "Presupuesto por grupo").length, 1);
});

test("cash-fund budget search filters by visible group and teacher text and resets", async () => {
  const searchable = createSearchableTable();
  let { tree } = await renderCashFund({ searchable });
  assert.equal(headerRows(tree).length, 1, "the budget header row stays visible while searching");
  assert.equal(dataRows(tree).length, 2);

  typeSearch(tree, "  HELE ");
  ({ tree } = await renderCashFund({ searchable }));
  assert.equal(dataRows(tree).length, 1);
  assert.match(textOf(dataRows(tree)[0]), /Helechos/);

  typeSearch(tree, "ana docente");
  ({ tree } = await renderCashFund({ searchable }));
  assert.equal(dataRows(tree).length, 1);
  assert.match(textOf(dataRows(tree)[0]), /Esporas/);

  typeSearch(tree, "");
  ({ tree } = await renderCashFund({ searchable }));
  assert.equal(dataRows(tree).length, 2, "clearing the search restores every group");
});

test("cash-fund budget search reports no matches without losing the empty budget state", async () => {
  const searchable = createSearchableTable();
  let { tree } = await renderCashFund({ searchable });
  typeSearch(tree, "grupo inexistente");
  ({ tree } = await renderCashFund({ searchable }));
  const cells = findAll(tableOf(tree), (node) => node.type === tableModule.TableCell);
  assert.equal(cells.length, 1);
  assert.equal(cells[0].props.colSpan, 5);
  assert.equal(textOf(cells[0]), "No encontramos resultados para esta búsqueda.");
  assert.equal(headerRows(tree).length, 1);

  const emptyTree = (await renderCashFund({ searchable: createSearchableTable(), groups: [] })).tree;
  const emptyCells = findAll(tableOf(emptyTree), (node) => node.type === tableModule.TableCell);
  assert.equal(emptyCells.length, 1);
  assert.equal(emptyCells[0].props.colSpan, 5);
  assert.equal(textOf(emptyCells[0]), "No hay grupos activos.");
  assert.ok(searchInput(emptyTree), "the search stays available for an empty listing");
});

test("cash-fund budget table scrolls horizontally on mobile instead of hiding", async () => {
  const searchable = createSearchableTable();
  const { tree } = await renderCashFund({ searchable });
  const hiddenClasses = classNames(tree).filter((value) => /(^|\s)(md:)?hidden($|\s)/.test(value));
  assert.deepEqual(hiddenClasses, [], "the budget table is no longer hidden behind a mobile breakpoint");
  assert.match(String(tableOf(tree).props.className), /\bmin-w-\[/, "the table keeps a minimum width so the shared container can scroll");
});

test("inventory stock search filters the desktop table and the mobile cards together", async () => {
  const searchable = createSearchableTable();
  let { tree } = await renderInventory({ searchable });
  const input = searchInput(tree);
  assert.ok(input, "the stock listing must expose a live search input");
  assert.equal(input.props.id, "inventory-stock-search");
  assert.equal(input.props.type, "search");
  assert.equal(input.props.placeholder, "Buscar por producto");
  assert.equal(findAll(tree, (node) => node.type === "label" && node.props.htmlFor === "inventory-stock-search" && node.props.children === "Buscar").length, 1);
  assert.equal(findAll(tableCard(tree), (node) => node.type === inputModule.Input).length, 0);
  assert.equal(dataRows(tree).length, 2);
  assert.equal(articles(tableCard(tree)).length, 2);

  typeSearch(tree, " GOMA ");
  ({ tree } = await renderInventory({ searchable }));
  assert.equal(dataRows(tree).length, 1);
  assert.match(textOf(dataRows(tree)[0]), /Goma de borrar/);
  assert.equal(articles(tableCard(tree)).length, 1, "mobile cards filter with the same query as the table");
  assert.match(textOf(articles(tableCard(tree))[0]), /Goma de borrar/);

  typeSearch(tree, "LÁPIZ");
  ({ tree } = await renderInventory({ searchable }));
  assert.equal(dataRows(tree).length, 1);
  assert.match(textOf(dataRows(tree)[0]), /Lápiz negro/);
  assert.equal(articles(tableCard(tree)).length, 1);
  assert.match(textOf(articles(tableCard(tree))[0]), /Lápiz negro/);

  typeSearch(tree, "");
  ({ tree } = await renderInventory({ searchable }));
  assert.equal(dataRows(tree).length, 2, "clearing the search restores every product");
  assert.equal(articles(tableCard(tree)).length, 2);
});

test("inventory stock rows keep the original product editor trigger on mobile and desktop", async () => {
  const searchable = createSearchableTable();
  const { tree, editorCalls } = await renderInventory({ searchable });
  assert.equal(editorCalls.length, 4, "one product editor per product per surface");
  const mobileTriggers = editorCalls.filter((call) => React.isValidElement(call.trigger) && call.trigger.type === "button");
  const desktopTriggers = editorCalls.filter((call) => React.isValidElement(call.trigger) && call.trigger.type === tableModule.TableCell);
  assert.equal(mobileTriggers.length, 2);
  assert.equal(desktopTriggers.length, 2);
  for (const product of [baselineProduct, healthyProduct]) {
    const calls = editorCalls.filter((call) => call.product.id === product.id);
    assert.equal(calls.length, 2, "mobile and desktop share the same product payload");
    for (const key of ["id", "name", "unit", "stock", "minimumStock"]) {
      assert.equal(calls[0].product[key], product[key]);
      assert.equal(calls[1].product[key], product[key]);
    }
  }
  const row = dataRows(tree).find((node) => textOf(node).includes("Lápiz negro"));
  assert.match(textOf(row), /Unidad: unidad/);
  const cells = findAll(row, (node) => node.type === tableModule.TableCell);
  assert.equal(cells.length, 3, "the row keeps its three data columns beside the editor cell");
  assert.equal(React.isValidElement(editorCalls[0].trigger), true, "the mobile trigger stays a real element");
});

test("inventory stock search keeps the empty product state and its no-match message", async () => {
  const searchable = createSearchableTable();
  let { tree } = await renderInventory({ searchable });
  typeSearch(tree, "producto inexistente");
  ({ tree } = await renderInventory({ searchable }));
  const cells = findAll(tableOf(tree), (node) => node.type === tableModule.TableCell);
  assert.equal(cells.length, 1);
  assert.equal(cells[0].props.colSpan, 4);
  assert.equal(textOf(cells[0]), "No encontramos resultados para esta búsqueda.");
  assert.equal(articles(tableCard(tree)).length, 0);

  const emptyTree = (await renderInventory({ searchable: createSearchableTable(), products: [] })).tree;
  const emptyCells = findAll(tableOf(emptyTree), (node) => node.type === tableModule.TableCell);
  assert.equal(emptyCells.length, 1);
  assert.equal(emptyCells[0].props.colSpan, 4);
  assert.equal(textOf(emptyCells[0]), "Todavía no hay productos registrados.");
  assert.ok(searchInput(emptyTree), "the search stays available for an empty stock listing");
});

test("teacher cash-fund and inventory flows stay form-only without a listing search", async () => {
  const teacherInventory = (await renderInventory({
    searchable: createSearchableTable(),
    user: { id: "teacher-user", role: "TEACHER", permissionKeys: [] },
    teacherRequests: [
      {
        id: "request-9",
        status: "PENDING",
        decisionReason: null,
        lines: [{ id: "line-9", product: { name: "Lápiz negro", unit: "unidad" }, requestedQuantity: 2, approvedQuantity: null }],
      },
    ],
  })).tree;
  assert.equal(searchInput(teacherInventory), undefined);
  assert.equal(findAll(teacherInventory, isTable).length, 0);
  assert.deepEqual(findAll(teacherInventory, (node) => node.type === cardModule.CardTitle).map(textOf), ["Solicitar productos", "Mis solicitudes"]);
  assert.deepEqual(findAll(teacherInventory, (node) => node.type === buttonModule.Button).map(textOf), ["Cancelar"]);

  const teacherCashFund = (await renderCashFund({
    searchable: createSearchableTable(),
    user: { id: "teacher-user", role: "TEACHER", permissionKeys: ["cash-fund.operate"] },
    teacherGroups: [{ id: "g1", name: "Esporas", cashFundEntries: [{ amount: 300 }] }],
  })).tree;
  assert.equal(searchInput(teacherCashFund), undefined);
  assert.equal(findAll(teacherCashFund, isTable).length, 0);
  assert.deepEqual(findAll(teacherCashFund, (node) => node.type === cardModule.CardTitle).map(textOf), ["Enviar rendición", "Mis rendiciones"]);
  const fields = findAll(teacherCashFund, (node) => node.type === "input" || node.type === "select" || node.type === "textarea").map((node) => node.props.name);
  assert.deepEqual(fields, ["groupId", "categoryId", "amount", "concept", "justification", "expenseDate"]);
  assert.equal(findAll(teacherCashFund, (node) => node.type === buttonModule.Button).map(textOf)[0], "Enviar rendición");
});
