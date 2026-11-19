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

/** Loads the real shared listing table so the search toolbar is part of the rendered tree. */
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

function expandSearchableTables(node, searchable) {
  if (Array.isArray(node)) return node.map((child) => expandSearchableTables(child, searchable));
  if (!React.isValidElement(node)) return node;
  if (node.type === searchable.module.DashboardSearchableTable) {
    return expandSearchableTables(searchable.module.DashboardSearchableTable(node.props), searchable);
  }
  const children = React.Children.toArray(node.props?.children).map((child) => expandSearchableTables(child, searchable));
  if (!children.length) return node;
  return React.cloneElement(node, undefined, ...children);
}

function findAll(node, predicate, found = []) {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    if (predicate(child)) found.push(child);
    findAll(child.props.children, predicate, found);
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

function childrenOf(node) {
  const value = node.props?.children;
  if (value === null || value === undefined || typeof value === "boolean") return [];
  return Array.isArray(value) ? value : [value];
}

const isCard = (node) => node.type === cardModule.Card;
const isTable = (node) => node.type === tableModule.Table;
const isBadge = (node) => node.type === badgeModule.Badge;
const isHeading = (level) => (node) => node.type === level;

/** The compact table shell used by Alumnos: title outside, Table inside one small Card. */
function assertCompactTableShell(tree, titleText) {
  const headings = findAll(tree, (node) => node.type === "h2" && textOf(node) === titleText);
  assert.equal(headings.length, 1, `expected a single "${titleText}" h2`);
  const tableCards = findAll(tree, isCard).filter((card) => findAll(card, isTable).length > 0);
  assert.equal(tableCards.length, 1, "expected the section table inside exactly one Card");
  const card = tableCards[0];
  assert.equal(card.props.size, "sm", "section table card uses the compact Alumnos size");
  assert.match(String(card.props.className), /min-w-0/);
  assert.equal(findAll(card, isHeading("h2")).length, 0, "the section title must live outside the table card");
  assert.equal(findAll(card, (node) => textOf(node) === titleText).length, 0, "the section title must not repeat inside the card");
  assert.equal(findAll(card, (node) => node.type === cardModule.CardContent).length, 1, "table sits in a shared CardContent");
  const section = findAll(
    tree,
    (node) =>
      childrenOf(node).includes(headings[0]) && findAll(node, (child) => child === card).length === 1,
  );
  assert.equal(section.length, 1, "title and compact table card share one section wrapper");
  return { card, headings, section: section[0] };
}

const baselineProduct = {
  id: "p1",
  name: "Lápiz negro",
  unit: "unidad",
  stock: 24,
  minimumStock: 30,
};
const healthyProduct = {
  id: "p2",
  name: "Goma de borrar",
  unit: "unidad",
  stock: 40,
  minimumStock: 10,
};

async function renderInventory({ user, products = [baselineProduct, healthyProduct], requests = [], teacherRequests = [], movements = [], searchable = createSearchableTable() }) {
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
    "@/modules/operations/components/inventory-product-editor": {
      InventoryProductEditor: (props) => React.createElement("span", null, props.children),
    },
    "@/modules/operations/components/inventory-request-form": {
      InventoryRequestForm: () => React.createElement("form", null, "Solicitar productos"),
    },
    "@/modules/operations/components/inventory-request-decision-form": {
      InventoryRequestDecisionForm: () => React.createElement("form", null, "Resolver solicitud"),
    },
  });
  return expandSearchableTables(await view.InventoryDashboardView({ user }), searchable);
}

async function renderCashFund({ user, groups = [], reports = [], teacherGroups = [], teacherReports = [], searchable = createSearchableTable() }) {
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
  return expandSearchableTables(await view.CashFundDashboardView({ user }), searchable);
}

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

test("cash-fund budget section keeps the Alumnos shell with a search above a scrollable table", async () => {
  const tree = await renderCashFund({ user: adminCashFundUser, groups: cashFundGroups });
  const { card, section } = assertCompactTableShell(tree, "Presupuesto por grupo");
  const hiddenWrappers = findAll(card, (node) => typeof node.props.className === "string" && /(^|\s)(md:)?hidden($|\s)/.test(node.props.className));
  assert.deepEqual(hiddenWrappers, [], "the budget table is no longer hidden behind a mobile breakpoint");
  assert.match(String(findAll(card, isTable)[0].props.className), /\bmin-w-\[/, "the budget table can scroll horizontally instead");
  assert.equal(findAll(section, (node) => node.type === inputModule.Input).length, 1, "the section owns the labelled live search");
  assert.equal(findAll(card, (node) => node.type === inputModule.Input).length, 0);
  assert.equal(findAll(card, (node) => node.type === tableModule.TableBody).length, 1);
});

test("cash-fund budget table keeps metrics and marks budget state with semantic badges", async () => {
  const tree = await renderCashFund({ user: adminCashFundUser, groups: cashFundGroups });
  const table = findAll(tree, isTable)[0];
  const rows = findAll(table, (node) => node.type === tableModule.TableRow);
  assert.equal(rows.length, 3, "header row plus one row per group");
  const groupRows = rows.slice(1);
  assert.equal(textOf(groupRows[0]).includes("Esporas"), true);
  assert.equal(textOf(groupRows[0]).includes("Ana Docente"), true);

  const muted = findAll(table, isBadge).filter((node) => node.props.variant === "muted");
  const warning = findAll(table, isBadge).filter((node) => node.props.variant === "warning");
  assert.deepEqual(muted.map(textOf), ["Sin configurar", "0 · $0.00"]);
  assert.equal(warning.length, 1);
  assert.match(textOf(warning[0]), /^1 · \$200\.00$/);
  assert.equal(groupRows.some((row) => textOf(row).includes("Sin docentes asignados")), true);
});

test("inventory stock section uses the compact Alumnos table shell", async () => {
  const tree = await renderInventory({ user: adminInventoryUser });
  const { card, section } = assertCompactTableShell(tree, "Stock por producto");
  const mobileCards = findAll(card, (node) => node.type === "article");
  assert.equal(mobileCards.length, 2, "mobile product cards stay outside the table");
  assert.equal(mobileCards.some((node) => findAll(node, isTable).length > 0), false);
  assert.equal(findAll(card, isTable).length, 1);
  assert.equal(findAll(section, (node) => node.type === inputModule.Input).length, 1, "the section owns the labelled live search");
});

test("inventory stock table keeps stock values and marks availability with semantic badges", async () => {
  const tree = await renderInventory({ user: adminInventoryUser });
  const table = findAll(tree, isTable)[0];
  const rows = findAll(table, (node) => node.type === tableModule.TableRow).slice(1);
  assert.equal(rows.length, 2);
  assert.match(textOf(rows[0]), /Lápiz negro/);
  assert.match(textOf(rows[0]), /30 unidad/);
  assert.match(textOf(rows[0]), /24 unidad/);
  const badges = findAll(table, isBadge);
  assert.deepEqual(badges.map((node) => node.props.variant), ["warning", "success"]);
  assert.deepEqual(badges.map(textOf), ["Requiere reposición", "Disponible"]);
  assert.match(textOf(rows[1]), /Goma de borrar/);
});

test("inventory mobile cards, request and movement workflows remain available", async () => {
  const tree = await renderInventory({
    user: adminInventoryUser,
    requests: [
      {
        id: "request-1",
        teacher: { displayName: "Ana Docente" },
        lines: [{ id: "line-1", product: { name: "Lápiz negro", unit: "unidad" }, requestedQuantity: 2 }],
      },
    ],
    movements: [
      {
        id: "movement-1",
        type: "STOCK_IN",
        quantity: 5,
        reason: "Compra",
        isReversed: false,
        product: { name: "Lápiz negro", unit: "unidad" },
      },
    ],
  });
  const mobileCards = findAll(tree, (node) => typeof node.props.className === "string" && node.props.className.includes("md:hidden"));
  assert.equal(mobileCards.length, 1);
  assert.match(textOf(mobileCards[0]), /Mínimo esperado: 30 unidad/);
  assert.match(textOf(mobileCards[0]), /Requiere reposición/);
  assert.match(textOf(mobileCards[0]), /Stock disponible/);

  const lineForm = findAll(tree, (node) => node.type === "form" && findAll(node, (input) => input.props.name === "lineId").length === 1);
  assert.equal(lineForm.length, 1, "single-line request decision form is preserved");
  assert.match(textOf(lineForm[0]), /Solicita 2 unidad/);
  assert.match(textOf(lineForm[0]), /Resolver solicitud/);
  const approvedInput = findAll(lineForm[0], (node) => node.type === "input" && node.props.name === "approvedQuantity");
  assert.equal(approvedInput.length, 1);
  assert.equal(approvedInput[0].props.defaultValue, 2);

  const movements = findAll(tree, (node) => typeof node.props.className === "string" && node.props.className.includes("justify-between"));
  assert.equal(movements.some((node) => textOf(node).includes("Revertir")), true);
});

test("teacher cash-fund keeps the card based report flow without a table", async () => {
  const tree = await renderCashFund({
    user: { id: "teacher-user", role: "TEACHER", permissionKeys: ["cash-fund.operate"] },
    teacherGroups: [{ id: "g1", name: "Esporas", cashFundEntries: [{ amount: 300 }] }],
  });
  assert.equal(findAll(tree, isTable).length, 0);
  const titles = findAll(tree, (node) => node.type === cardModule.CardTitle).map(textOf);
  assert.deepEqual(titles, ["Enviar rendición", "Mis rendiciones"]);
  const groupOption = findAll(tree, (node) => node.type === "option" && textOf(node).includes("Esporas"));
  assert.equal(groupOption.length, 1);
  assert.match(textOf(groupOption[0]), /Esporas · \$300\.00/);
});

test("teacher inventory keeps the request cards without a table", async () => {
  const tree = await renderInventory({
    user: { id: "teacher-user", role: "TEACHER", permissionKeys: [] },
    teacherRequests: [
      {
        id: "request-9",
        status: "PENDING",
        decisionReason: null,
        lines: [{ id: "line-9", product: { name: "Lápiz negro", unit: "unidad" }, requestedQuantity: 2, approvedQuantity: null }],
      },
    ],
  });
  assert.equal(findAll(tree, isTable).length, 0);
  const titles = findAll(tree, (node) => node.type === cardModule.CardTitle).map(textOf);
  assert.deepEqual(titles, ["Solicitar productos", "Mis solicitudes"]);
  assert.deepEqual(findAll(tree, (node) => node.type === buttonModule.Button).map(textOf), ["Cancelar"]);
});
