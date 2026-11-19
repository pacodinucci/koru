import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import ts from "typescript";

const require = createRequire(import.meta.url);
const primitive = (name) => function MockPrimitive(props) {
  return React.createElement(name, props, props.children);
};
const primitives = new Proxy({}, { get: (_, name) => primitive(name) });

function load(path, overrides = {}) {
  const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, { module: mod, exports: mod.exports, require: (id) => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (["react", "react/jsx-runtime"].includes(id)) return require(id);
    return primitives;
  } });
  return mod.exports;
}

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!React.isValidElement(tree)) return [];
  if (typeof tree.type === "function") return nodes(tree.type(tree.props));
  const rendered = React.isValidElement(tree.props.render)
    ? React.cloneElement(tree.props.render, {}, tree.props.children ?? tree.props.render.props.children)
    : null;
  return [tree, ...nodes(tree.props.children), ...nodes(rendered)];
}

function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join("");
  if (!React.isValidElement(tree)) return typeof tree === "string" ? tree : "";
  return typeof tree.type === "function" ? text(tree.type(tree.props)) : text(tree.props.children);
}

function harness(path, exported, props, extra = {}) {
  const states = [];
  let cursor = 0;
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], (value) => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
    },
    useMemo: (fn) => fn(),
    useEffect() {},
    useTransition: () => [false, () => {}],
  };
  const component = load(path, {
    react: hooks,
    "next/link": { __esModule: true, default: primitive("a") },
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    "@/components/ui/toast": { useToast: () => ({ toast() {} }) },
    ...extra.overrides,
  })[exported];
  let tree;
  const ui = {
    render() { cursor = 0; tree = component(props); return tree; },
    all: () => nodes(tree),
    find: (predicate) => nodes(tree).find(predicate),
    text: () => text(tree),
  };
  ui.render();
  return ui;
}

// A table is "protagonist" only when the shared compact Card container wraps it.
function tableCard(ui) {
  const cards = ui.all().filter((node) => node.type === "Card");
  return cards.find((card) => nodes(card).some((node) => node.type === "Table"));
}

function assertCardTableStyle(ui, minimumWidth) {
  const table = ui.find((node) => node.type === "Table");
  assert.ok(table, "table renders through the shared primitive");
  const card = tableCard(ui);
  assert.ok(card, "table is wrapped in the compact Card container");
  assert.equal(card.props.size, "sm", "container uses the compact card size");
  assert.ok(card.props.className.includes("min-w-0"), "container stays inside the dashboard column");
  assert.ok(nodes(card).some((node) => node.type === "CardContent"), "table sits in a CardContent region");
  assert.ok(table.props.className.includes(minimumWidth), `table keeps its ${minimumWidth} scroll width`);
  const headerRows = nodes(ui.find((node) => node.type === "TableHeader")).filter((node) => node.type === "TableRow");
  assert.ok(headerRows.length > 0, "header row exists");
  for (const row of headerRows) {
    assert.doesNotMatch(String(row.props.className ?? ""), /bg-slate-50/, "header row keeps the shared, non-custom background");
  }
  assert.equal(
    ui.all().filter((node) => node.type === "div" && /rounded-xl border border-slate-200 bg-white/.test(String(node.props.className ?? ""))).length,
    0,
    "no duplicated custom card shell around the table",
  );
}

const students = [
  { id: "s1", firstName: "Ana", lastName: "Pérez", group: { name: "Sala A" } },
  { id: "s2", firstName: "Bruno", lastName: "Gómez", group: { name: "Sala B" } },
];
const reportRow = (id, index) => ({
  id, title: `Reporte ${id}`, content: null, fileName: null, fileMimeType: null, hasFile: false,
  type: "TEXT", createdAt: "2026-04-01T12:00:00.000Z", visibleToFamily: false,
  teacher: { displayName: "Ana Pérez" }, student: students[index], canManageVisibility: true,
});
const teacherReports = () => harness("modules/teachers/components/teacher-reports-table.tsx", "TeacherReportsTable", {
  reports: [reportRow("r1", 0), reportRow("r2", 1)],
  students,
});

const profileRow = (id, extra = {}) => ({
  id, title: `Informe ${id}`, content: "Cuerpo del informe", fileName: null, fileMimeType: null,
  hasFile: false, createdAt: "2026-04-01T12:00:00.000Z", visibleToTeacher: false, authorName: "Dirección",
  ...extra,
});
const profileReports = (reports = [profileRow("p1")]) => harness(
  "modules/teachers/components/teacher-profile-reports-table.tsx",
  "TeacherProfileReportsTable",
  { reports, teacherName: "Ana Pérez" },
);

const agreement = (id, status, extra = {}) => ({
  id, title: `Acuerdo ${id}`, body: `Cuerpo completo del acuerdo ${id}`,
  status, attachmentFileName: null, createdAt: "2026-04-01T12:00:00.000Z",
  publishedAt: status === "PUBLISHED" ? "2026-04-02T12:00:00.000Z" : null,
  families: [{ id: `f-${id}`, name: "Familia Pérez", consentedAt: null, consentedBy: null }],
  students: [{ id: "s1", name: "Ana Pérez" }], ...extra,
});
const teacherAgreements = (agreements = [agreement("a1", "DRAFT"), agreement("a2", "PUBLISHED")]) => harness(
  "modules/follow-up-agreements/components/teacher-agreements-client.tsx",
  "TeacherAgreementsClient", { agreements },
);

const followUpRow = (id, status, extra = {}) => ({
  id, teacherId: "teacher/1", title: `Seguimiento ${id}`, body: `Texto acordado ${id}`, status,
  createdAt: "2026-04-01T12:00:00.000Z",
  publishedAt: status === "PUBLISHED" ? "2026-04-02T12:00:00.000Z" : null,
  acceptedAt: null, acceptedByName: null, authorName: "Dirección", attachmentName: null, hasAttachment: false,
  ...extra,
});
const followUpClient = (agreements, mode) => harness(
  "modules/follow-up-agreements/components/teacher-follow-up-agreements-client.tsx",
  "TeacherFollowUpAgreementsClient", { agreements, mode, teacherId: "teacher/1" },
);

const badgeVariant = (ui, label) => {
  const badge = ui.all().find((node) => node.type === "Badge" && text(node) === label);
  return badge?.props.variant;
};

test("S4: teacher reports table adopts the Alumnos card shell, drops the custom header fill and keeps the student filter inline", () => {
  const ui = teacherReports();
  assertCardTableStyle(ui, "min-w-[680px]");
  const select = ui.find((node) => node.props.id === "report-student-filter");
  assert.ok(select, "student filter stays a select instead of segmented tabs");
  assert.deepEqual(
    nodes(select).filter((node) => node.type === "option").map((option) => text(option)),
    ["Todos los alumnos", "Pérez, Ana · Sala A", "Gómez, Bruno · Sala B"],
  );
  ui.find((node) => node.props.id === "report-student-filter").props.onChange({ target: { value: "s2" } });
  ui.render();
  const rows = ui.all().filter((node) => node.type === "TableRow").slice(1);
  assert.equal(rows.length, 1, "filtering still narrows the table");
  assert.match(text(rows[0]), /Reporte r2/);
  for (const label of ["Fecha", "Alumno", "Reporte", "Tipo", "Detalle", "Familia", "Acciones"]) {
    assert.ok(ui.text().includes(label), label);
  }
  assert.ok(ui.all().filter((node) => text(node) === "Ver reporte").length >= 2, "detail reader stays available");
  assert.equal(ui.all().filter((node) => node.type === "Switch").length, 1, "filtered row keeps its visibility switch");
  assert.equal(ui.all().filter((node) => node.props["aria-label"] === "Eliminar reporte Reporte r2").length, 1);
});

test("S4: teacher reports table keeps the empty state inside the compact container", () => {
  const ui = harness("modules/teachers/components/teacher-reports-table.tsx", "TeacherReportsTable", { reports: [], students });
  assert.match(ui.text(), /Todavía no cargaste reportes/);
  const card = ui.all().find((node) => node.type === "Card");
  assert.ok(card, "empty state uses the same compact container");
  assert.equal(card.props.size, "sm");
  assert.match(text(card), /Todavía no cargaste reportes/);
});

test("S4: teacher profile reports table adopts the same container while preserving text, download and visibility controls", () => {
  const ui = profileReports([profileRow("p1"), profileRow("p2", { content: null, fileName: "informe.docx", hasFile: true })]);
  assertCardTableStyle(ui, "min-w-[720px]");
  assert.match(ui.text(), /Informe p1/);
  assert.match(ui.text(), /Dirección/);
  assert.equal(ui.all().filter((node) => node.type === "StudentReportBody" && node.props.body === "Cuerpo del informe").length, 1);
  assert.equal(ui.find((node) => node.type === "a" && text(node).includes("Descargar")).props.href, "/api/teacher-reports/p2/download");
  assert.equal(ui.all().filter((node) => node.type === "Switch").length, 2);
  assert.match(ui.text(), /Visible para el docente/);
});

test("S4: teacher profile reports table keeps the empty state inside the compact container", () => {
  const ui = profileReports([]);
  assert.match(ui.text(), /Todavía no hay reportes de este docente/);
  const card = ui.all().find((node) => node.type === "Card");
  assert.equal(card?.props.size, "sm");
  assert.match(text(card), /Todavía no hay reportes de este docente/);
});

test("S4: teacher agreements keep the heading outside and use semantic status badges", () => {
  const ui = teacherAgreements();
  const heading = ui.find((node) => node.type === "h1" && text(node) === "Acuerdos de Seguimiento");
  assert.ok(heading, "main heading is preserved");
  assert.ok(heading.props.className.includes("text-2xl"), "main heading matches the Alumnos scale");
  assert.equal(nodes(tableCard(ui)).includes(heading), false, "heading stays outside the table container");
  assertCardTableStyle(ui, "min-w-[640px]");
  assert.equal(badgeVariant(ui, "Borrador"), "muted");
  assert.equal(badgeVariant(ui, "Publicado"), "success");
  assert.equal(ui.all().filter((node) => node.type === "Badge" && node.props.variant === "outline").length, 0);
  assert.ok(ui.text().includes("Cuerpo completo del acuerdo a1"), "agreement body stays readable");
  for (const label of ["Ver detalle", "Editar", "Publicar"]) {
    assert.ok(ui.all().some((node) => text(node) === label), label);
  }
  assert.equal(ui.all().filter((node) => node.props["aria-label"] === "Eliminar acuerdo Acuerdo a1").length, 1);
  assert.match(teacherAgreements([]).text(), /Todavía no hay acuerdos cargados/);
});

test("S4: teacher follow-up agreements use the same container and semantic badges without hiding bodies or controls", () => {
  const admin = followUpClient([followUpRow("d1", "DRAFT"), followUpRow("p1", "PUBLISHED")], "admin");
  assertCardTableStyle(admin, "min-w-[800px]");
  assert.equal(badgeVariant(admin, "Borrador"), "muted");
  assert.equal(badgeVariant(admin, "Publicado"), "success");
  assert.equal(admin.all().filter((node) => node.type === "Badge" && node.props.variant === "outline").length, 0);
  assert.ok(admin.text().includes("Texto acordado d1"), "agreement body stays readable");
  for (const label of ["Editar", "Publicar"]) assert.ok(admin.all().some((node) => text(node) === label), label);
  assert.equal(admin.all().filter((node) => node.props["aria-label"] === "Eliminar acuerdo Seguimiento d1").length, 1);

  const recipient = followUpClient([followUpRow("p1", "PUBLISHED")], "recipient");
  assertCardTableStyle(recipient, "min-w-[800px]");
  assert.ok(recipient.all().some((node) => text(node) === "Dar conformidad"), "consent flow stays reachable");
  assert.match(recipient.text(), /Texto acordado p1/);
  assert.match(followUpClient([], "admin").text(), /Todavía no hay acuerdos de este docente/);
});
