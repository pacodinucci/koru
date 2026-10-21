import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import ts from "typescript";
import { projectFutureFamilyCharges } from "../../src/modules/families/lib/family-charge-projections.ts";

const require = createRequire(import.meta.url);
const root = "@/modules/families/";
const rubric = { id: "materials", name: "Materiales", amount: "120000.00", isActive: true };
const inactive = { id: "old", name: "Inactivo", amount: "100.00", isActive: false };
const family = {
  id: "family", name: "Familia Pérez", users: [],
  students: ["ana", "luis"].map((id) => ({ id, firstName: id, lastName: "Pérez", group: { name: "Sala" }, planId: "legacy", plan: null })),
  accountEntries: [{ id: "entry", type: "EVENTUAL_CHARGE", amount: "25.50", grossAmount: null, discountAmount: null, description: "Cargo libre previo", occurredAt: new Date("2026-03-01T12:00:00Z"), payment: null }],
};
const assignments = [
  { id: "one", studentId: "ana", rubricId: "materials", itemName: "Materiales anteriores", totalAmount: "90000.00", installmentCount: 3, startPeriod: new Date("2026-03-01T00:00:00Z"), cancelledFrom: null },
  { id: "two", studentId: "ana", rubricId: "old", itemName: "Matrícula", totalAmount: "25000.00", installmentCount: 1, startPeriod: new Date("2026-04-01T00:00:00Z"), cancelledFrom: null },
];

// Executes real public components and callbacks with deterministic hooks, not a browser or database.
function harness({ rubrics = [rubric, inactive], records = assignments, schedules = [], pending = false, message = null, response = "Respuesta del servidor", defer = false } = {}) {
  const cache = new Map();
  const slots = new Map();
  const calls = [];
  const financialProps = [];
  let current;
  let cursor = 0;
  let tree;
  let element;
  let release;
  let mounted;
  const hooks = {
    ...React,
    useState(initial) {
      const state = current;
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial;
      return [state[index], (value) => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
    },
    useActionState(action, initial) {
      const [state, setState] = hooks.useState({ ...initial, message });
      const [busy, setBusy] = hooks.useState(false);
      return [state, async (data) => {
        setBusy(true);
        try { setState(await action(state, data)); } finally { setBusy(false); }
      }, pending || busy];
    },
  };
  const action = (name) => async (previousState, data) => {
    calls.push({ name, previousState, fields: Object.fromEntries(data) });
    if (defer) await new Promise((resolve) => { release = resolve; });
    return { message: response };
  };
  const pass = ({ children }) => React.createElement("div", null, children);
  function load(path) {
    if (cache.has(path)) return cache.get(path);
    const source = readFileSync(new URL(`../../src/modules/families/${path}.tsx`, import.meta.url), "utf8");
    const output = ts.transpileModule(source, { compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
    } }).outputText;
    const mod = { exports: {} };
    vm.runInNewContext(output, {
      module: mod, exports: mod.exports, FormData, Intl, Date,
      require(id) {
        if (id === "react") return hooks;
        if (id === "react/jsx-runtime") return require(id);
        if (id === "next/link") return { __esModule: true, default: ({ href, children, ...props }) => React.createElement("a", { href, ...props }, children) };
        if (id === "next/navigation") return { notFound() { throw new Error("not_found"); }, redirect(href) { throw new Error(`redirect:${href}`); } };
        if (id.endsWith("ui/input")) return { Input: (props) => React.createElement("input", props) };
        if (id.endsWith("ui/button")) return { Button: ({ children, nativeButton, render, ...props }) => render ? React.cloneElement(render, props, children) : React.createElement("button", props, children) };
        if (id.endsWith("ui/card")) return { Card: pass, CardHeader: pass, CardTitle: pass, CardContent: pass };
        if (id === "lucide-react") return { PlusIcon: () => null, PencilIcon: () => null, ArrowLeft: () => React.createElement("svg", { "data-icon": "arrow-left" }) };
        if (id.endsWith("ui/badge")) return { Badge: ({ children }) => React.createElement("span", null, children) };
        if (id.endsWith("ui/table")) return Object.fromEntries(Object.entries({ Table: "table", TableHeader: "thead", TableBody: "tbody", TableRow: "tr", TableHead: "th", TableCell: "td" }).map(([name, tag]) => [name, (props) => React.createElement(tag, props)]));
        if (id.endsWith("ui/responsive-dialog")) return {
          ResponsiveDialog: ({ open, onOpenChange, children }) => React.createElement("div", null, React.Children.map(children, (child) => React.cloneElement(child, { mockOpen: open, mockChange: onOpenChange }))),
          ResponsiveDialogTrigger: ({ render, children, mockChange }) => React.cloneElement(render, { onClick: () => mockChange(true) }, children),
          ResponsiveDialogContent: ({ mockOpen, mockChange, showCloseButton = true, children, ...props }) => mockOpen ? React.createElement("div", { ...props, role: "dialog", mockChange }, children, showCloseButton ? React.createElement("button", { type: "button", "aria-label": "Cerrar", onClick: () => mockChange(false) }, "Cerrar") : null) : null,
          ResponsiveDialogHeader: pass, ResponsiveDialogBody: pass, ResponsiveDialogTitle: pass, ResponsiveDialogDescription: pass,
        };
        if (id.endsWith("server/families.actions")) return { assignPlanToStudentAction: action("legacy") };
        if (id.endsWith("server/families.repository")) return { listPlansForAdmin: async () => [] };
        if (id.endsWith("lib/annual-plan")) return { BILLING_MONTHS: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"] };
        if (id.endsWith("server/rubrics.actions")) return { createBillingRubricAction: action("create"), updateBillingRubricAction: action("update"), assignRubricToStudentAction: action("assign"), updateStudentRubricAssignmentAction: action("editAssignment"), deleteStudentRubricAssignmentAction: action("deleteAssignment") };
        if (id.endsWith("server/rubrics.repository")) return { listBillingRubricsForAdmin: async () => rubrics, listStudentRubricAssignments: async (id) => { assert.equal(id, family.id); return records; } };
        if (id.endsWith("family-financial.repository")) return { getFamilyFinancialRecord: async () => ({ ...family, eventualChargeSchedules: schedules }) };
        if (id.endsWith("family-charge-projections")) return { projectFutureFamilyCharges };
        if (id.endsWith("monthly-billing")) return { getBillingPeriod: () => new Date("2026-10-01T00:00:00Z") };
        if (id.endsWith("family-responsibles")) return { buildFamilyResponsibles: () => [] };
        if (id.endsWith("payment-allocation")) return { buildAllocationSummary: () => ({ pendingCharges: [], unallocatedCredits: [] }) };
        if (id.endsWith("family-financial-card")) return { FamilyFinancialCard: (props) => { financialProps.push(props); return React.createElement("section", null, "Ficha financiera"); } };
        if (id.endsWith("family-billing-preview")) return { FamilyBillingPreview: () => React.createElement("section", null, "Vista previa de cargos") };
        if (id.endsWith("family-admin-actions-menu")) return { FamilyAdminActionsMenu: () => React.createElement("button", null, "Administrar familia") };
        if (id.endsWith("family-responsibles-list")) return { FamilyResponsiblesList: pass };
        if (id.startsWith(root) && id.includes("/lib/")) {
          const libSource = readFileSync(new URL(`../../src/modules/families/${id.slice(root.length)}.ts`, import.meta.url), "utf8");
          const lib = { exports: {} };
          vm.runInNewContext(ts.transpileModule(libSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { module: lib, exports: lib.exports });
          return lib.exports;
        }
        if (id.startsWith(root)) return load(id.slice(root.length));
        throw new Error(`Unexpected import: ${id}`);
      },
    });
    cache.set(path, mod.exports);
    return mod.exports;
  }
  function expand(node, path = "root") {
    if (Array.isArray(node)) return node.map((child, index) => expand(child, `${path}/${child?.key ?? index}`));
    if (!node || typeof node !== "object") return node;
    if (typeof node.type === "function") {
      const key = `${path}/${node.type.name}/${node.key ?? ""}`;
      mounted.add(key);
      if (!slots.has(key)) slots.set(key, []);
      current = slots.get(key);
      cursor = 0;
      return expand(node.type(node.props), key);
    }
    return { ...node, props: { ...node.props, children: expand(node.props?.children, `${path}/children`) } };
  }
  const nodes = (node) => Array.isArray(node) ? node.flatMap(nodes) : !node || typeof node !== "object" ? [] : [node, ...nodes(node.props?.children)];
  const text = (node) => Array.isArray(node) ? node.map(text).join("") : node && typeof node === "object" ? text(node.props?.children) : node == null || typeof node === "boolean" ? "" : String(node);
  const api = {
    load, calls, financialProps, release: () => release(),
    render(next = element) {
      element = next;
      mounted = new Set();
      tree = expand(element);
      for (const key of slots.keys()) if (!mounted.has(key)) slots.delete(key);
      return api;
    },
    nodes: () => nodes(tree), text: (node = tree) => text(node),
    find: (predicate) => nodes(tree).find(predicate),
    form: (label) => nodes(tree).find((node) => node.type === "form" && node.props["aria-label"] === label),
    button: (label) => nodes(tree).find((node) => node.type === "button" && text(node) === label),
    async submit(label, values = {}) {
      const form = api.form(label);
      assert.ok(form, `form ${label} must exist`);
      const data = new FormData();
      for (const node of nodes(form)) {
        if (!["input", "select"].includes(node.type) || !node.props.name) continue;
        data.set(node.props.name, node.props.value ?? node.props.defaultValue ?? "");
      }
      for (const [key, value] of Object.entries(values)) data.set(key, value);
      await form.props.action(data);
      api.render();
    },
  };
  return api;
}
const component = (ui, file, name, props) => React.createElement(ui.load(file)[name], props);

// Catalog regressions remain independent from student-assignment editing.
test("catalog exposes create/edit total amounts, active state and server feedback", async () => {
  const ui = harness();
  ui.render(component(ui, "components/rubric-catalog", "RubricCatalog", { rubrics: [rubric, inactive], canManage: true }));
  assert.ok(ui.text().includes("Importe total"));
  assert.ok(ui.text().includes("Inactivo"));
  assert.equal(ui.form("Crear rubro"), undefined, "creation form is closed until the dialog is opened");
  assert.ok(ui.button("Nuevo rubro"));
  ui.button("Nuevo rubro").props.onClick();
  ui.render();
  assert.ok(ui.find((node) => node.props.role === "dialog"));
  await ui.submit("Crear rubro", { name: "Matrícula", amount: "120000.00" });
  assert.deepEqual(ui.calls[0].fields, { name: "Matrícula", amount: "120000.00" });
  assert.equal(ui.calls[0].name, "create");
  assert.ok(ui.text().includes("Respuesta del servidor"));
  ui.find((node) => node.type === "button" && node.props["aria-label"] === "Editar Materiales").props.onClick();
  ui.render();
  await ui.submit("Editar Materiales", { name: "Materiales 2027", amount: "125000.25" });
  assert.deepEqual(ui.calls[1].fields, { rubricId: "materials", name: "Materiales 2027", amount: "125000.25" });
  assert.equal(ui.calls[1].name, "update");
  for (const input of ui.nodes().filter((node) => node.type === "input" && node.props.name === "amount")) {
    assert.equal(input.props.step, "0.01");
    assert.equal(input.props.min, "0.01");
    assert.equal(input.props.required, true);
  }
  const viewer = harness();
  viewer.render(component(viewer, "components/rubric-catalog", "RubricCatalog", { rubrics: [rubric, inactive], canManage: false }));
  assert.ok(viewer.text().includes("Materiales"));
  assert.equal(viewer.nodes().filter((node) => node.type === "form").length, 0);
  assert.equal(viewer.calls.length, 0);
});

test("catalog uses a shadcn table and searches rubric names without changing records", () => {
  const ui = harness();
  const records = [rubric, { ...inactive, name: "Matrícula" }];
  const before = JSON.stringify(records);
  ui.render(component(ui, "components/rubric-catalog", "RubricCatalog", { rubrics: records, canManage: true }));
  assert.ok(ui.find((node) => node.type === "table" && node.props["aria-label"] === "Rubros"));
  assert.ok(ui.text().includes("Nombre"));
  assert.ok(ui.text().includes("Importe total"));
  assert.ok(ui.text().includes("Estado"));
  assert.match(ui.text(), /120\.000,00/);
  const search = () => ui.find((node) => node.type === "input" && node.props.type === "search");
  assert.ok(search());
  search().props.onChange({ target: { value: "  MATRICULA  " } });
  ui.render();
  assert.ok(ui.text().includes("Matrícula"));
  assert.equal(ui.text().includes("Materiales"), false);
  search().props.onChange({ target: { value: "inexistente" } });
  ui.render();
  assert.match(ui.text(), /No encontramos rubros/);
  search().props.onChange({ target: { value: "" } });
  ui.render();
  assert.ok(ui.text().includes("Materiales"));
  assert.ok(ui.text().includes("Matrícula"));
  assert.equal(JSON.stringify(records), before);
  assert.equal(ui.calls.length, 0);
  const viewer = harness();
  viewer.render(component(viewer, "components/rubric-catalog", "RubricCatalog", { rubrics: records, canManage: false }));
  assert.equal(viewer.button("Nuevo rubro"), undefined);
  assert.equal(viewer.nodes().some((node) => node.type === "button" && node.props["aria-label"]?.startsWith("Editar")), false);
  assert.ok(viewer.find((node) => node.type === "input" && node.props.type === "search"));
});

test("new rubric opens the shared responsive dialog with pending and empty-state safeguards", () => {
  const ui = harness({ pending: true });
  ui.render(component(ui, "components/rubric-catalog", "RubricCatalog", { rubrics: [], canManage: true }));
  assert.match(ui.text(), /Todavía no hay rubros cargados/);
  assert.equal(ui.form("Crear rubro"), undefined);
  assert.ok(ui.button("Nuevo rubro"));
  ui.button("Nuevo rubro").props.onClick();
  ui.render();
  const dialog = ui.find((node) => node.props.role === "dialog");
  assert.ok(dialog);
  assert.match(dialog.props.className, /font-montserrat/);
  assert.ok(ui.form("Crear rubro"));
  assert.equal(ui.find((node) => node.type === "fieldset").props.disabled, true);
  assert.equal(ui.button("Guardando...").props.disabled, true);
  assert.equal(ui.calls.length, 0);
});

test("rubric index serializes amounts and legacy plans view forwards to the rubric experience", async () => {
  const ui = harness();
  const view = ui.load("views/dashboard-rubrics-view").DashboardRubricsView;
  ui.render(await view({ canManage: true }));
  assert.ok(ui.text().includes("Rubros"));
  assert.ok(ui.button("Nuevo rubro"));
  assert.equal(ui.form("Crear rubro"), undefined);
  const legacy = ui.load("views/dashboard-plans-view").DashboardPlansView;
  try {
    ui.render(await legacy({ canManage: false }));
    assert.ok(ui.text().includes("Rubros"));
    assert.equal(ui.nodes().filter((node) => node.type === "form").length, 0);
  } catch (error) {
    assert.equal(error.message, "redirect:/dashboard/families/rubrics");
  }
});

test("student assignment submits rubric, terms and month additively with a cent-safe 120000/3 preview", async () => {
  const ui = harness();
  ui.render(component(ui, "components/student-rubric-assignment-form", "StudentRubricAssignmentForm", { familyId: "family", studentId: "ana", rubrics: [rubric, inactive] }));
  assert.equal(ui.form("Agregar rubro al alumno"), undefined);
  ui.button("Agregar rubro").props.onClick();
  ui.render();
  assert.equal(ui.nodes().some((node) => node.type === "option" && node.props.value === "old"), false);
  const select = ui.find((node) => node.type === "select" && node.props.name === "rubricId");
  select.props.onChange({ target: { value: "materials" } });
  ui.render();
  ui.find((node) => node.type === "input" && node.props.name === "installmentCount").props.onChange({ target: { value: "3" } });
  ui.render();
  assert.match(ui.text(), /40\.000,00/);
  assert.match(ui.text(), /consecutiv/);
  const months = ui.nodes().filter((node) => node.type === "select" && node.props.name === "startMonth");
  assert.equal(months.length, 1);
  await ui.submit("Agregar rubro al alumno", { rubricId: "materials", installmentCount: "3", startMonth: "3" });
  ui.find((node) => node.type === "input" && node.props.name === "installmentCount").props.onChange({ target: { value: "1" } });
  ui.render();
  assert.match(ui.text(), /1 cuota de.*120\.000,00/);
  await ui.submit("Agregar rubro al alumno", { rubricId: "materials", installmentCount: "1", startMonth: "4" });
  assert.deepEqual(ui.calls.map((call) => call.fields), [
    { familyId: "family", studentId: "ana", rubricId: "materials", installmentCount: "3", startMonth: "3", discountPercent: "0" },
    { familyId: "family", studentId: "ana", rubricId: "materials", installmentCount: "1", startMonth: "4", discountPercent: "0" },
  ]);
  assert.ok(ui.calls.every((call) => call.name === "assign"));
  assert.match(ui.text(), /Respuesta del servidor/);
  assert.match(ui.text(), /mismo mes/);
});

test("empty catalog and pending actions cannot submit from the UI", () => {
  for (const options of [{ rubrics: [] }, { pending: true }]) {
    const ui = harness(options);
    ui.render(component(ui, "components/student-rubric-assignment-form", "StudentRubricAssignmentForm", { familyId: "family", studentId: "ana", rubrics: options.rubrics ?? [rubric] }));
    ui.button("Agregar rubro").props.onClick();
    ui.render();
    if (options.pending) {
      ui.find((node) => node.type === "select" && node.props.name === "rubricId").props.onChange({ target: { value: "materials" } });
      ui.render();
    }
    assert.equal(ui.find((node) => node.type === "button" && node.props.type === "submit").props.disabled, true);
    assert.equal(ui.calls.length, 0);
  }
});

test("family detail lists multiple snapshots per student and respects management permissions", async () => {
  for (const canManageFamily of [true, false]) {
    const ui = harness();
    ui.render(await ui.load("views/dashboard-family-detail-view").DashboardFamilyDetailView({ familyId: "family", canManageFamily, canManagePayments: true, canWaive: true }));
    const backLink = ui.find((node) => node.type === "a" && node.props.href === "/dashboard/families");
    assert.ok(backLink);
    assert.equal(ui.text(backLink).trim(), "Volver a familias");
    assert.equal(backLink.props.variant, "ghost");
    assert.equal(backLink.props.size, "sm");
    assert.ok(ui.find((node) => node.type === "svg" && node.props["data-icon"] === "arrow-left"));
    assert.match(ui.text(), /Materiales anteriores/);
    assert.match(ui.text(), /Matrícula/);
    assert.match(ui.text(), /90\.000,00/);
    assert.match(ui.text(), /3 cuotas/);
    assert.match(ui.text(), /marzo.*2026/i);
    assert.match(ui.text(), /1 cuota/);
    assert.match(ui.text(), /abril.*2026/i);
    assert.equal(ui.nodes().filter((node) => node.type === "form").length, 0);
    assert.equal(ui.nodes().filter((node) => node.type === "button" && node.props["aria-label"]?.startsWith("Editar rubro ")).length, canManageFamily ? 2 : 0);
    assert.equal(ui.nodes().filter((node) => node.type === "button" && ui.text(node) === "Agregar rubro").length, canManageFamily ? 2 : 0);
    assert.equal(ui.text().includes("Guardar plan"), false);
    const ana = ui.find((node) => node.type === "section" && node.props["aria-label"] === "Rubros de ana Pérez");
    const luis = ui.find((node) => node.type === "section" && node.props["aria-label"] === "Rubros de luis Pérez");
    assert.match(ui.text(ana), /Materiales anteriores.*Matrícula/);
    assert.equal(ui.text(luis).includes("Materiales anteriores"), false);
    assert.match(ui.text(luis), /Todavía no tiene rubros asignados/);
    for (const student of family.students) {
      const link = ui.find((node) => node.type === "a" && node.props.href === `/dashboard/students/${student.id}`);
      assert.ok(link, "every student name links to their own detail page, including read-only access");
      assert.equal(ui.text(link), `${student.lastName}, ${student.firstName}`);
    }
    const props = ui.financialProps.at(-1);
    assert.equal(props.canManagePayments, true);
    assert.equal(props.canWaive, true);
    assert.equal(props.family.entries[0].description, "Cargo libre previo");
    assert.equal(props.family.entries[0].amount, "25.50");
    assert.equal(props.family.balance, "25.50");
    assert.equal(props.eventualChargeItems.length, 0, "rubric IDs must never populate legacy eventualChargeItemId choices");
    assert.doesNotMatch(ui.text(), /Vista previa de cargos/);
    assert.ok(ui.text().includes("Ficha financiera"));
  }
});

test("assignment preview preserves cent remainders and disables impossible terms", () => {
  const ui = harness();
  ui.render(component(ui, "components/student-rubric-assignment-form", "StudentRubricAssignmentForm", { familyId: "family", studentId: "ana", rubrics: [{ ...rubric, amount: "100.00" }] }));
  ui.button("Agregar rubro").props.onClick();
  ui.render();
  ui.find((node) => node.type === "select" && node.props.name === "rubricId").props.onChange({ target: { value: "materials" } });
  ui.render();
  const setCount = (value) => {
    ui.find((node) => node.type === "input" && node.props.name === "installmentCount").props.onChange({ target: { value } });
    ui.render();
  };
  setCount("3");
  assert.match(ui.text(), /33,33.*33,34/);
  assert.equal(ui.button("Guardar rubro").props.disabled, false);
  for (const count of ["0", "121", "1.5", ""]) {
    setCount(count);
    assert.equal(ui.button("Guardar rubro").props.disabled, true);
  }
  assert.equal(ui.calls.length, 0);
});

test("sidebar links Rubros to the new catalog without removing existing Kanban navigation", () => {
  const source = readFileSync(new URL("../../src/modules/dashboard/components/dashboard-shell.tsx", import.meta.url), "utf8");
  assert.ok(/href="\/dashboard\/families\/rubrics"/.test(source), "rubric catalog link exists");
  assert.ok(/<span>Rubros<\/span>/.test(source), "rubric navigation label exists");
  assert.ok(/href="\/dashboard\/kanban"/.test(source), "existing Kanban link remains");
});

const field = (ui, name) => ui.find((node) => ["input", "select"].includes(node.type) && node.props.name === name);
const change = (ui, name, value) => { field(ui, name).props.onChange({ target: { value } }); ui.render(); };
const snapshot = { id: "one", rubricId: "materials", itemName: "Materiales anteriores", grossAmount: "120000.00", discountAmount: "12000.00", discountPercent: "10", totalAmount: "108000.00", installmentCount: 3, startPeriod: "2024-03-01T00:00:00.000Z" };
function renderEditor(ui, assignment = snapshot) {
  ui.render(component(ui, "components/student-rubric-assignment-editor", "StudentRubricAssignmentEditor", { familyId: "family", studentId: "ana", assignment, rubrics: [rubric, inactive, { ...inactive, id: "unrelated-inactive" }, { id: "new", name: "Nuevo", amount: "150000.00", isActive: true }] }));
  const trigger = ui.find((node) => node.type === "button" && node.props["aria-label"] === `Editar rubro ${assignment.itemName}`);
  assert.ok(trigger);
  assert.equal(ui.text(trigger), "", "edit trigger is icon-only");
  trigger.props.onClick();
  ui.render();
}

test("S1/S2/S6 add dialog discounts the total before cent-safe splitting, including 100%", async () => {
  const ui = harness();
  ui.render(component(ui, "components/student-rubric-assignment-form", "StudentRubricAssignmentForm", { familyId: "family", studentId: "ana", rubrics: [rubric] }));
  assert.equal(ui.form("Agregar rubro al alumno"), undefined);
  ui.button("Agregar rubro").props.onClick();
  ui.render();
  assert.match(ui.find((node) => node.props.role === "dialog").props.className, /font-montserrat/);
  assert.match(ui.text(), /año actual/);
  change(ui, "rubricId", "materials");
  change(ui, "installmentCount", "3");
  const percent = field(ui, "discountPercent");
  assert.equal(percent.props.min, "0");
  assert.equal(percent.props.max, "100");
  assert.equal(percent.props.step, "0.01");
  change(ui, "discountPercent", "10");
  assert.match(ui.text(), /Bruto:.*120\.000,00/);
  assert.match(ui.text(), /Descuento.*10%.*12\.000,00/);
  assert.match(ui.text(), /Neto:.*108\.000,00/);
  assert.match(ui.text(), /3 cuotas de.*36\.000,00/);
  await ui.submit("Agregar rubro al alumno", { startMonth: "12" });
  assert.deepEqual(ui.calls[0].fields, { familyId: "family", studentId: "ana", rubricId: "materials", installmentCount: "3", startMonth: "12", discountPercent: "10" });
  assert.equal(ui.calls[0].name, "assign");
  for (const invalid of ["-1", "100.01", "1.001", "", "abc"]) {
    change(ui, "discountPercent", invalid);
    assert.equal(ui.button("Guardar rubro").props.disabled, true);
  }
  change(ui, "discountPercent", "100");
  assert.match(ui.text(), /Neto:.*0,00/);
  assert.match(ui.text(), /3 cuotas de.*0,00/);
  assert.equal(ui.button("Guardar rubro").props.disabled, false);
  await ui.submit("Agregar rubro al alumno");
  assert.equal(ui.calls[1].fields.discountPercent, "100");
});

test("S1/S7 family list shows immutable discount snapshots and normalizes legacy nulls", async () => {
  const records = [{ ...snapshot, studentId: "ana", startPeriod: new Date(snapshot.startPeriod), cancelledFrom: null }, { ...assignments[1], grossAmount: null, discountAmount: null, discountPercent: null }];
  const before = JSON.stringify(records);
  const ui = harness({ records, rubrics: [{ ...rubric, name: "Renombrado", amount: "999999.00" }, inactive] });
  ui.render(await ui.load("views/dashboard-family-detail-view").DashboardFamilyDetailView({ familyId: "family", canManageFamily: false, canManagePayments: true, canWaive: false }));
  assert.match(ui.text(), /Materiales anteriores/);
  assert.match(ui.text(), /Bruto:.*120\.000,00/);
  assert.match(ui.text(), /Descuento.*10%.*12\.000,00/);
  assert.match(ui.text(), /Neto:.*108\.000,00/);
  assert.match(ui.text(), /Descuento.*0%.*0,00/);
  assert.match(ui.text(), /Neto:.*25\.000,00/);
  assert.equal(ui.text().includes("999.999"), false);
  assert.equal(ui.nodes().some((node) => node.type === "button" && (node.props["aria-label"]?.startsWith("Editar rubro") || ui.text(node) === "Agregar rubro")), false);
  assert.equal(JSON.stringify(records), before);
  assert.equal(ui.calls.length, 0);
});

test("S3/S5/S6 editor prefills snapshot, preserves year and posts only assignment terms", async () => {
  const ui = harness();
  renderEditor(ui, { ...snapshot, grossAmount: "90000.00", totalAmount: "81000.00" });
  assert.match(ui.find((node) => node.props.role === "dialog").props.className, /font-montserrat/);
  assert.equal(field(ui, "rubricId").props.value, "materials");
  assert.equal(field(ui, "installmentCount").props.value, "3");
  assert.equal(String(field(ui, "startMonth").props.defaultValue ?? field(ui, "startMonth").props.value), "3");
  assert.equal(field(ui, "discountPercent").props.value, "10");
  assert.match(ui.text(), /2024/);
  assert.match(ui.text(), /Bruto:.*90\.000,00/);
  assert.match(ui.text(), /Neto:.*81\.000,00/);
  assert.match(ui.text(), /impagos/);
  change(ui, "rubricId", "new");
  assert.match(ui.text(), /Bruto:.*150\.000,00/);
  change(ui, "rubricId", "materials");
  assert.match(ui.text(), /Bruto:.*90\.000,00/);
  change(ui, "discountPercent", "20");
  await ui.submit("Editar rubro del alumno", { startMonth: "12", installmentCount: "2" });
  assert.equal(ui.calls[0].name, "editAssignment");
  assert.deepEqual(ui.calls[0].fields, { familyId: "family", studentId: "ana", assignmentId: "one", rubricId: "materials", installmentCount: "2", startMonth: "12", discountPercent: "20" });
  assert.match(ui.text(), /Respuesta del servidor/);
  assert.ok(ui.find((node) => node.props.role === "dialog"));
});

test("S3/S7 inactive linked rubric stays selectable with its snapshot, not other inactive rubrics", async () => {
  const ui = harness();
  renderEditor(ui, { ...snapshot, rubricId: "old", itemName: "Matrícula histórica" });
  assert.equal(field(ui, "rubricId").props.value, "old");
  assert.equal(ui.nodes().some((node) => node.type === "option" && node.props.value === "unrelated-inactive"), false);
  const option = ui.find((node) => node.type === "option" && node.props.value === "old");
  assert.match(ui.text(option), /Matrícula histórica/);
  assert.match(ui.text(), /Bruto:.*120\.000,00/);
  await ui.submit("Editar rubro del alumno");
  assert.equal(ui.calls[0].fields.rubricId, "old");
});

test("S4/S5 delete requires explicit in-dialog confirmation and sends only scoped identifiers", async () => {
  const ui = harness();
  renderEditor(ui);
  assert.equal(ui.form("Eliminar rubro del alumno"), undefined);
  ui.button("Eliminar rubro").props.onClick();
  ui.render();
  assert.equal(ui.calls.length, 0);
  assert.equal(ui.button("Guardar cambios").props.disabled, true, "confirmation disables update without claiming it is pending");
  assert.equal(ui.button("Guardando..."), undefined);
  assert.match(ui.text(), /cargos.*impagos/);
  assert.match(ui.text(), /catálogo/);
  assert.ok(ui.find((node) => node.props.role === "dialog"));
  ui.button("Cancelar eliminación").props.onClick();
  ui.render();
  assert.equal(ui.form("Eliminar rubro del alumno"), undefined);
  ui.button("Eliminar rubro").props.onClick();
  ui.render();
  await ui.submit("Eliminar rubro del alumno");
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.calls[0].name, "deleteAssignment");
  assert.deepEqual(ui.calls[0].fields, { familyId: "family", studentId: "ana", assignmentId: "one" });
  assert.match(ui.text(), /Respuesta del servidor/);
});

test("S3-S5 blocked update/delete feedback remains visible and pending locks both mutations and dismissal", async () => {
  for (const operation of ["update", "delete"]) {
    const blocked = "No se puede modificar: existen pagos imputados.";
    const ui = harness({ defer: true, response: blocked });
    renderEditor(ui);
    if (operation === "delete") { ui.button("Eliminar rubro").props.onClick(); ui.render(); }
    const submission = ui.submit(operation === "update" ? "Editar rubro del alumno" : "Eliminar rubro del alumno");
    ui.render();
    assert.equal(ui.form("Editar rubro del alumno").props["aria-busy"], true);
    assert.ok(ui.nodes().filter((node) => node.type === "fieldset").every((node) => node.props.disabled));
    assert.ok(ui.nodes().filter((node) => node.type === "button" && node.props.type === "submit").every((node) => node.props.disabled));
    assert.equal(ui.button("Cerrar"), undefined);
    const dialog = ui.find((node) => node.props.role === "dialog");
    dialog.props.mockChange(false);
    ui.render();
    assert.ok(ui.find((node) => node.props.role === "dialog"), "pending action cannot be dismissed and resubmitted");
    assert.equal(ui.calls.length, 1);
    ui.release();
    await submission;
    assert.ok(ui.find((node) => node.props.role === "alert" && ui.text(node) === blocked));
    assert.ok(ui.button("Cerrar"));
    assert.equal(ui.calls.length, 1);
  }
});

test("S2/S3 close and reopen remounts clean form state without browser effects", () => {
  const ui = harness();
  renderEditor(ui);
  change(ui, "discountPercent", "45");
  ui.button("Eliminar rubro").props.onClick();
  ui.render();
  ui.button("Cerrar").props.onClick();
  ui.render();
  assert.equal(ui.find((node) => node.props.role === "dialog"), undefined);
  ui.find((node) => node.type === "button" && node.props["aria-label"] === "Editar rubro Materiales anteriores").props.onClick();
  ui.render();
  assert.equal(field(ui, "discountPercent").props.value, "10");
  assert.equal(ui.form("Eliminar rubro del alumno"), undefined);
  assert.equal(ui.calls.length, 0);
});


test("family route supplies read-only future rows while keeping persisted balance and ledger", async () => {
  const ui = harness({ schedules: [{
    id: "schedule", familyId: "family", itemName: "Materiales", isBase: false,
    totalAmount: "120.00", grossAmount: null, installmentCount: 3,
    startPeriod: new Date("2026-10-01T00:00:00Z"), effectiveFrom: null, cancelledFrom: null,
    student: null, accountEntries: [{ installmentNumber: 1 }],
  }] });
  ui.render(await ui.load("views/dashboard-family-detail-view").DashboardFamilyDetailView({ familyId: "family", canManageFamily: false, canManagePayments: false, canWaive: false }));
  const data = ui.financialProps.at(-1).family;
  assert.equal(data.balance, "25.50");
  assert.equal(data.entries.length, 1);
  assert.equal(data.entries[0].id, "entry");
  assert.deepEqual(data.futureCharges.map((r) => r.amount), ["40.00", "40.00"]);
  assert.equal(data.pendingCharges.length, 0);
  assert.equal(ui.calls.length, 0);
});
