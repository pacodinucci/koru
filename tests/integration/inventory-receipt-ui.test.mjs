import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const base = "modules/operations/components/";
function load(file, overrides = {}, globals = {}) {
  const source = readFileSync(new URL(`../../src/${base}${file}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  const pass = ({ children }) => React.createElement("div", null, children);
  vm.runInNewContext(output, { ...globals, module: mod, exports: mod.exports, require: (id) => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (["react", "react/jsx-runtime"].includes(id)) return require(id);
    if (id === "next/navigation") return { useRouter: () => ({ refresh() {} }) };
    if (id.endsWith("inventory-invoice-review")) return review;
    if (id.endsWith("inventory-intake-files")) return load("inventory-intake-files.ts");
    if (id.endsWith("ui/input")) return { Input: (props) => React.createElement("input", props) };
    if (id.endsWith("ui/label")) return { Label: (props) => React.createElement("label", props) };
    if (id.endsWith("ui/button")) return { Button: (props) => React.createElement("button", props) };
    return new Proxy({}, { get: () => pass });
  } });
  return mod.exports;
}
const review = load("inventory-invoice-review.ts");
const products = [
  { id: "pieces", name: "Guantes", unit: "unidad", stock: 10, minimumStock: 0 },
  { id: "boxes", name: "Guantes en caja", unit: "caja", stock: 2, minimumStock: 0 },
];
const line = (patch = {}) => ({ description: "2 cajas de 12 guantes", invoiceQuantity: 2, invoiceUnit: "caja", productId: "pieces", stockQuantity: 24, unitsPerInvoiceUnit: 12, unitCost: 3.5, confidence: "high", note: null, ...patch });
const draft = (lines = [line()]) => ({ supplier: "Proveedor", invoiceNumber: "A-123", lines, warnings: [] });
const state = (lines) => review.editReviewHeader(review.createReview(draft(lines), "batch-1"), { supplier: "Proveedor", date: "2024-02-29", totalAmount: "125.50" }, "batch-1");
const plain = (value) => JSON.parse(JSON.stringify(value));
const payload = (value) => review.confirmationPayload(value, products);

test("purchase total is manual, required, bounded and never distributed into line costs", () => {
  const initial = review.createReview({ ...draft(), totalAmount: 900 }, "b");
  assert.equal(initial.totalAmount, "");
  assert.equal(review.emptyReview("b").totalAmount, "");
  const ready = review.setReviewed(state(), true);
  for (const totalAmount of [undefined, null, "", " ", "null", "undefined", "-1", "NaN", "Infinity", "1e2", "0.001", "1.230", "10000000000", "9999999999.991"]) {
    const invalid = { ...ready, totalAmount };
    const before = JSON.stringify(invalid);
    assert.deepEqual(plain(payload(invalid)), { ok: false, message: "Ingresá el total de la compra: un importe no negativo con hasta 2 decimales (máximo 9999999999,99)." }, String(totalAmount));
    assert.equal(JSON.stringify(invalid), before);
  }
  for (const totalAmount of ["0", "0.01", "125.50", "9999999999.99"]) {
    const edited = review.editReviewHeader(ready, { totalAmount }, "new-batch");
    assert.equal(edited.reviewed, totalAmount === "125.50");
    assert.equal(edited.batchId, totalAmount === "125.50" ? ready.batchId : "new-batch");
    const result = payload(review.setReviewed(edited, true));
    assert.equal(result.ok, true);
    assert.equal(result.payload.totalAmount, Number(totalAmount));
    assert.deepEqual(plain(result.payload.lines), plain(payload(ready).payload.lines));
  }
  const locked = review.lockReview(ready);
  assert.equal(review.editReviewHeader(locked, { totalAmount: "42" }, "other"), locked);
  assert.equal(review.emptyReview("other", ready).totalAmount, "125.50");
  assert.equal(review.createReview({ ...draft(), totalAmount: 900 }, "other", ready).totalAmount, "125.50");
});

test("Tomar foto activates live camera instead of a capture-hint-only input", async () => {
  const ui = clientHarness();
  const camera = ui.button("Tomar foto");
  assert.ok(camera, "Tomar foto must open a real camera, not just a capture-hint file input");
  await camera.props.onClick();
  ui.render();
  assert.ok(ui.find((node) => node.type === "video" || node.props?.active === true), "live camera preview must be available");
});

test("packaging suggestions preserve invoice facts and cost per stock unit", () => {
  const value = state([line(), line({ description: "1 caja sin contenido declarado", invoiceQuantity: 1, stockQuantity: null, unitsPerInvoiceUnit: null, unitCost: null, confidence: "low", note: "Falta tamaño de caja" })]);
  assert.equal(value.lines[0].quantity, "24");
  assert.equal(value.lines[0].unitCost, "3.5");
  assert.equal(value.lines[0].original.unitsPerInvoiceUnit, 12);
  assert.equal(value.lines[1].quantity, "");
  assert.equal(payload(review.setReviewed(value, true)).ok, false);
});

test("changing product invalidates quantity, conversion, cost and explicit review", () => {
  const initial = review.setReviewed(state(), true);
  const changed = review.editReviewLine(initial, 0, { productId: "boxes" }, "batch-2");
  assert.equal(changed.lines[0].productId, "boxes");
  assert.equal(changed.lines[0].quantity, "");
  assert.equal(changed.lines[0].unitCost, "");
  assert.equal(changed.lines[0].conversion, null);
  assert.equal(changed.lines[0].original.stockQuantity, 24);
  assert.equal(changed.reviewed, false);
  assert.equal(changed.batchId, "batch-2");
  assert.equal(payload(review.setReviewed(changed, true)).ok, false);
  const resolved = review.editReviewLine(changed, 0, { quantity: "2" }, "batch-3");
  assert.deepEqual(plain(payload(review.setReviewed(resolved, true)).payload.lines), [{ productId: "boxes", quantity: 2, unitCost: null, description: "2 cajas de 12 guantes" }]);
});

test("confirmation needs checkbox, known products, finite positive quantities and at least one included line", () => {
  assert.equal(payload(state()).ok, false);
  for (const quantity of ["", "0", "-1", "NaN", "Infinity", "1e999", "1.0001", "0.00100001", "1000000000", "999999999.9999"]) {
    const edited = review.editReviewLine(state(), 0, { quantity }, "batch-2");
    assert.equal(payload(review.setReviewed(edited, true)).ok, false, quantity);
  }
  for (const productId of ["", "unknown"]) {
    const edited = review.editReviewLine(state(), 0, { productId, quantity: "1" }, "batch-2");
    assert.equal(payload(review.setReviewed(edited, true)).ok, false, productId);
  }
  const excluded = review.editReviewLine(state(), 0, { included: false }, "batch-2");
  assert.equal(payload(review.setReviewed(excluded, true)).ok, false);
});

test("optional cost rejects negatives and nonfinite values; quantity payload has supported precision", () => {
  for (const unitCost of ["-0.01", "NaN", "Infinity", "0.01000001", "10000000000"]) {
    const edited = review.editReviewLine(state(), 0, { unitCost }, "batch-2");
    assert.equal(payload(review.setReviewed(edited, true)).ok, false);
  }
  for (const quantity of ["0.001", "1.234", "24", "1.2300"]) {
    for (const unitCost of ["", "0", "2.5"]) {
      const edited = review.editReviewLine(state(), 0, { quantity, unitCost }, "batch-2");
      const result = payload(review.setReviewed(edited, true));
      assert.equal(result.ok, true);
      assert.equal(result.payload.lines[0].quantity, Number(quantity));
      assert.equal(result.payload.lines[0].unitCost, unitCost === "" ? null : Number(unitCost));
    }
  }
});

test("excluding unresolved rows permits only resolved included rows, without mutating draft", () => {
  const initial = state([line(), line({ productId: null, stockQuantity: null })]);
  const edited = review.editReviewLine(initial, 1, { included: false }, "batch-2");
  const result = payload(review.setReviewed(edited, true));
  assert.equal(result.ok, true);
  assert.equal(result.payload.lines.length, 1);
  assert.equal(initial.lines[1].included, true);
  assert.equal(initial.batchId, "batch-1");
});

test("malformed drafts and unknown rows fail closed instead of producing intake", () => {
  for (const invalid of [null, {}, { ...draft(), lines: [] }, draft([null]), draft([line({ description: "" })]), draft([line({ stockQuantity: "24" })]), draft([line({ confidence: "certain" })])]) {
    assert.throws(() => review.createReview(invalid, "batch-1"));
  }
  assert.equal(payload(review.setReviewed(state([line({ productId: "not-in-catalog" })]), true)).ok, false);
});

test("failed or uncertain retry keeps batch ID and payload; uncertain submission cannot be edited", () => {
  const initial = review.setReviewed(state(), true);
  const locked = review.lockReview(initial);
  const uncertain = review.failReview(locked, true);
  assert.equal(uncertain.locked, true);
  assert.deepEqual(plain(payload(uncertain)), plain(payload(initial)));
  assert.equal(review.editReviewLine(uncertain, 0, { quantity: "100" }, "other"), uncertain);
  assert.equal(review.editReviewHeader(uncertain, { supplier: "Other" }, "other"), uncertain);
  assert.equal(review.setReviewed(uncertain, false), uncertain);
  assert.equal(review.failReview(uncertain, false).locked, true);
  const rejected = review.failReview(initial, false);
  assert.equal(rejected.locked, false);
  assert.equal(rejected.batchId, "batch-1");
  assert.deepEqual(plain(payload(rejected)), plain(payload(initial)));
  assert.equal(review.editReviewLine(rejected, 0, { quantity: "24" }, "other").batchId, "batch-1");
  assert.equal(review.editReviewHeader(rejected, { supplier: "Other" }, "other").batchId, "other");
});

test("supplier and real calendar date must be entered manually, never copied from analysis", () => {
  const value = review.createReview({ ...draft(), date: "2024-02-29" }, "batch-1");
  assert.equal(value.supplier, "");
  assert.equal(value.date, "");
  assert.equal(payload(review.setReviewed(value, true)).ok, false);
  for (const date of ["", "2023-02-29", "2024-02-30", "2024-04-31", "2024-13-01", "0000-01-01", "2024-2-01"]) {
    assert.equal(payload(review.setReviewed(review.editReviewHeader(value, { supplier: "Proveedor", date }, "b"), true)).ok, false, date);
  }
  for (const date of ["2024-02-29", "2025-01-31", "2000-02-29"]) {
    const ready = review.setReviewed(review.editReviewHeader(value, { supplier: " Proveedor ", date, totalAmount: "0" }, "b"), true);
    assert.equal(payload(ready).ok, true, date);
    assert.equal(payload(ready).payload.supplier, "Proveedor");
    assert.equal(payload(ready).payload.date, date);
  }
  assert.equal(payload(review.setReviewed(review.editReviewHeader(value, { date: "2024-02-29", supplier: "  " }, "b"), true)).ok, false);
});

test("spreadsheet filename and common browser MIME types accepted with final 4 MiB guard", () => {
  for (const name of ["factura.csv", "FACTURA.XLSX", "factura.xls"]) {
    for (const type of ["", "application/octet-stream"]) assert.equal(review.invoiceFileError({ name, type, size: 1024 }), null);
  }
  for (const type of ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]) {
    assert.equal(review.invoiceFileError({ type, name: "factura", size: 1024 }), null);
  }
  assert.ok(review.invoiceFileError({ name: "factura.exe", type: "", size: 10 }));
});

test("file guard allows only bounded JPEG/PNG/WebP/PDF before upload", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp", "application/pdf"]) {
    assert.equal(review.invoiceFileError({ type, size: 4 * 1024 * 1024 }), null);
  }
  for (const file of [{ type: "image/gif", size: 100 }, { type: "image/jpeg", size: 0 }, { type: "application/pdf", size: 4 * 1024 * 1024 + 1 }]) {
    assert.equal(typeof review.invoiceFileError(file), "string");
  }
});

test("one Registrar ingreso is operate-only; adjustment and configuration remain available", () => {
  const { InventoryAdminActions } = load("inventory-admin-actions.tsx", {
    "@/modules/operations/components/inventory-invoice-import": { InventoryInvoiceImport: ({ canConfigure, products }) => React.createElement("span", null, `Registrar ingreso:${canConfigure}:${products.length}`) },
  });
  const html = (canOperate, canConfigure) => renderToStaticMarkup(React.createElement(InventoryAdminActions, { products, canOperate, canConfigure }));
  assert.match(html(true, false), /Registrar ingreso:false:2/);
  assert.doesNotMatch(html(false, true), /Registrar ingreso/);
  const manual = html(true, true);
  for (const text of ["Registrar ingreso", "Ajustar stock", "Configuración de inventario", "Motivo o referencia"]) assert.match(manual, new RegExp(text));
  assert.equal((manual.match(/Registrar ingreso/g) ?? []).length, 1);
  assert.doesNotMatch(manual, /Importar factura|stock-in-unit-cost/);
  assert.match(manual, /<input(?=[^>]*name="quantity")(?=[^>]*step="0.001")[^>]*>/);
  assert.match(manual, /name="reason"/);
});

test("adjustment and configuration handlers still call their original actions and refresh on success", async () => {
  const calls = []; const pending = []; let refreshes = 0; let resets = 0;
  const action = (name) => async (data) => { calls.push([name, data.values]); return { ok: true, message: "Guardado" }; };
  class Form { constructor(form) { this.values = form.values; } }
  const { InventoryAdminActions } = load("inventory-admin-actions.tsx", {
    react: { ...React, useState: (value) => [value, () => {}], useTransition: () => [false, (fn) => pending.push(fn())] },
    "next/navigation": { useRouter: () => ({ refresh: () => refreshes++ }) },
    "@/modules/operations/components/inventory-invoice-import": { InventoryInvoiceImport: () => null },
    "@/modules/operations/server/inventory.actions": {
      adjustInventoryStockAction: action("adjust"), createInventoryProductAction: action("create"), setInventoryMinimumStockAction: action("minimum"),
    },
  }, { FormData: Form });
  function expand(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(expand);
    if (typeof node.type === "function") return expand(node.type(node.props));
    return [node, ...expand(node.props?.children)];
  }
  const forms = expand(InventoryAdminActions({ products, canOperate: true, canConfigure: true })).filter((node) => node.type === "form");
  assert.equal(forms.length, 4);
  const values = [{ productId: "pieces", quantity: "-2", reason: "Recuento físico" }, { name: "Gasas", unit: "paquete", minimumStock: "2" }, { productId: "pieces", minimumStock: "3" }];
  for (let i = 0; i < 3; i++) forms[i].props.onSubmit({ preventDefault() {}, currentTarget: { values: values[i], reset: () => resets++ } });
  await Promise.all(pending);
  assert.deepEqual(calls, [["adjust", values[0]], ["create", values[1]], ["minimum", values[2]]]);
  assert.equal(refreshes, 3); assert.equal(resets, 3);
});

test("intake exposes three modes, blank manual headers and formats without the header legend", () => {
  const { InventoryInvoiceImport } = load("inventory-invoice-import.tsx");
  const html = renderToStaticMarkup(React.createElement(InventoryInvoiceImport, { products, canConfigure: false }));
  for (const text of ["Tomar foto", "Subir archivo", "Carga manual", "Proveedor", "Fecha del ingreso"]) assert.match(html, new RegExp(text));
  assert.match(html, /accept="[^"]*\.xlsx[^"]*\.csv/);
  assert.match(html, /type="date"[^>]*value=""/);
  assert.doesNotMatch(html, /Proveedor \(opcional\)|Importar factura/);
  assert.doesNotMatch(html, /Elegí una pestaña|La carga manual muestra una tabla|Las imágenes y PDF se interpretan|La carga manual no usa IA|El stock no cambia hasta confirmar el ingreso revisado/);
  assert.match(html, /Analizar factura/);
  const source = readFileSync(new URL(`../../src/${base}inventory-invoice-import.tsx`, import.meta.url), "utf8");
  assert.match(source, /fetch\("\/api\/operations\/inventory\/invoice"/);
  assert.match(source, /AbortController/);
  assert.match(source, /createInvoiceProductAction/);
});

// Deterministic hook/event harness: exercises exported client callbacks, not a browser.
function clientHarness({ fetcher, configure = false, createProduct } = {}) {
  const slots = [];
  const effects = [];
  let pendingEffects = [];
  const revoked = [];
  let cursor = 0;
  let tree;
  let refreshes = 0;
  let nextId = 0;
  const hooks = {
    ...React,
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [slots[i], (value) => { slots[i] = typeof value === "function" ? value(slots[i]) : value; }];
    },
    useRef(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = { current: initial };
      return slots[i];
    },
    useEffect(effect, deps) {
      const i = cursor++;
      if (!effects[i] || deps.some((dep, j) => dep !== effects[i].deps[j])) pendingEffects.push(() => {
        effects[i]?.cleanup?.(); effects[i] = { deps, cleanup: effect() };
      });
    },
    useId: () => "invoice",
  };
  class Form {
    constructor(form) { this.values = new Map(Object.entries(form?.values ?? {})); }
    set(key, value) { this.values.set(key, value); }
    get(key) { return this.values.get(key); }
  }
  const { InventoryInvoiceImport } = load("inventory-invoice-import.tsx", {
    react: hooks,
    "next/navigation": { useRouter: () => ({ refresh: () => refreshes++ }) },
    "@/modules/operations/server/inventory-invoice.actions": { createInvoiceProductAction: createProduct },
    "@/modules/operations/components/inventory-intake-files": { prepareInvoiceFile: async (file) => file, INVOICE_FILE_ACCEPT: "image/jpeg,image/png,image/webp,application/pdf,.xlsx,.xls,.csv" },
  }, { fetch: fetcher, FormData: Form, AbortController,
    URL: { createObjectURL: (file) => `blob:${file.name}`, revokeObjectURL: (url) => revoked.push(url) },
    crypto: { randomUUID: () => `uuid-${++nextId}` },
  });
  function nodes(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap((child) => nodes(child));
    return [node, ...nodes(node.props?.children)];
  }
  function text(node) {
    if (Array.isArray(node)) return node.map(text).join("");
    if (node && typeof node === "object") return text(node.props?.children);
    return node == null || typeof node === "boolean" ? "" : String(node);
  }
  const api = {
    render() {
      cursor = 0; tree = InventoryInvoiceImport({ products, canConfigure: configure });
      const run = pendingEffects; pendingEffects = []; run.forEach((effect) => effect());
      return api;
    },
    unmount: () => effects.forEach((effect) => effect?.cleanup?.()),
    revoked: () => revoked,
    nodes: () => nodes(tree),
    text: () => text(tree),
    find: (predicate) => nodes(tree).find(predicate),
    button: (label) => nodes(tree).find((node) => node.props?.onClick && (text(node) === label || node.props["aria-label"] === label)),
    refreshes: () => refreshes,
  };
  return api.render();
}
const reply = (body, ok = true) => ({ ok, status: ok ? 200 : 400, json: async () => body });
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const choose = async (ui, name = "factura.png") => {
  await ui.find((node) => node.props?.type === "file").props.onChange({ target: { files: [{ type: "image/png", size: 1024, name }] } });
  ui.render();
};
const header = (ui, supplier = "Proveedor", date = "2024-02-29", totalAmount = "125.50") => {
  for (const [field, value] of [["supplier", supplier], ["date", date], ["total", totalAmount]]) {
    ui.find((node) => node.props?.id === `invoice-${field}`).props.onChange({ target: { value } }); ui.render();
  }
};
const checkReview = (ui) => {
  const boxes = ui.nodes().filter((node) => node.props?.type === "checkbox");
  boxes.at(-1).props.onChange({ target: { checked: true } });
  ui.render();
};

test("manual renders an accessible compact table with product first and quantity second", async () => {
  const ui = clientHarness();
  ui.button("Carga manual").props.onClick(); ui.render();
  const table = ui.find((node) => node.type === "table");
  assert.ok(table, "manual entry must render a semantic table, not cards");
  const html = renderToStaticMarkup(table);
  assert.match(html, /<thead[^>]*><tr[^>]*><th[^>]*>Producto<\/th><th[^>]*>Cantidad<\/th>/);
  assert.match(html, /<tbody><tr[^>]*><td[^>]*><select[^>]*aria-label="Producto de la fila 1"/);
  assert.match(html, /<\/td><td[^>]*><input[^>]*aria-label="Cantidad de la fila 1"/);
  assert.ok(ui.find((node) => node.props?.className?.includes("overflow-x-auto")));
  assert.equal(ui.nodes().filter((node) => node.props?.id === "invoice-supplier").length, 1);
  assert.equal(ui.nodes().filter((node) => node.props?.type === "checkbox").length, 1, "only shared review checkbox remains");
  assert.doesNotMatch(ui.text(), /Incluir línea|Costo por unidad|Conversión sugerida/);
  const select = ui.find((node) => node.type === "select");
  select.props.onChange({ target: { value: "pieces" } }); ui.render();
  const quantity = () => ui.find((node) => node.props?.id === "invoice-line-0-quantity");
  quantity().props.onChange({ target: { value: "5" } }); ui.render();
  ui.find((node) => node.type === "select").props.onChange({ target: { value: "boxes" } }); ui.render();
  assert.equal(quantity().props.value, "");
  assert.match(ui.text(), /caja/);
});

test("total input is common to all three modes and invalid totals cannot submit", async () => {
  for (const label of ["Tomar foto", "Subir archivo", "Carga manual"]) {
    const calls = [];
    const ui = clientHarness({ fetcher: async (url, options) => {
      calls.push({ url, ...options });
      return reply({ ok: true, draft: draft() });
    } });
    ui.button(label).props.onClick(); ui.render();
    const total = ui.find((node) => node.props?.id === "invoice-total");
    assert.ok(total, label);
    assert.equal(total.props.value, "");
    assert.equal(total.props.type, "number"); assert.equal(total.props.required, true);
    assert.equal(total.props.min, "0"); assert.equal(total.props.step, "0.01"); assert.equal(total.props.inputMode, "decimal");
    assert.ok(ui.find((node) => node.props?.htmlFor === "invoice-total" && node.props.children === "Total de la compra"));
    if (label === "Carga manual") {
      ui.find((node) => node.type === "select").props.onChange({ target: { value: "pieces" } }); ui.render();
      ui.find((node) => node.props?.id === "invoice-line-0-quantity").props.onChange({ target: { value: "2" } }); ui.render();
    } else {
      if (label === "Tomar foto") {
        await ui.find((node) => node.props?.active === true).props.onCapture({ name: "foto.jpg", type: "image/jpeg", size: 1024 }); ui.render();
      } else await choose(ui);
      await ui.button("Analizar factura").props.onClick(); ui.render();
    }
    header(ui, "Proveedor", "2024-02-29", ""); checkReview(ui);
    const prior = calls.length;
    for (const value of ["", " ", "-1", "1.001", "10000000000"]) {
      ui.find((node) => node.props?.id === "invoice-total").props.onChange({ target: { value } }); ui.render(); checkReview(ui);
      assert.equal(ui.button("Confirmar ingreso revisado").props.disabled, true);
      assert.match(ui.text(), /Ingresá el total de la compra/);
      await ui.button("Confirmar ingreso revisado").props.onClick();
      assert.equal(calls.length, prior);
    }
    for (const value of ["0", "9999999999.99"]) {
      ui.find((node) => node.props?.id === "invoice-total").props.onChange({ target: { value } }); ui.render();
      assert.equal(ui.nodes().filter((node) => node.props?.type === "checkbox").at(-1).props.checked, false);
      checkReview(ui); assert.equal(ui.button("Confirmar ingreso revisado").props.disabled, false);
    }
    ui.find((node) => node.props?.id === "invoice-total").props.onChange({ target: { value: "" } }); ui.render();
  }
});

function openProductCreation(ui, index = 0) {
  const select = ui.find((node) => node.props?.id === `invoice-line-${index}-product`);
  const option = select.props.children.at(-1);
  assert.equal(option?.props?.children, "Crear producto", "creation must be the final select option");
  select.props.onChange({ target: { value: option.props.value } }); ui.render();
}

test("manual configure creation opens a separate dialog from the final select option", async () => {
  let creates = 0;
  const ui = clientHarness({ configure: true, createProduct: async () => {
    creates++; return { ok: true, product: { id: "new", name: "Gasas", unit: "paquete" }, message: "Producto creado" };
  } });
  ui.button("Carga manual").props.onClick(); ui.render();
  assert.doesNotMatch(ui.text(), /Crear producto no encontrado|para fila/);
  assert.equal(ui.find((node) => node.type === "form"), undefined);
  openProductCreation(ui);
  assert.ok(ui.find((node) => node.props?.["aria-label"] === "Crear producto"));
  assert.equal(creates, 0);
  assert.doesNotMatch(renderToStaticMarkup(ui.find((node) => node.type === "table")), /<form|<details/);
  await ui.find((node) => node.type === "form").props.onSubmit({ preventDefault() {}, currentTarget: { reset() {} } }); ui.render();
  assert.equal(creates, 1); assert.equal(ui.refreshes(), 0);
  assert.equal(ui.find((node) => node.type === "select").props.value, "new");
  assert.equal(ui.find((node) => node.props?.id === "invoice-line-0-quantity").props.value, "");
  const withoutPermission = clientHarness(); withoutPermission.button("Carga manual").props.onClick(); withoutPermission.render();
  assert.doesNotMatch(withoutPermission.text(), /Crear producto/);
  assert.equal(ui.find((node) => node.type === "form"), undefined, "creation closes on success");
});

test("file replacement aborts analysis and late responses cannot overwrite the active draft; double analyze is guarded", async () => {
  const calls = [];
  const first = deferred();
  const second = deferred();
  const ui = clientHarness({ fetcher: (url, options) => {
    calls.push({ url, ...options });
    return calls.length === 1 ? first.promise : second.promise;
  } });
  await choose(ui);
  const start = ui.button("Analizar factura").props.onClick;
  const one = start();
  await start();
  assert.equal(calls.length, 1);
  await choose(ui, "otra.png");
  assert.equal(calls[0].signal.aborted, true);
  const two = ui.button("Analizar factura").props.onClick();
  second.resolve(reply({ ok: true, draft: draft([line({ description: "Factura actual" })]) }));
  await two;
  ui.render();
  first.resolve(reply({ ok: true, draft: draft([line({ description: "Factura anterior" })]) }));
  await one;
  ui.render();
  assert.match(ui.text(), /Factura actual/);
  assert.doesNotMatch(ui.text(), /Factura anterior/);
  assert.equal(calls.length, 2);
  assert.equal(ui.refreshes(), 0);
  assert.equal(calls[0].url, "/api/operations/inventory/invoice");
  assert.equal(calls[0].body.get("file").name, "factura.png");
  assert.equal(ui.button("Confirmar ingreso revisado").props.disabled, true);
  assert.doesNotMatch(ui.text(), /Crear producto no encontrado/);
});

test("camera capture only prepares a file; it never analyzes or writes stock automatically", async () => {
  const calls = [];
  const ui = clientHarness({ fetcher: async (...args) => calls.push(args) });
  ui.button("Tomar foto").props.onClick(); ui.render();
  const camera = ui.find((node) => node.props?.active === true);
  await camera.props.onCapture({ name: "foto.jpg", type: "image/jpeg", size: 1024 }); ui.render();
  assert.match(ui.text(), /foto.jpg/); assert.ok(ui.button("Analizar factura"));
  assert.equal(calls.length, 0); assert.equal(ui.refreshes(), 0);
});

test("preview object URLs are released on replacement, mode reset and unmount", async () => {
  const ui = clientHarness(); await choose(ui, "primera.png"); await choose(ui, "segunda.png");
  assert.deepEqual(ui.revoked(), ["blob:primera.png"]);
  ui.button("Carga manual").props.onClick(); ui.render();
  assert.deepEqual(ui.revoked(), ["blob:primera.png", "blob:segunda.png"]);
  ui.button("Subir archivo").props.onClick(); ui.render(); await choose(ui, "tercera.png"); ui.unmount();
  assert.deepEqual(ui.revoked(), ["blob:primera.png", "blob:segunda.png", "blob:tercera.png"]);
});

test("confirmation guards double clicks, retains same retry payload after uncertainty/failure, and clears only on success", async () => {
  const calls = [];
  const uncertain = deferred();
  const ui = clientHarness({ fetcher: (url, options) => {
    calls.push({ url, ...options });
    if (calls.length === 1) return Promise.resolve(reply({ ok: true, draft: draft() }));
    if (calls.length === 2) return uncertain.promise;
    if (calls.length === 3) return Promise.resolve(reply({ ok: false, message: "Error recuperable" }, false));
    return Promise.resolve(reply({ ok: true, message: "Ingreso registrado" }));
  } });
  await choose(ui);
  header(ui);
  await ui.button("Analizar factura").props.onClick();
  ui.render();
  // Calling the handler directly still cannot bypass the unchecked review gate.
  await ui.button("Confirmar ingreso revisado").props.onClick();
  assert.equal(calls.length, 1);
  checkReview(ui);
  const submit = ui.button("Confirmar ingreso revisado").props.onClick;
  const pending = submit();
  await submit();
  assert.equal(calls.length, 2);
  uncertain.reject(new Error("Connection lost"));
  await pending;
  ui.render();
  assert.match(ui.text(), /No pudimos verificar/);
  assert.equal(ui.refreshes(), 0);
  assert.equal(ui.button("Descartar borrador y elegir otro archivo"), undefined);
  for (const label of ["Tomar foto", "Subir archivo", "Carga manual"]) {
    await ui.button(label).props.onClick(); ui.render();
  }
  ui.button("Cerrar (conservar borrador)").props.onClick(); ui.render();
  ui.nodes()[0].props.onOpenChange(true); ui.render();
  header(ui, "Otro proveedor", "2025-01-01", "999");
  assert.equal(ui.find((node) => node.props?.id === "invoice-total").props.value, "125.50");
  assert.equal(ui.find((node) => node.props?.id === "invoice-total").props.disabled, true);
  assert.equal(ui.find((node) => node.props?.id === "invoice-supplier").props.value, "Proveedor");
  assert.equal(ui.find((node) => node.props?.id === "invoice-date").props.value, "2024-02-29");
  const quantity = ui.find((node) => node.props?.id === "invoice-line-0-quantity");
  quantity.props.onChange({ target: { value: "99" } });
  ui.render();
  assert.equal(ui.find((node) => node.props?.id === "invoice-line-0-quantity").props.value, "24");
  await ui.button("Reintentar confirmación").props.onClick();
  ui.render();
  assert.match(ui.text(), /Error recuperable/);
  assert.equal(ui.refreshes(), 0);
  assert.equal(ui.button("Descartar borrador y elegir otro archivo"), undefined);
  await ui.button("Reintentar confirmación").props.onClick();
  ui.render();
  assert.equal(ui.refreshes(), 1);
  assert.match(ui.text(), /Ingreso registrado/);
  assert.equal(ui.find((node) => node.props?.id === "invoice-total").props.value, "");
  assert.ok(ui.find((node) => node.props?.type === "file"));
  assert.equal(ui.button("Confirmar ingreso revisado"), undefined);
  assert.equal(calls[1].body, calls[2].body);
  assert.equal(calls[2].body, calls[3].body);
  assert.deepEqual(JSON.parse(calls[1].body), {
    batchId: JSON.parse(calls[1].body).batchId, reviewed: true, supplier: "Proveedor", date: "2024-02-29", totalAmount: 125.5, invoiceNumber: "A-123",
    lines: [{ productId: "pieces", quantity: 24, unitCost: 3.5, description: "2 cajas de 12 guantes" }],
  });
});

test("manual handler selects catalog quantity/add/remove, preserves headers across modes and confirms without analysis", async () => {
  const calls = [];
  const ui = clientHarness({ fetcher: async (url, options) => { calls.push({ url, ...options }); return reply({ ok: true, message: "Ingreso registrado" }); } });
  header(ui, "Proveedor manual", "2024-02-29");
  for (const label of ["Tomar foto", "Subir archivo", "Carga manual"]) {
    await ui.button(label).props.onClick(); ui.render();
    assert.equal(ui.find((node) => node.props?.id === "invoice-supplier").props.value, "Proveedor manual");
    assert.equal(ui.find((node) => node.props?.id === "invoice-date").props.value, "2024-02-29");
    assert.equal(ui.find((node) => node.props?.id === "invoice-total").props.value, "125.50");
  }
  ui.find((node) => node.type === "select").props.onChange({ target: { value: "pieces" } }); ui.render();
  ui.find((node) => node.props?.id === "invoice-line-0-quantity").props.onChange({ target: { value: "2.5" } }); ui.render();
  assert.equal(ui.find((node) => node.props?.id === "invoice-line-0-cost"), undefined);
  ui.button("Agregar producto").props.onClick(); ui.render();
  assert.equal(ui.nodes().filter((node) => node.type === "select").length, 6);
  assert.equal(ui.find((node) => node.props?.id === "invoice-line-1-product").props.value, "");
  ui.find((node) => node.props?.id === "invoice-line-1-product").props.onChange({ target: { value: "boxes" } }); ui.render();
  ui.find((node) => node.props?.id === "invoice-line-1-quantity").props.onChange({ target: { value: "3" } }); ui.render();
  ui.button("Agregar producto").props.onClick(); ui.render();
  ui.button("Quitar línea 3").props.onClick(); ui.render();
  assert.equal(ui.nodes().filter((node) => node.type === "select").length, 6);
  await ui.button("Confirmar ingreso revisado").props.onClick();
  assert.equal(calls.length, 0);
  checkReview(ui);
  await ui.button("Confirmar ingreso revisado").props.onClick(); ui.render();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/operations/inventory/invoice/confirm");
  assert.deepEqual(JSON.parse(calls[0].body), {
    batchId: JSON.parse(calls[0].body).batchId, reviewed: true, supplier: "Proveedor manual", date: "2024-02-29", totalAmount: 125.5, invoiceNumber: null,
    lines: [
      { productId: "pieces", quantity: 2.5, unitCost: null, description: "Guantes" },
      { productId: "boxes", quantity: 3, unitCost: null, description: "Guantes en caja" },
    ],
  });
  assert.equal(ui.refreshes(), 1);
});

test("analysis preserves manually entered headers even when extraction claims another supplier", async () => {
  const ui = clientHarness({ fetcher: async () => reply({ ok: true, draft: { ...draft(), supplier: "No usar", date: "2000-01-01", totalAmount: 999 } }) });
  header(ui, "Proveedor elegido", "2025-03-02"); await choose(ui); await ui.button("Analizar factura").props.onClick(); ui.render();
  assert.equal(ui.find((node) => node.props?.id === "invoice-supplier").props.value, "Proveedor elegido");
  assert.equal(ui.find((node) => node.props?.id === "invoice-date").props.value, "2025-03-02");
  assert.equal(ui.find((node) => node.props?.id === "invoice-total").props.value, "125.50");
  assert.equal(ui.find((node) => node.type === "table"), undefined);
  for (const text of ["Factura:", "Sugerencia original:", "Conversión sugerida:", "Costo por unidad de stock", "Incluir línea 1"]) assert.ok(ui.text().includes(text));
  assert.equal(ui.find((node) => node.props?.id === "invoice-line-0-cost").props.value, "3.5");
});

test("explicit configure-only product creation appends/selects product without transferring stock quantity or cost", async () => {
  let creates = 0;
  const ui = clientHarness({ configure: true,
    fetcher: async () => reply({ ok: true, draft: draft([line({ productId: null })]) }),
    createProduct: async (data) => {
      creates++;
      assert.equal(data.get("name"), "Cajas nuevas");
      assert.equal(data.get("unit"), "caja");
      assert.equal(data.get("minimumStock"), "0");
      return { ok: true, product: { id: "new-boxes", name: "Cajas nuevas", unit: "caja" }, message: "Producto creado" };
    },
  });
  await choose(ui);
  await ui.button("Analizar factura").props.onClick();
  ui.render();
  assert.equal(creates, 0);
  assert.doesNotMatch(ui.text(), /Crear producto no encontrado/);
  openProductCreation(ui);
  await ui.find((node) => node.type === "form").props.onSubmit({ preventDefault() {}, currentTarget: { values: { name: "Cajas nuevas", unit: "caja", minimumStock: "0" }, reset() {} } });
  ui.render();
  assert.equal(creates, 1);
  assert.equal(ui.refreshes(), 0);
  assert.equal(ui.find((node) => node.type === "select").props.value, "new-boxes");
  assert.ok(ui.find((node) => node.type === "option" && node.props.value === "new-boxes"));
  assert.equal(ui.find((node) => node.props?.id === "invoice-line-0-quantity").props.value, "");
  assert.equal(ui.find((node) => node.props?.id === "invoice-line-0-cost").props.value, "");
  assert.match(ui.text(), /El stock todavía no cambió/);
});


test("first server 500 freezes total and retries the identical batch", async () => {
  const calls = [];
  const ui = clientHarness({ fetcher: async (url, options) => {
    calls.push({ url, ...options });
    return calls.length === 1
      ? { ...reply({ ok: false, message: "No se pudo registrar el ingreso. Reintentá con el mismo lote." }, false), status: 500 }
      : { ...reply({ ok: true, message: "Ingreso registrado" }), status: 200 };
  } });
  ui.button("Carga manual").props.onClick(); ui.render();
  header(ui);
  ui.find((node) => node.type === "select").props.onChange({ target: { value: "pieces" } }); ui.render();
  ui.find((node) => node.props?.id === "invoice-line-0-quantity").props.onChange({ target: { value: "2" } }); ui.render();
  checkReview(ui);
  await ui.button("Confirmar ingreso revisado").props.onClick(); ui.render();
  const total = () => ui.find((node) => node.props?.id === "invoice-total");
  assert.equal(total().props.disabled, true);
  assert.equal(ui.button("Descartar borrador y elegir otro archivo"), undefined);
  assert.equal(ui.refreshes(), 0);
  total().props.onChange({ target: { value: "200" } }); ui.render();
  assert.equal(total().props.value, "125.50");
  ui.button("Carga manual").props.onClick(); ui.render();
  assert.equal(total().props.value, "125.50");
  await ui.button("Reintentar confirmación").props.onClick(); ui.render();
  assert.equal(calls.length, 2);
  assert.equal(calls[1].body, calls[0].body);
  assert.equal(JSON.parse(calls[1].body).totalAmount, 125.5);
  assert.equal(ui.refreshes(), 1);
  assert.equal(total().props.value, "");
});

test("verified first 400 rejection still permits correcting the manual total", async () => {
  const calls = [];
  const ui = clientHarness({ fetcher: async (url, options) => {
    calls.push({ url, ...options });
    return calls.length === 1
      ? reply({ ok: false, message: "Revisá los datos antes de confirmar." }, false)
      : reply({ ok: true, message: "Ingreso registrado" });
  } });
  ui.button("Carga manual").props.onClick(); ui.render();
  header(ui);
  ui.find((node) => node.type === "select").props.onChange({ target: { value: "pieces" } }); ui.render();
  ui.find((node) => node.props?.id === "invoice-line-0-quantity").props.onChange({ target: { value: "2" } }); ui.render();
  checkReview(ui);
  await ui.button("Confirmar ingreso revisado").props.onClick(); ui.render();
  const total = () => ui.find((node) => node.props?.id === "invoice-total");
  assert.equal(total().props.disabled, false);
  assert.ok(ui.button("Descartar borrador y elegir otro archivo"));
  assert.equal(ui.refreshes(), 0);
  total().props.onChange({ target: { value: "200" } }); ui.render();
  checkReview(ui);
  await ui.button("Confirmar ingreso revisado").props.onClick(); ui.render();
  assert.equal(calls.length, 2);
  assert.equal(JSON.parse(calls[1].body).totalAmount, 200);
  assert.notEqual(JSON.parse(calls[1].body).batchId, JSON.parse(calls[0].body).batchId);
  assert.equal(ui.refreshes(), 1);
});

test("intake has three real tabs with distinct panels and manual table in its own panel", () => {
  const ui = clientHarness();
  assert.equal(ui.nodes().filter((node) => node.props?.role === "tablist").length, 1);
  const tabs = () => ui.nodes().filter((node) => node.props?.role === "tab");
  assert.equal(tabs().length, 3);
  assert.equal(ui.nodes().filter((node) => node.props?.role === "tabpanel").length, 3);
  const labels = ["Tomar foto", "Subir archivo", "Carga manual"];
  for (const label of labels) {
    ui.button(label).props.onClick(); ui.render();
    const selected = tabs().filter((node) => node.props["aria-selected"]);
    assert.equal(selected.length, 1);
    assert.equal(selected[0].props.tabIndex, 0);
    const panels = ui.nodes().filter((node) => node.props?.role === "tabpanel" && !node.props.hidden);
    assert.equal(panels.length, 1);
    assert.equal(panels[0].props.id, selected[0].props["aria-controls"]);
    assert.equal(panels[0].props["aria-labelledby"], selected[0].props.id);
    const html = renderToStaticMarkup(panels[0]);
    if (label === "Carga manual") {
      assert.match(html, /<table/);
      assert.match(html, /<th[^>]*>Producto<\/th><th[^>]*>Cantidad<\/th>/);
      assert.match(html, /<td[^>]*><select/);
      assert.doesNotMatch(html, /Incluir línea|Costo por unidad de stock|Conversión sugerida/);
    } else assert.doesNotMatch(html, /<table/);
  }
});

test("tab keyboard navigation selects and focuses the next mode and wraps", () => {
  const ui = clientHarness();
  let focused = ""; let prevented = 0;
  const event = (key) => ({ key, preventDefault: () => prevented++, currentTarget: {
    parentElement: { querySelector: (selector) => ({ focus: () => { focused = selector; } }) },
  } });
  const tab = (label) => ui.button(label);
  assert.equal(typeof tab("Subir archivo").props.onKeyDown, "function");
  tab("Subir archivo").props.onKeyDown(event("ArrowRight")); ui.render();
  assert.equal(tab("Carga manual").props["aria-selected"], true);
  assert.equal(focused, '[data-mode="manual"]');
  tab("Carga manual").props.onKeyDown(event("ArrowRight")); ui.render();
  assert.equal(tab("Tomar foto").props["aria-selected"], true);
  tab("Tomar foto").props.onKeyDown(event("End")); ui.render();
  assert.equal(tab("Carga manual").props["aria-selected"], true);
  tab("Carga manual").props.onKeyDown(event("Home")); ui.render();
  assert.equal(tab("Tomar foto").props["aria-selected"], true);
  assert.equal(prevented, 4);
});

test("taking a photo keeps its review within the camera tab", async () => {
  const ui = clientHarness();
  ui.button("Tomar foto").props.onClick(); ui.render();
  const camera = ui.find((node) => node.props?.onCapture);
  await camera.props.onCapture({ type: "image/png", size: 1024, name: "captura.png" }); ui.render();
  assert.equal(ui.button("Tomar foto").props["aria-selected"], true);
  const panel = ui.find((node) => node.props?.role === "tabpanel" && !node.props.hidden);
  assert.equal(panel.props.id, "invoice-panel-camera");
  assert.ok(ui.button("Analizar factura"));
  assert.ok(ui.button("Volver a tomar foto"));
  assert.equal(ui.find((node) => node.props?.active === true), undefined);
});

test("manual spreadsheet starts with five rows and places add then total below the table", () => {
  const ui = clientHarness();
  ui.button("Carga manual").props.onClick(); ui.render();
  const rows = () => ui.nodes().filter((node) => node.type === "select");
  assert.equal(rows().length, 5);
  for (let i = 0; i < 5; i++) {
    assert.equal(rows()[i].props.value, "");
    assert.equal(ui.find((node) => node.props?.id === `invoice-line-${i}-quantity`).props.value, "");
  }
  const nodes = ui.nodes();
  assert.ok(nodes.indexOf(ui.find((node) => node.type === "table")) < nodes.indexOf(ui.button("Agregar producto")));
  assert.ok(nodes.indexOf(ui.button("Agregar producto")) < nodes.indexOf(ui.find((node) => node.props?.id === "invoice-total")));
  const panel = ui.find((node) => node.props?.role === "tabpanel" && !node.props.hidden);
  assert.match(renderToStaticMarkup(panel), /Total de la compra/);
  ui.button("Agregar producto").props.onClick(); ui.render();
  assert.equal(rows().length, 6);
  ui.button("Quitar línea 6").props.onClick(); ui.render();
  assert.equal(rows().length, 5);
});

test("spreadsheet controls are borderless and focus is on cells, not input outlines", () => {
  const ui = clientHarness();
  ui.button("Carga manual").props.onClick(); ui.render();
  const controls = ui.nodes().filter((node) => node.type === "select" || /^invoice-line-\d+-quantity$/.test(node.props?.id ?? ""));
  assert.equal(controls.length, 10);
  for (const control of controls) {
    for (const style of ["border-0", "rounded-none", "shadow-none", "outline-none", "focus:ring-0"]) assert.ok(control.props.className.includes(style), style);
    assert.doesNotMatch(control.props.className, /border-slate|rounded-md|focus:ring-[1-9]/);
    assert.ok(control.props["aria-label"]);
  }
  assert.match(ui.find((node) => node.type === "table").props.className, /border-collapse/);
  assert.ok(ui.nodes().some((node) => node.type === "td" && node.props.className.includes("focus-within:bg-")));
});

test("intake no longer renders explanatory legends in any mode", () => {
  const ui = clientHarness();
  for (const mode of ["Subir archivo", "Tomar foto", "Carga manual"]) {
    ui.button(mode).props.onClick(); ui.render();
    assert.doesNotMatch(ui.text(), /Cambiar la forma de ingreso|Completá proveedor|Máximo 4 MB finales|Ingresá la cantidad en la unidad|Verificá las unidades del catálogo|El total no se distribuye/);
  }
});

test("unused manual rows are omitted but partial and imported rows still block confirmation", () => {
  const base = review.editReviewHeader(review.emptyReview("manual"), { supplier: "Proveedor", date: "2024-02-29", totalAmount: "125.50" }, "header");
  const selected = review.editReviewLine(review.addManualLine(base, "b1"), 0, { productId: "pieces" }, "b2");
  const filled = review.editReviewLine(selected, 0, { quantity: "2" }, "b3");
  let five = filled;
  for (let i = 0; i < 4; i++) five = review.addManualLine(five, `b${i + 4}`);
  const ready = review.setReviewed(five, true);
  const result = payload(ready);
  assert.equal(result.ok, true);
  assert.equal(result.payload.lines.length, 1);
  for (const patch of [{ productId: "boxes" }, { quantity: "3" }, { unitCost: "1" }]) {
    assert.equal(payload(review.setReviewed(review.editReviewLine(ready, 1, patch, "partial"), true)).ok, false);
  }
  assert.equal(payload(review.setReviewed(review.addManualLine(base, "blank"), true)).ok, false);
  assert.equal(payload(review.setReviewed(state([line({ productId: null, stockQuantity: null })]), true)).ok, false);
});

test("manual table has only two columns and external icon buttons remove their own row", () => {
  const ui = clientHarness();
  ui.button("Carga manual").props.onClick(); ui.render();
  const table = () => ui.find((node) => node.type === "table");
  let html = renderToStaticMarkup(table());
  assert.equal((html.match(/<th\s/g) ?? []).length, 2);
  assert.equal((html.match(/<td\s/g) ?? []).length, 10);
  assert.doesNotMatch(html, /Acciones|Quitar línea|<button/);
  const remove = ui.button("Quitar línea 3");
  assert.ok(remove);
  assert.equal(remove.props.title, "Quitar línea 3");
  assert.equal(remove.props.size, "icon");
  assert.equal(remove.props.children.props["aria-hidden"], true);
  assert.ok(ui.find((node) => node.props?.id === remove.props["aria-controls"]));
  ui.find((node) => node.props?.id === "invoice-line-2-product").props.onChange({ target: { value: "pieces" } }); ui.render();
  ui.find((node) => node.props?.id === "invoice-line-3-product").props.onChange({ target: { value: "boxes" } }); ui.render();
  ui.button("Quitar línea 3").props.onClick(); ui.render();
  assert.equal(ui.nodes().filter((node) => node.type === "select").length, 4);
  assert.equal(ui.find((node) => node.props?.id === "invoice-line-2-product").props.value, "boxes");
  assert.equal(ui.nodes().filter((node) => /^Quitar línea/.test(node.props?.["aria-label"] ?? "")).length, 4);
});

test("product dialog cancels without changes and keeps errors open while guarding pending creation", async () => {
  let creates = 0;
  const pending = deferred();
  const ui = clientHarness({ configure: true, createProduct: () => { creates++; return pending.promise; } });
  ui.button("Carga manual").props.onClick(); ui.render();
  header(ui);
  ui.find((node) => node.props?.id === "invoice-line-2-product").props.onChange({ target: { value: "pieces" } }); ui.render();
  ui.find((node) => node.props?.id === "invoice-line-2-quantity").props.onChange({ target: { value: "4" } }); ui.render();
  openProductCreation(ui, 2);
  assert.equal(ui.find((node) => node.props?.id === "invoice-line-2-product").props.value, "pieces");
  ui.button("Cancelar creación").props.onClick(); ui.render();
  assert.equal(ui.find((node) => node.type === "form"), undefined);
  assert.equal(ui.find((node) => node.props?.id === "invoice-line-2-quantity").props.value, "4");
  assert.equal(creates, 0);
  openProductCreation(ui, 2);
  const submit = ui.find((node) => node.type === "form").props.onSubmit;
  const event = { preventDefault() {}, currentTarget: { reset() {} } };
  const saving = submit(event); ui.render();
  await submit(event);
  ui.button("Cancelar creación").props.onClick();
  ui.button("Subir archivo").props.onClick(); ui.render();
  assert.equal(creates, 1);
  assert.ok(ui.find((node) => node.type === "form"));
  assert.equal(ui.button("Carga manual").props["aria-selected"], true);
  pending.resolve({ ok: false, message: "Ya existe un producto con ese nombre y unidad." });
  await saving; ui.render();
  assert.ok(ui.find((node) => node.type === "form"));
  assert.match(ui.text(), /Ya existe un producto/);
  ui.button("Cancelar creación").props.onClick(); ui.render();
  assert.equal(ui.find((node) => node.props?.id === "invoice-line-2-quantity").props.value, "4");
  assert.equal(ui.find((node) => node.props?.id === "invoice-total").props.value, "125.50");
});
