import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as paymentAllocation from "../../src/modules/families/lib/payment-allocation.ts";

const require = createRequire(import.meta.url);
const base = "@/modules/families/components/";
const charges = [
  { id: "a", description: "Cuota marzo", occurredAt: "2026-03-01T12:00:00Z", amount: "100.00", outstandingAmount: "100.00" },
  { id: "b", description: "Salida", occurredAt: "2026-03-02T12:00:00Z", amount: "80.00", outstandingAmount: "80.00" },
];
const credit = (type = "PAYMENT", amount = "70.00") => ({
  id: "legacy", type, description: "Anterior", occurredAt: "2026-02-01T12:00:00Z",
  amount: `-${amount}`, unallocatedAmount: amount,
});
const paymentEntry = {
  id: "p", type: "PAYMENT", amount: "-70", grossAmount: null, discountAmount: null,
  description: "Pago anterior", occurredAt: "2026-03-08T12:00:00Z",
  payment: {
    id: "payment", method: "CASH", reference: "Ref", status: "REGISTERED",
    receipt: { id: "receipt", status: "ACTIVE", pdfUrl: "/pdf", number: 8 },
  },
};
const family = (credits = []) => ({
  id: "family", name: "Familia", balance: "180.00", entries: [],
  pendingCharges: charges, unallocatedCredits: credits,
});
const plain = (value) => JSON.parse(JSON.stringify(value));

function loader(overrides = {}, globals = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const source = readFileSync(new URL(`../../src/modules/families/components/${file}.tsx`, import.meta.url), "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022, esModuleInterop: true,
      },
    }).outputText;
    const mod = { exports: {} };
    const pass = ({ children, className }) => React.createElement("div", { className }, children);
    vm.runInNewContext(output, {
      ...globals, FormData: globals.FormData ?? FormData, module: mod, exports: mod.exports,
      require(id) {
        if (Object.hasOwn(overrides, id)) return overrides[id];
        if (["react", "react/jsx-runtime", "lucide-react"].includes(id)) return require(id);
        if (id.startsWith(base)) return load(id.slice(base.length));
        if (id.startsWith("./family-")) return load(id.slice(2));
        if (id === "next/navigation") return { useRouter: () => ({ refresh() {} }) };
        if (id.endsWith("ui/input")) return { Input: (props) => React.createElement("input", props) };
        if (id.endsWith("ui/textarea")) return { Textarea: (props) => React.createElement("textarea", props) };
        if (id.endsWith("ui/button")) return {
          Button: ({ render, nativeButton, children, ...props }) => {
            void nativeButton;
            return render ? React.cloneElement(render, props, children) : React.createElement("button", props, children);
          },
        };
        if (id.endsWith("ui/dropdown-menu")) return {
          DropdownMenu: ({ children }) => React.createElement("div", { "data-menu": true }, children),
          DropdownMenuTrigger: ({ render, children, ...props }) => React.cloneElement(render, props, children),
          DropdownMenuContent: ({ children }) => React.createElement("div", { role: "menu" }, children),
          DropdownMenuItem: ({ children, ...props }) => React.createElement("button", { ...props, role: "menuitem" }, children),
        };
        if (id.endsWith("ui/responsive-dialog")) return new Proxy({}, {
          get: (_, name) => name === "ResponsiveDialog"
            ? ({ open, children, onOpenChange }) => open ? React.createElement("dialog", { open, onOpenChange }, children) : null
            : pass,
        });
        if (id.endsWith("lib/payment-allocation")) return paymentAllocation;
        if (id.endsWith("annual-plan")) return { BILLING_MONTHS: [] };
        if (id.endsWith("plan-discounts")) return { calculatePlanDiscount: () => null };
        return new Proxy({}, { get: () => pass });
      },
    });
    cache.set(file, mod.exports);
    return mod.exports;
  }
  return load;
}
const load = loader();
const fields = () => load("family-payment-allocation-fields");

// Deterministic React callback/hook harness, NOT a browser or a DOM simulation.
// Primitives are stubbed; actual family components and their callbacks are executed.
function harness({ credits = [], canManagePayments = true, canWaive = true, balance = "180.00", pending = false, result, chargeList = charges, entries = [], futureCharges = [], confirmVoid = true, onFinancialChange } = {}) {
  const states = new Map();
  let current;
  let cursor;
  let tree;
  let refreshes = 0;
  let resets = 0;
  const calls = [];
  const transitions = [];
  const hooks = {
    ...React,
    useState(initial) {
      const slots = current;
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
      return [slots[i], (value) => {
        slots[i] = typeof value === "function" ? value(slots[i]) : value;
      }];
    },
    useRef(initial) {
      const slots = current;
      const i = cursor++;
      if (!(i in slots)) slots[i] = { current: initial };
      return slots[i];
    },
    useTransition: () => [pending, (fn) => transitions.push(fn())],
  };
  class Form {
    constructor(form) { this.data = new Map(Object.entries(form?.values ?? {})); }
    set(k, v) { this.data.set(k, v); }
    get(k) { return this.data.get(k); }
  }
  const action = (name) => async (data) => {
    calls.push({ name, data: Object.fromEntries(data.data) });
    return result ? result() : { ok: true, message: "Guardado" };
  };
  const component = loader({
    react: hooks,
    "next/navigation": { useRouter: () => ({ refresh: () => refreshes++ }) },
    "@/modules/families/server/family-account.actions": {
      registerFamilyPaymentAction: action("payment"), reconcileFamilyCreditAction: action("reconcile"),
      registerFamilyEventualChargeAction: action("charge"), waiveFamilyBalanceAction: action("waive"),
      voidFamilyPaymentAction: action("void"),
    },
  }, { FormData: Form, window: { confirm: () => confirmVoid } })("family-financial-card").FamilyFinancialCard;

  function expand(node, path, active) {
    if (Array.isArray(node)) return node.map((child, i) => expand(child, `${path}/${child?.key ?? i}`, active));
    if (!node || typeof node !== "object") return node;
    if (typeof node.type === "function") {
      const key = `${path}/${node.type.name}`;
      active.add(key);
      if (!states.has(key)) states.set(key, []);
      const previous = current;
      const previousCursor = cursor;
      current = states.get(key);
      cursor = 0;
      const rendered = node.type(node.props);
      current = previous;
      cursor = previousCursor;
      return expand(rendered, key, active);
    }
    return { ...node, props: { ...node.props, children: expand(node.props?.children, `${path}/children`, active) } };
  }
  function nodes(node) {
    if (Array.isArray(node)) return node.flatMap(nodes);
    return !node || typeof node !== "object" ? [] : [node, ...nodes(node.props?.children)];
  }
  function text(node) {
    if (Array.isArray(node)) return node.map(text).join("");
    if (node && typeof node === "object") return text(node.props?.children);
    return node == null || typeof node === "boolean" ? "" : String(node);
  }
  const api = {
    render() {
      const active = new Set();
      tree = expand(React.createElement(component, {
        family: { ...family(credits), balance, pendingCharges: chargeList, entries, futureCharges },
        eventualChargeItems: [], canManagePayments, canWaive, onFinancialChange,
      }), "root", active);
      for (const key of states.keys()) if (!active.has(key)) states.delete(key);
      return api;
    },
    update(nextCredits, nextCharges) { credits = nextCredits; chargeList = nextCharges; return api.render(); },
    setPending(value) { pending = value; return api.render(); },
    nodes: () => nodes(tree),
    find: (fn) => nodes(tree).find(fn),
    text: () => text(tree),
    button: (label) => nodes(tree).find((n) => n.type === "button" && text(n) === label),
    input: (label) => nodes(tree).find((n) => n.type === "input" && n.props["aria-label"] === label),
    calls, refreshes: () => refreshes, resets: () => resets,
    form: {
      values: { familyId: "family", amount: "120.00", method: "BANK_TRANSFER", reference: "Original", paidAt: "2026-03-08" },
      reportValidity: () => true, reset: () => resets++,
    },
    async submit(form, target = api.form) {
      assert.ok(form, "expected form is rendered");
      await form.props.onSubmit({ preventDefault() {}, currentTarget: target });
      await Promise.all(transitions);
      api.render();
    },
    choose(id, value) {
      const box = api.find((n) => n.type === "input" && n.props.type === "checkbox" && n.props.value === id);
      box.props.onChange({ target: { checked: true } });
      api.render();
      api.input(`Importe para ${charges.find((c) => c.id === id).description}`).props.onChange({ target: { value } });
      api.render();
    },
  };
  return api.render();
}
const paymentForm = (ui) => ui.find((n) => n.type === "form" && n.props["aria-label"] === "Registrar pago");
const dialogForm = (ui) => ui.find((n) => n.type === "form" && n.props["aria-label"] === "Asignar conceptos");

// S3/S4: pure behavior assertions exercise the same public helpers the fields/dialog use.
test("integer-cent allocation rules: single, multiple, partial, no automatic selection and zero remaining gate", () => {
  const { allocationSummary } = fields();
  const check = (values, total = "120.00", partial = false) => allocationSummary(charges, values, total, partial);
  assert.equal(check({}).valid, false);
  assert.equal(check({ a: "100.00" }).remainingCents, 2000);
  assert.equal(check({ a: "100.00" }).valid, false);
  assert.equal(check({ a: "100.00", b: "20.00" }).valid, true);
  assert.deepEqual(plain(check({ a: "40.01", b: "79.99" }).allocations), [
    { chargeEntryId: "a", amount: "40.01" }, { chargeEntryId: "b", amount: "79.99" },
  ]);
  assert.equal(check({ a: "70" }, "70").valid, true);
  assert.equal(check({ a: "10" }, "70", true).valid, true);
  const invalid = [
    { a: "0" }, { a: "" }, { a: "-1" }, { a: "101" }, { a: "1.001" }, { a: "NaN" },
    { a: "1e2" }, { a: "9007199254740992" }, { unknown: "120" }, { a: "100", b: "80" },
  ];
  for (const values of invalid) {
    const before = JSON.stringify(values);
    assert.equal(check(values).valid, false, before);
    assert.equal(JSON.stringify(values), before);
  }
});

test("payment and reconciliation dialogs explicitly use Montserrat across portal content and title", () => {
  const { FamilyPaymentDialog } = load("family-payment-dialog");
  for (const allowPartial of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(FamilyPaymentDialog, {
      total: "70.00", charges, title: "Asignar conceptos", description: "Detalle",
      allowPartial, onConfirm: async () => ({ ok: true, message: "Guardado" }),
      onClose() {}, onSuccess() {},
    }));
    assert.equal(html.split("[font-family:var(--font-montserrat)]").length - 1, 2,
      "the portal content and heading must each declare Montserrat instead of inheriting dashboard styles");
    for (const label of ["Total", "Asignado", "Restante", "Cancelar", allowPartial ? "Confirmar conciliación" : "Confirmar pago"]) {
      assert.ok(html.includes(label));
    }
  }
});

test("Argentina date default does not drift to UTC tomorrow", () => {
  assert.equal(fields().argentinaToday(new Date("2026-03-09T01:30:00Z")), "2026-03-08");
  assert.equal(fields().argentinaToday(new Date("2026-03-09T04:00:00Z")), "2026-03-09");
  assert.equal(fields().formatFamilyEntryDate("2026-03-09T01:30:00Z"), "8/3/2026");
});

test("SSR exposes required date immediately beside Registrar pago and preserves history/charge/waiver UI", () => {
  const { FamilyFinancialCard } = load("family-financial-card");
  const html = renderToStaticMarkup(React.createElement(FamilyFinancialCard, {
    family: family(), eventualChargeItems: [], canManagePayments: true, canWaive: true,
  }));
  assert.match(html, /<input(?=[^>]*name="paidAt")(?=[^>]*required="")[^>]*\/?>.*?<\/label><button[^>]*>Registrar pago/s);
  assert.match(html, /type="date"/);
  assert.match(html, /^<section[^>]*class="[^"]*bg-white/);
  assert.ok(html.includes("Ficha financiera") && html.includes("Cargos y movimientos") && html.includes("<table"), "the same white financial section contains payment controls and the table");
  for (const label of ["Agregar cargo", "Condonar saldo", "Todavía no hay movimientos registrados", "Referencia", "Medio"]) {
    assert.ok(html.includes(label));
  }
});

test("charge form opens from the financial menu right of balance, uses Montserrat and cancels without writes", () => {
  const ui = harness();
  assert.equal(ui.button("Registrar cargo"), undefined);
  const { FamilyFinancialCard } = load("family-financial-card");
  const html = renderToStaticMarkup(React.createElement(FamilyFinancialCard, {
    family: family(), eventualChargeItems: [], canManagePayments: true, canWaive: true,
  }));
  assert.match(html, /Saldo actual.*<button[^>]*aria-label="Opciones de la ficha financiera"[^>]*>.*lucide-ellipsis-vertical/s);
  assert.doesNotMatch(html, /<button[^>]*>Acciones/, "the menu trigger must not display the word Acciones");
  const menu = ui.find((n) => n.props.role === "menu");
  assert.ok(menu);
  assert.equal(ui.button("Agregar cargo").props.role, "menuitem");
  assert.equal(ui.button("Condonar saldo").props.role, "menuitem");
  assert.equal(ui.find((n) => n.type === "textarea" && n.props.name === "reason"), undefined);
  ui.button("Agregar cargo").props.onClick();
  ui.render();
  assert.ok(ui.find((n) => n.type === "dialog"));
  assert.ok(ui.button("Registrar cargo"));
  assert.equal(ui.nodes().filter((n) => n.props.className?.includes("[font-family:var(--font-montserrat)]")).length, 2);
  const form = ui.find((n) => n.type === "form" && n.props["aria-label"] === "Registrar cargo");
  assert.ok(form);
  assert.ok(ui.find((n) => n.type === "input" && n.props.name === "description" && n.props.required));
  assert.ok(ui.find((n) => n.type === "input" && n.props.name === "amount" && n.props.min === "0.01"));
  ui.button("Cancelar").props.onClick();
  ui.render();
  assert.equal(ui.button("Registrar cargo"), undefined);
  assert.equal(ui.calls.length, 0);
  assert.equal(ui.refreshes(), 0);
  assert.equal(harness({ canManagePayments: false }).button("Agregar cargo"), undefined);
});

test("charge submission preserves payload, refreshes on success and keeps errors in the dialog", async () => {
  for (const ok of [true, false]) {
    const ui = harness({ result: async () => ({ ok, message: ok ? "Cargo guardado" : "Revisá el importe" }) });
    ui.button("Agregar cargo").props.onClick();
    ui.render();
    const form = ui.find((n) => n.type === "form" && n.props["aria-label"] === "Registrar cargo");
    const values = { familyId: "family", eventualChargeItemId: "", description: "Salida educativa", amount: "2500.00" };
    await ui.submit(form, { ...ui.form, values });
    assert.deepEqual(ui.calls, [{ name: "charge", data: values }]);
    assert.equal(Boolean(ui.button("Registrar cargo")), !ok);
    assert.equal(ui.refreshes(), ok ? 1 : 0);
    assert.equal(ui.resets(), ok ? 1 : 0);
    assert.ok(ui.text().includes(ok ? "Cargo guardado" : "Revisá el importe"));
  }
});

test("submit validates, captures original fields, opens empty draft; cancel writes nothing", async () => {
  const ui = harness();
  await ui.submit(paymentForm(ui), { ...ui.form, reportValidity: () => false });
  assert.equal(ui.find((n) => n.type === "dialog"), undefined);
  await ui.submit(paymentForm(ui));
  assert.ok(dialogForm(ui));
  assert.equal(ui.calls.length, 0);
  assert.equal(ui.button("Confirmar pago").props.disabled, true);
  assert.ok(ui.nodes().filter((n) => n.props?.type === "checkbox").every((n) => !n.props.checked));
  ui.button("Cancelar").props.onClick();
  ui.render();
  assert.equal(dialogForm(ui), undefined);
  assert.equal(ui.calls.length, 0);
  assert.equal(ui.resets(), 0);
  assert.equal(ui.refreshes(), 0);
});

test("selecting a charge defaults to its pending amount capped by remaining payment and stays editable", async () => {
  for (const reconciliation of [false, true]) {
    const ui = harness({ credits: reconciliation ? [credit("PAYMENT", "120.00")] : [] });
    if (reconciliation) {
      ui.button("Conciliar pago").props.onClick();
      ui.render();
    } else await ui.submit(paymentForm(ui));
    const toggle = (id, checked) => {
      ui.find((n) => n.props.type === "checkbox" && n.props.value === id).props.onChange({ target: { checked } });
      ui.render();
    };
    assert.ok(ui.nodes().filter((n) => n.props.type === "checkbox").every((n) => !n.props.checked));
    toggle("a", true);
    assert.equal(ui.input("Importe para Cuota marzo").props.value, "100.00");
    toggle("b", true);
    assert.equal(ui.input("Importe para Salida").props.value, "20.00");
    assert.equal(ui.button(reconciliation ? "Confirmar conciliación" : "Confirmar pago").props.disabled, false);
    ui.input("Importe para Cuota marzo").props.onChange({ target: { value: "60.25" } });
    ui.render();
    assert.equal(ui.input("Importe para Cuota marzo").props.value, "60.25");
    assert.equal(ui.input("Importe para Salida").props.value, "20.00", "editing does not overwrite other allocations");
    toggle("b", false);
    assert.equal(ui.input("Importe para Salida").props.value, "");
    toggle("b", true);
    assert.equal(ui.input("Importe para Salida").props.value, "59.75", "reselection uses the current remaining amount in exact cents");
    assert.equal(ui.input("Importe para Cuota marzo").props.value, "60.25");
    toggle("a", false);
    toggle("b", false);
    assert.equal(ui.input("Importe para Cuota marzo").props.value, "");
    assert.equal(ui.input("Importe para Salida").props.value, "");
    assert.equal(ui.calls.length, 0, "selection and editing never save without confirmation");
  }
});

test("selection cannot default beyond zero remaining or a partially paid charge balance", async () => {
  const ui = harness({ chargeList: [{ ...charges[0], outstandingAmount: "25.35" }, charges[1]] });
  ui.form.values.amount = "25.35";
  await ui.submit(paymentForm(ui));
  for (const id of ["a", "b"]) {
    ui.find((n) => n.props.type === "checkbox" && n.props.value === id).props.onChange({ target: { checked: true } });
    ui.render();
  }
  assert.equal(ui.input("Importe para Cuota marzo").props.value, "25.35", "defaults to pending debt, not original charge amount");
  assert.equal(ui.input("Importe para Salida").props.value, "0.00");
  assert.equal(ui.button("Confirmar pago").props.disabled, true, "a selected zero allocation remains invalid");
  assert.equal(ui.calls.length, 0);
});

test("multiple explicit amounts enable confirmation only at zero, use frozen payment fields, reset/refresh on success", async () => {
  const ui = harness();
  await ui.submit(paymentForm(ui));
  ui.form.values.amount = "999";
  ui.form.values.reference = "Changed";
  ui.choose("a", "100");
  assert.equal(ui.button("Confirmar pago").props.disabled, true);
  const totals = ui.find((n) => n.props.role === "status" && n.props["aria-live"] === "polite");
  const formatted = JSON.stringify(totals);
  for (const cents of [12000, 10000, 2000]) assert.ok(formatted.includes(fields().currencyCents(cents)));
  ui.choose("b", "20");
  assert.equal(ui.button("Confirmar pago").props.disabled, false);
  assert.equal(ui.input("Importe para Salida").props.max, "20.00");
  await ui.submit(dialogForm(ui));
  assert.deepEqual(ui.calls, [{
    name: "payment", data: {
      familyId: "family", amount: "120.00", method: "BANK_TRANSFER", reference: "Original", paidAt: "2026-03-08",
      allocations: '[{"chargeEntryId":"a","amount":"100.00"},{"chargeEntryId":"b","amount":"20.00"}]',
    },
  }]);
  assert.equal(dialogForm(ui), undefined);
  assert.equal(ui.resets(), 1);
  assert.equal(ui.refreshes(), 1);
});

test("single partial debt payment preserves each existing method and optional reference", async () => {
  for (const method of ["CASH", "BANK_TRANSFER", "CARD", "OTHER"]) {
    const ui = harness();
    ui.form.values = { ...ui.form.values, amount: "70", method, reference: "" };
    await ui.submit(paymentForm(ui));
    ui.choose("a", "70");
    assert.equal(ui.button("Confirmar pago").props.disabled, false);
    await ui.submit(dialogForm(ui));
    assert.deepEqual(ui.calls, [{ name: "payment", data: {
      familyId: "family", amount: "70", method, reference: "", paidAt: "2026-03-08",
      allocations: '[{"chargeEntryId":"a","amount":"70.00"}]',
    } }]);
    assert.equal(ui.refreshes(), 1);
    assert.equal(ui.resets(), 1);
  }
});

test("invalid amounts and native invalid form cannot write; deselecting removes an allocation", async () => {
  const ui = harness();
  ui.form.values.amount = "70";
  await ui.submit(paymentForm(ui));
  for (const value of ["", "0", "-1", "100.01", "70.01", "0.001"]) {
    ui.choose("a", value);
    assert.equal(ui.button("Confirmar pago").props.disabled, true, value);
    await ui.submit(dialogForm(ui));
    assert.equal(ui.calls.length, 0);
    assert.equal(ui.resets(), 0);
    assert.equal(ui.refreshes(), 0);
  }
  ui.choose("a", "70");
  await ui.submit(dialogForm(ui), { reportValidity: () => false });
  assert.equal(ui.calls.length, 0);
  const box = ui.find((n) => n.props.type === "checkbox" && n.props.value === "a");
  box.props.onChange({ target: { checked: false } });
  ui.render();
  assert.equal(ui.input("Importe para Cuota marzo").props.value, "");
  assert.equal(ui.input("Importe para Cuota marzo").props.disabled, true);
  assert.equal(ui.button("Confirmar pago").props.disabled, true);
});

test("pending blocks duplicate confirm and dismissal; server and transport errors preserve draft", async () => {
  let resolve;
  let mode = "pending";
  const ui = harness({ result: () => mode === "pending"
    ? new Promise((yes) => { resolve = yes; })
    : Promise.reject(new Error("offline")),
  });
  ui.form.values.amount = "70";
  await ui.submit(paymentForm(ui));
  ui.choose("a", "70");
  const form = dialogForm(ui);
  const first = ui.submit(form);
  ui.render();
  assert.equal(ui.button("Confirmar pago").props.disabled, true);
  assert.equal(ui.input("Importe para Cuota marzo").props.disabled, true);
  ui.button("Cancelar").props.onClick();
  ui.find((n) => n.type === "dialog").props.onOpenChange(false);
  ui.render();
  assert.ok(dialogForm(ui));
  await ui.submit(form);
  assert.equal(ui.calls.length, 1);
  resolve({ ok: false, message: "Saldo actualizado; revisá los conceptos." });
  await first;
  assert.ok(ui.text().includes("Saldo actualizado"));
  assert.equal(ui.input("Importe para Cuota marzo").props.value, "70");
  assert.equal(ui.refreshes(), 0);
  assert.equal(ui.resets(), 0);
  mode = "throw";
  await ui.submit(dialogForm(ui));
  assert.ok(dialogForm(ui));
  assert.ok(ui.find((n) => n.props.role === "alert"));
  assert.equal(ui.input("Importe para Cuota marzo").props.value, "70");
  assert.equal(ui.refreshes(), 0);
  assert.equal(ui.resets(), 0);
});

test("legacy credits gate new payments, reconcile partially and respect waiver permissions", async () => {
  const ui = harness({ credits: [credit()] });
  assert.equal(ui.button("Registrar pago").props.disabled, true);
  await ui.submit(paymentForm(ui));
  assert.equal(dialogForm(ui), undefined);
  ui.button("Conciliar pago").props.onClick();
  ui.render();
  assert.equal(ui.button("Confirmar conciliación").props.disabled, true);
  ui.choose("a", "20");
  assert.equal(ui.button("Confirmar conciliación").props.disabled, false);
  await ui.submit(dialogForm(ui));
  assert.deepEqual(ui.calls, [{ name: "reconcile", data: {
    familyId: "family", creditEntryId: "legacy",
    allocations: '[{"chargeEntryId":"a","amount":"20.00"}]',
  } }]);
  assert.equal(ui.refreshes(), 1);
  assert.equal(ui.button("Registrar pago").props.disabled, true, "stale credit remains gated until refreshed backend state arrives");
  ui.update([], [{ ...charges[0], outstandingAmount: "80.00" }]);
  assert.equal(ui.button("Registrar pago").props.disabled, false);
  await ui.submit(paymentForm(ui));
  ui.choose("a", "80");
  assert.equal(ui.input("Importe para Cuota marzo").props.max, "80.00");

  const blocked = harness({ credits: [credit("BALANCE_WAIVER")], canWaive: false });
  assert.equal(blocked.button("Conciliar condonación").props.disabled, true);
  assert.ok(blocked.text().includes("permiso para condonar"));
  blocked.button("Conciliar condonación").props.onClick();
  blocked.render();
  assert.equal(dialogForm(blocked), undefined);
  const allowed = harness({ credits: [credit("BALANCE_WAIVER")] });
  allowed.button("Conciliar condonación").props.onClick();
  allowed.render();
  allowed.choose("a", "70");
  await allowed.submit(dialogForm(allowed));
  assert.equal(allowed.calls[0].name, "reconcile");
});

test("reconciliation errors retain selected debt amounts and cancel performs no further writes", async () => {
  const ui = harness({ credits: [credit()], result: () => ({ ok: false, message: "Revisá los conceptos." }) });
  ui.button("Conciliar pago").props.onClick();
  ui.render();
  ui.choose("a", "20");
  await ui.submit(dialogForm(ui));
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.calls[0].name, "reconcile");
  assert.ok(ui.text().includes("Revisá los conceptos."));
  assert.equal(ui.input("Importe para Cuota marzo").props.value, "20");
  assert.equal(ui.refreshes(), 0);
  assert.equal(ui.resets(), 0);
  ui.button("Cancelar").props.onClick();
  ui.render();
  assert.equal(dialogForm(ui), undefined);
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.button("Registrar pago").props.disabled, true);
});

test("insufficient historical charges surface manual review, never invent debt or auto-allocate", () => {
  const ui = harness({ credits: [credit("PAYMENT", "200.00")] });
  assert.ok(ui.text().includes("revisión manual"));
  ui.button("Conciliar pago").props.onClick();
  ui.render();
  assert.equal(ui.nodes().filter((n) => n.props.type === "checkbox").length, 2);
  assert.equal(ui.button("Confirmar conciliación").props.disabled, true);
  assert.equal(ui.calls.length, 0);
  const noDebt = harness({ credits: [credit()], chargeList: [] });
  assert.equal(noDebt.button("Conciliar pago").props.disabled, true);
  assert.equal(noDebt.button("Registrar pago").props.disabled, true);
  assert.ok(noDebt.text().includes("revisión manual"));
});

test("long debt lists retain mobile scroll-container and pinned totals/footer structure", async () => {
  const chargeList = Array.from({ length: 40 }, (_, i) => ({ ...charges[0], id: `debt-${i}` }));
  const ui = harness({ chargeList });
  await ui.submit(paymentForm(ui));
  assert.equal(ui.nodes().filter((n) => n.props.type === "checkbox").length, 40);
  assert.ok(ui.find((n) => n.props.className?.includes("overscroll-contain")));
  assert.ok(ui.find((n) => n.props.className?.includes("sticky top-0")));
  assert.ok(ui.find((n) => n.props.className?.includes("sticky bottom-0")));
  assert.ok(dialogForm(ui).props.className.includes("min-h-0"));
});

test("existing charge, waiver, void and receipt behaviors remain available", async () => {
  const ui = harness({ entries: [paymentEntry] });
  ui.button("Agregar cargo").props.onClick();
  ui.render();
  const originalPayloads = [
    { familyId: "family", amount: "25", description: "Extra" },
    { familyId: "family", amount: "10", reason: "Motivo" },
    { paymentId: "payment", reason: "Error" },
  ];
  await ui.submit(ui.find((n) => n.props["aria-label"] === "Registrar cargo"), { values: originalPayloads[0], reportValidity: () => true, reset() {} });
  ui.button("Condonar saldo").props.onClick();
  ui.render();
  await ui.submit(ui.find((n) => n.props["aria-label"] === "Condonar saldo" && n.type === "form"), { values: originalPayloads[1], reportValidity: () => true, reset() {} });
  await ui.submit(ui.nodes().filter((n) => n.type === "form").at(-1), { values: originalPayloads[2], reportValidity: () => true, reset() {} });
  assert.deepEqual(ui.calls, originalPayloads.map((data, i) => ({ name: ["charge", "waive", "void"][i], data })));
  assert.equal(ui.refreshes(), 3);
  const cancelled = harness({ entries: [paymentEntry], confirmVoid: false });
  await cancelled.submit(cancelled.nodes().filter((n) => n.type === "form").at(-1));
  assert.equal(cancelled.calls.length, 0);
  assert.equal(cancelled.refreshes(), 0);
  const { FamilyFinancialCard } = load("family-financial-card");
  const html = renderToStaticMarkup(React.createElement(FamilyFinancialCard, {
    family: { ...family(), entries: [paymentEntry] }, eventualChargeItems: [], canManagePayments: true, canWaive: true,
  }));
  for (const text of ["Anular", "Recibo #8", "/api/receipts/receipt/download", "Efectivo", "Ref", "Pago anterior"]) {
    assert.ok(html.includes(text));
  }
  const readOnly = harness({ canManagePayments: false, canWaive: false });
  assert.equal(readOnly.button("Registrar pago"), undefined);
  assert.equal(readOnly.button("Registrar cargo"), undefined);
  assert.equal(readOnly.button("Condonar saldo"), undefined);
});


test("financial mutations notify client-owned detail loaders after payment and reconciliation", async () => {
  let reloads = 0;
  const ui = harness({ onFinancialChange: () => reloads++ });
  ui.form.values.amount = "40";
  await ui.submit(paymentForm(ui));
  ui.choose("a", "40");
  await ui.submit(dialogForm(ui));
  assert.equal(reloads, 1);
  const legacy = harness({ credits: [credit()], onFinancialChange: () => reloads++ });
  legacy.button("Conciliar pago").props.onClick();
  legacy.render();
  legacy.choose("a", "20");
  await legacy.submit(dialogForm(legacy));
  assert.equal(reloads, 2);
});


test("waiver opens only in its responsive dialog and cancel never writes", () => {
  const ui = harness();
  assert.equal(ui.find((n) => n.type === "form" && n.props["aria-label"] === "Condonar saldo"), undefined);
  ui.button("Condonar saldo").props.onClick();
  ui.render();
  assert.ok(ui.find((n) => n.type === "dialog"));
  assert.ok(ui.find((n) => n.type === "textarea" && n.props.name === "reason" && n.props.required && n.props.minLength === 2 && n.props.maxLength === 300));
  assert.ok(ui.find((n) => n.type === "input" && n.props.name === "amount" && n.props.max === "180.00" && n.props.min === "0.01"));
  assert.equal(ui.nodes().filter((n) => n.props.className?.includes("[font-family:var(--font-montserrat)]")).length, 2);
  ui.setPending(true);
  assert.equal(ui.button("Cancelar").props.disabled, true);
  ui.button("Cancelar").props.onClick();
  ui.find((n) => n.type === "dialog").props.onOpenChange(false);
  ui.render();
  assert.ok(ui.find((n) => n.type === "dialog"));
  ui.setPending(false);
  ui.button("Cancelar").props.onClick();
  ui.render();
  assert.equal(ui.find((n) => n.type === "dialog"), undefined);
  assert.deepEqual(ui.calls, []);
  assert.equal(ui.refreshes(), 0);
  for (const options of [{ canWaive: false }, { balance: "0" }, { balance: "-10" }]) {
    assert.equal(harness(options).button("Condonar saldo"), undefined);
  }
  const waiverOnly = harness({ canManagePayments: false });
  assert.equal(waiverOnly.button("Agregar cargo"), undefined);
  waiverOnly.button("Condonar saldo").props.onClick();
  waiverOnly.render();
  assert.ok(waiverOnly.find((n) => n.type === "dialog"));
  assert.equal(harness({ canManagePayments: false, canWaive: false }).find((n) => n.props["aria-label"] === "Opciones de la ficha financiera"), undefined);
});

test("waiver dialog preserves the payload, keeps failures open and refreshes only on success", async () => {
  for (const mode of ["success", "server", "transport"]) {
    let reloads = 0;
    const ui = harness({ onFinancialChange: () => reloads++, result: () => {
      if (mode === "transport") throw new Error("offline");
      return { ok: mode === "success", message: mode === "success" ? "Condonación guardada" : "Revisá el saldo" };
    } });
    ui.button("Condonar saldo").props.onClick();
    ui.render();
    const form = ui.find((n) => n.type === "form" && n.props["aria-label"] === "Condonar saldo");
    const values = { familyId: "family", amount: "10.00", reason: "Acuerdo familiar" };
    await ui.submit(form, { ...ui.form, values });
    assert.deepEqual(ui.calls, [{ name: "waive", data: values }]);
    assert.equal(Boolean(ui.find((n) => n.type === "dialog")), mode !== "success");
    assert.equal(ui.refreshes(), mode === "success" ? 1 : 0);
    assert.equal(ui.resets(), mode === "success" ? 1 : 0);
    assert.equal(reloads, mode === "success" ? 1 : 0);
    if (mode !== "success") assert.ok(ui.find((n) => n.props.role === "alert"));
    else assert.ok(ui.text().includes("Condonación guardada"));
  }
});


test("charge table defaults to all and filters pending including partial, future and paid without accounting writes", () => {
  const entry = (id, description, amount = "100.00") => ({ id, type: "EVENTUAL_CHARGE", amount, grossAmount: null, discountAmount: null, description, occurredAt: "2026-10-15T12:00:00Z", payment: null });
  const entries = [entry("a", "Cargo pendiente"), entry("b", "Cargo parcial", "80.00"), entry("paid", "Cargo saldado", "20.00"), entry("zero", "Sin costo", "0.00"), paymentEntry];
  const futureCharges = [{ ...entry("future:s:2", "Cuota noviembre", "33.34"), occurredAt: "2026-11-01T00:00:00Z", isFuture: true }];
  const chargeList = [charges[0], { ...charges[1], outstandingAmount: "30.00" }];
  const before = JSON.stringify({ entries, futureCharges, chargeList });
  const ui = harness({ entries, futureCharges, chargeList });
  const filter = () => ui.find((n) => n.type === "select" && n.props["aria-label"] === "Filtrar cargos");
  assert.ok(filter());
  assert.equal(filter().props.value, "all");
  for (const label of ["Cargo pendiente", "Cargo parcial", "Cargo saldado", "Sin costo", "Cuota noviembre", "Pago anterior", "Recibo #8"]) assert.ok(ui.text().includes(label), label);
  assert.ok(ui.text().includes("Futuro"));
  assert.ok(ui.text().includes("Saldado"));
  assert.ok(ui.text().includes("no se suman al saldo actual"));
  const futureRow = ui.find((n) => n.type === "tr" && JSON.stringify(n.props.children).includes("Cuota noviembre"));
  assert.ok(futureRow);
  assert.ok(!JSON.stringify(futureRow).includes("31/10"), "UTC period must not drift to previous month in Argentina");
  filter().props.onChange({ target: { value: "pending" } });
  ui.render();
  assert.ok(ui.text().includes("Cargo pendiente"));
  assert.ok(ui.text().includes("Cargo parcial"));
  for (const label of ["Cargo saldado", "Sin costo", "Cuota noviembre", "Pago anterior"]) assert.ok(!ui.text().includes(label), label);
  assert.match(ui.text(), /Pendiente:.*30,00/);
  filter().props.onChange({ target: { value: "future" } });
  ui.render();
  assert.ok(ui.text().includes("Cuota noviembre"));
  for (const label of ["Cargo pendiente", "Cargo parcial", "Cargo saldado", "Pago anterior", "Recibo #8"]) assert.ok(!ui.text().includes(label), label);
  filter().props.onChange({ target: { value: "all" } });
  ui.render();
  assert.ok(ui.text().includes("Cargo saldado"));
  assert.ok(ui.text().includes("Recibo #8"));
  assert.deepEqual(ui.calls, []);
  assert.equal(ui.refreshes(), 0);
  assert.equal(JSON.stringify({ entries, futureCharges, chargeList }), before);
});

test("charge filter has specific empty states and future rows never become payable allocation choices", async () => {
  const ui = harness({ chargeList: [], futureCharges: [{ id: "future:s:1", type: "EVENTUAL_CHARGE", amount: "20.00", grossAmount: null, discountAmount: null, description: "Solo futuro", occurredAt: "2027-01-01T00:00:00Z", isFuture: true, payment: null }] });
  const filter = () => ui.find((n) => n.type === "select" && n.props["aria-label"] === "Filtrar cargos");
  assert.ok(filter());
  filter().props.onChange({ target: { value: "pending" } });
  ui.render();
  assert.ok(ui.text().includes("No hay cargos pendientes."));
  await ui.submit(paymentForm(ui));
  assert.equal(ui.nodes().filter((n) => n.type === "input" && n.props.type === "checkbox").length, 0);
  assert.equal(ui.button("Confirmar pago").props.disabled, true);
  assert.deepEqual(ui.calls, []);
  const empty = harness({ chargeList: [] });
  empty.find((n) => n.props["aria-label"] === "Filtrar cargos").props.onChange({ target: { value: "future" } });
  empty.render();
  assert.ok(empty.text().includes("No hay cargos futuros."));
});


test("advance selection accepts November/December/January and rejects gaps or incomplete prior installments", () => {
  const pending = [1, 2, 3].map((number) => ({ id: `installment-${number}`, description: `Cuota ${number}`, occurredAt: "2026-10-25T03:00:00Z", amount: "2000.00", outstandingAmount: "2000.00", eventualChargeScheduleId: "annual", installmentNumber: number, isFuture: number > 1 }));
  const { allocationSummary } = fields();
  assert.equal(allocationSummary(pending, { "installment-1": "2000", "installment-2": "2000", "installment-3": "2000" }, "6000").valid, true);
  for (const [draft, amount] of [
    [{ "installment-1": "2000", "installment-3": "2000" }, "4000"],
    [{ "installment-2": "2000" }, "2000"],
    [{ "installment-1": "1000", "installment-2": "2000" }, "3000"],
  ]) {
    const summary = allocationSummary(pending, draft, amount);
    assert.equal(summary.valid, false);
    assert.match(summary.error, /correlativas/);
  }
});


test("selector only enables the next installment and clears later selections when an earlier one is removed", async () => {
  const pending = [1, 2, 3].map(number => ({ id: `i${number}`, description: `Cuota ${number}`, occurredAt: "2026-10-25T03:00:00Z", amount: "2000.00", outstandingAmount: "2000.00", eventualChargeScheduleId: "annual", installmentNumber: number, isFuture: number > 1 }));
  const ui = harness({ chargeList: pending });
  ui.form.values.amount = "6000";
  await ui.submit(paymentForm(ui));
  const box = id => ui.find(node => node.type === "input" && node.props.type === "checkbox" && node.props.value === id);
  assert.equal(box("i1").props.disabled, false);
  assert.equal(box("i2").props.disabled, true);
  assert.equal(box("i3").props.disabled, true);
  for (const id of ["i1", "i2", "i3"]) {
    assert.equal(box(id).props.disabled, false);
    box(id).props.onChange({ target: { checked: true } });
    ui.render();
  }
  assert.equal(ui.button("Confirmar pago").props.disabled, false);
  box("i2").props.onChange({ target: { checked: false } });
  ui.render();
  assert.equal(box("i1").props.checked, true);
  assert.equal(box("i2").props.checked, false);
  assert.equal(box("i3").props.checked, false);
  assert.equal(ui.button("Confirmar pago").props.disabled, true);
  assert.equal(ui.calls.length, 0);
});

test("persisted future installments paid in advance remain future and show paid status", () => {
  const ui = harness({ chargeList: [], entries: [{ id: "advanced", type: "EVENTUAL_CHARGE", amount: "2000", grossAmount: null, discountAmount: null, description: "Cuota de enero", occurredAt: "2026-12-25T03:00:00Z", payment: null, isFuture: true }] });
  assert.ok(ui.text().includes("Pagado por adelantado"));
  const filter = ui.find(node => node.type === "select" && node.props["aria-label"] === "Filtrar cargos");
  filter.props.onChange({ target: { value: "future" } });
  ui.render();
  assert.ok(ui.text().includes("Cuota de enero"));
});
