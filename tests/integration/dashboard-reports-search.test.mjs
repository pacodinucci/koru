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

function load(path, overrides = {}, globals = {}) {
  const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, { ...globals, module: mod, exports: mod.exports, require: (id) => {
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
  const calls = [];
  let refreshes = 0;
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
    "next/navigation": { useRouter: () => ({ refresh: () => refreshes++ }) },
    "@/components/ui/toast": { useToast: () => ({ toast() {} }) },
    ...extra.overrides,
  }, {
    window: { confirm: () => (extra.confirm === false ? false : true) },
    fetch: async (url, init) => {
      calls.push({ url, ...(init ?? {}) });
      return extra.fetch ? extra.fetch(url, init) : { ok: true, json: async () => ({ ok: true }) };
    },
  })[exported];
  let tree;
  const ui = {
    render() { cursor = 0; tree = component(props); return tree; },
    all: () => nodes(tree),
    find: (predicate) => nodes(tree).find(predicate),
    text: () => text(tree),
    search: () => nodes(tree).find((node) => node.type === "Input" && node.props.type === "search"),
    type(value) { ui.search().props.onChange({ target: { value } }); ui.render(); },
    button: (label) => nodes(tree).find((node) => typeof node.props.onClick === "function" && text(node) === label),
    // Async handlers are fire-and-forget in these clients: flush the mock fetch chain before asserting.
    tick: () => new Promise((resolve) => setImmediate(resolve)),
    calls,
    get refreshes() { return refreshes; },
  };
  ui.render();
  return ui;
}

const NO_RESULTS = "No encontramos resultados para esta búsqueda.";
const tableCard = (ui) => ui.all().filter((node) => node.type === "Card")
  .find((card) => nodes(card).some((node) => node.type === "Table"));
const bodyRows = (ui) => ui.all().filter((node) => node.type === "TableRow").slice(1);
const noResultsCell = (ui) => ui.all().find((node) => node.type === "TableCell" && text(node) === NO_RESULTS);

// The search toolbar is the Alumnos pattern: a labelled control group outside the white table shell.
function assertSearchToolbar(ui, searchId) {
  const input = ui.search();
  assert.ok(input, "listing exposes a live search input");
  assert.equal(input.props.id, searchId, "search id is stable and unique per listing");
  assert.equal(ui.all().filter((node) => node.props.id === searchId).length, 1, "search id is not duplicated");
  const label = ui.all().find((node) => (node.type === "label" || node.type === "Label") && node.props.htmlFor === searchId);
  assert.ok(label, "search is labelled for assistive tech");
  assert.equal(text(label), "Buscar");
  const wrappers = ui.all().filter((node) => node.type === "div"
    && nodes(node).some((child) => child.type === "Input" && child.props.id === searchId));
  assert.ok(wrappers.some((node) => String(node.props.className ?? "").includes("lg:w-64")), "search field uses the Alumnos lg:w-64 width");
  assert.ok(wrappers.some((node) => String(node.props.className ?? "").includes("flex-wrap")), "toolbar wraps on narrow viewports");
  const card = tableCard(ui);
  assert.ok(card, "table keeps its compact container");
  assert.equal(nodes(card).some((child) => child.type === "Input"), false, "search sits outside the white table shell");
  assert.ok(String(card.props.className ?? "").includes("bg-white"), "table shell stays opaque white");
  return input;
}

const students = [
  { id: "s1", firstName: "Ana", lastName: "Pérez", group: { name: "Sala A" } },
  { id: "s2", firstName: "Bruno", lastName: "Gómez", group: { name: "Sala B" } },
  { id: "s3", firstName: "Carla", lastName: "Ruiz", group: { name: "Sala B" } },
];
const reportRow = (id, index, extra = {}) => ({
  id, title: `Reporte ${id}`, content: null, fileName: null, fileMimeType: null, hasFile: false,
  type: "TEXT", createdAt: "2026-04-01T12:00:00.000Z", visibleToFamily: false,
  teacher: { displayName: "Ana Pérez" }, student: students[index], canManageVisibility: true, ...extra,
});
const teacherReports = (reports = [reportRow("r1", 0), reportRow("r2", 1)], extra = {}) => harness(
  "modules/teachers/components/teacher-reports-table.tsx", "TeacherReportsTable", { reports, students }, extra,
);

const profileRow = (id, extra = {}) => ({
  id, title: `Informe ${id}`, content: "Cuerpo del informe", fileName: null, fileMimeType: null,
  hasFile: false, createdAt: "2026-04-01T12:00:00.000Z", visibleToTeacher: false, authorName: "Dirección", ...extra,
});
const profileReports = (reports = [profileRow("p1"), profileRow("p2", { authorName: "Coordinación" })], extra = {}) => harness(
  "modules/teachers/components/teacher-profile-reports-table.tsx", "TeacherProfileReportsTable",
  { reports, teacherName: "Ana Pérez" }, extra,
);

const agreement = (id, status, extra = {}) => ({
  id, title: `Acuerdo ${id}`, body: `Cuerpo completo del acuerdo ${id}`,
  status, attachmentFileName: null, createdAt: "2026-04-01T12:00:00.000Z",
  publishedAt: status === "PUBLISHED" ? "2026-04-02T12:00:00.000Z" : null,
  families: [{ id: `f-${id}`, name: "Familia Pérez", consentedAt: null, consentedBy: null }],
  students: [{ id: "s1", name: "Ana Pérez" }], ...extra,
});
const teacherAgreements = (agreements = [agreement("a1", "DRAFT"), agreement("a2", "PUBLISHED")], extra = {}) => harness(
  "modules/follow-up-agreements/components/teacher-agreements-client.tsx", "TeacherAgreementsClient", { agreements }, extra,
);

const followUpRow = (id, status, extra = {}) => ({
  id, teacherId: "teacher/1", title: `Seguimiento ${id}`, body: `Texto acordado ${id}`, status,
  createdAt: "2026-04-01T12:00:00.000Z",
  publishedAt: status === "PUBLISHED" ? "2026-04-02T12:00:00.000Z" : null,
  acceptedAt: null, acceptedByName: null, authorName: "Dirección", attachmentName: null, hasAttachment: false, ...extra,
});
const followUpClient = (agreements, mode, extra = {}) => harness(
  "modules/follow-up-agreements/components/teacher-follow-up-agreements-client.tsx",
  "TeacherFollowUpAgreementsClient", { agreements, mode, teacherId: "teacher/1" }, extra,
);
test("S6: teacher reports expose the labelled Alumnos search above the white table and keep the student select", () => {
  const ui = teacherReports();
  assertSearchToolbar(ui, "report-search");
  const select = ui.find((node) => node.props.id === "report-student-filter");
  assert.ok(select, "the many-student selector stays a select");
  const toolbar = ui.all().filter((node) => node.type === "div"
    && nodes(node).some((child) => child.type === "Input" && child.props.id === "report-search"));
  assert.ok(toolbar.some((node) => nodes(node).some((child) => child.type === "select" && child.props.id === "report-student-filter")), "search and student filter share one toolbar row");
  assert.equal(ui.all().filter((node) => node.type === "Input").length, 1, "only the search field is added");
});

test("S6: teacher reports search matches visible row text, combines with the student select and resets", () => {
  const ui = teacherReports();
  ui.type("  R2 ");
  assert.equal(bodyRows(ui).length, 1, "case and surrounding spaces are ignored");
  assert.match(text(bodyRows(ui)[0]), /Reporte r2/);
  ui.find((node) => node.props.id === "report-student-filter").props.onChange({ target: { value: "s1" } });
  ui.render();
  assert.ok(noResultsCell(ui), "search and student select stay combined");
  assert.equal(bodyRows(ui).length, 1, "only the no-results row remains");
  ui.type("");
  assert.equal(bodyRows(ui).length, 1, "clearing the search restores the student-filtered row");
  assert.match(text(bodyRows(ui)[0]), /Reporte r1/);
  ui.type("pérez");
  assert.equal(bodyRows(ui).length, 1, "accents in visible student text are matched literally");
  assert.match(text(bodyRows(ui)[0]), /Reporte r1/);
  assert.equal(ui.find((node) => node.props.id === "report-student-filter").props.value, "s1", "the select keeps its value while searching");
});

test("S6: teacher reports keep the per-student empty message distinct from a no-match search", () => {
  const ui = teacherReports();
  ui.find((node) => node.props.id === "report-student-filter").props.onChange({ target: { value: "s3" } });
  ui.render();
  assert.equal(bodyRows(ui).length, 1);
  assert.match(text(bodyRows(ui)[0]), /No hay reportes para este alumno\./);
  assert.equal(noResultsCell(ui), undefined, "an empty student filter is not reported as a search miss");
  assert.ok(ui.search(), "search stays available so the filter can be recombined");
});

test("S6: teacher reports search keeps visibility switching, delete confirmation and the initial empty state", async () => {
  const ui = teacherReports();
  ui.type("r1");
  const toggle = ui.find((node) => node.type === "Switch");
  assert.equal(toggle.props["aria-label"], "Visible para la familia: Reporte r1 de Ana Pérez");
  await toggle.props.onCheckedChange(true);
  await ui.tick();
  ui.render();
  assert.equal(ui.calls[0].url, "/api/teacher/reports/r1/visibility");
  assert.equal(ui.calls[0].method, "PATCH");
  assert.equal(JSON.parse(ui.calls[0].body).visibleToFamily, true);
  assert.equal(ui.find((node) => node.type === "Switch").props.checked, true);
  ui.find((node) => node.props["aria-label"] === "Eliminar reporte Reporte r1").props.onClick();
  ui.render();
  assert.match(ui.text(), /Esta acción no se puede deshacer/);
  assert.equal(ui.calls.length, 1, "opening the confirmation never deletes");
  await ui.button("Eliminar definitivamente").props.onClick();
  await ui.tick();
  ui.render();
  assert.equal(ui.calls[1].url, "/api/teacher/reports/r1");
  assert.equal(ui.calls[1].method, "DELETE");
  assert.equal(ui.search().props.value, "r1", "the search term survives the mutation");
  assert.ok(noResultsCell(ui), "the deleted row leaves the search with no results");

  const empty = teacherReports([]);
  assert.match(empty.text(), /Todavía no cargaste reportes\./);
  assert.equal(empty.search(), undefined, "an empty listing does not add a search toolbar");
  const unassigned = harness("modules/teachers/components/teacher-reports-table.tsx", "TeacherReportsTable", { reports: [], students: [] });
  assert.match(unassigned.text(), /Todavía no tenés alumnos asignados\./);
});

test("S6: teacher profile reports expose the labelled search outside the white table", () => {
  const ui = profileReports();
  assertSearchToolbar(ui, "teacher-profile-report-search");
  assert.ok(ui.text().includes("Visible para el docente"), "the audience note is preserved outside the table");
});

test("S6: teacher profile reports search uses only visible row text and resets", () => {
  const ui = profileReports();
  ui.type("coordinación");
  assert.equal(bodyRows(ui).length, 1, "the visible author column is searchable");
  assert.match(text(bodyRows(ui)[0]), /Informe p2/);
  ui.type("cuerpo del informe");
  assert.ok(noResultsCell(ui), "dialog-only body text is never searched");
  ui.type("");
  assert.equal(bodyRows(ui).length, 2, "clearing the search restores every row");
  ui.type(new Date(profileRow("p1").createdAt).toLocaleDateString("es-AR"));
  assert.equal(bodyRows(ui).length, 2, "the visible date column is searchable");
});

test("S6: teacher profile reports search keeps visibility, download and delete behavior", async () => {
  const fileRow = profileRow("p2", { content: null, fileName: "informe.docx", hasFile: true });
  const ui = profileReports([profileRow("p1"), fileRow]);
  ui.type("p2");
  const toggle = ui.find((node) => node.type === "Switch");
  assert.equal(toggle.props["aria-label"], "Visible para el docente: Informe p2");
  await toggle.props.onCheckedChange(true);
  await ui.tick();
  ui.render();
  assert.equal(ui.calls[0].url, "/api/teacher-reports/p2/visibility");
  assert.equal(JSON.parse(ui.calls[0].body).visibleToTeacher, true);
  assert.equal(ui.find((node) => node.type === "a" && text(node).includes("Descargar")).props.href, "/api/teacher-reports/p2/download");
  ui.find((node) => node.props["aria-label"] === "Eliminar reporte Informe p2").props.onClick();
  ui.render();
  assert.match(ui.text(), /Vas a eliminar definitivamente el reporte/);
  await ui.button("Eliminar definitivamente").props.onClick();
  await ui.tick();
  ui.render();
  assert.equal(ui.calls[1].url, "/api/teacher-reports/p2");
  assert.equal(ui.calls[1].method, "DELETE");
  assert.ok(noResultsCell(ui), "the deleted row leaves the filtered table empty");
  assert.match(profileReports([]).text(), /Todavía no hay reportes de este docente\./);
  assert.equal(profileReports([]).search(), undefined, "the initial empty state has no search toolbar");
});
test("S6: teacher agreements expose the labelled search above the white table and keep publish/delete flows", async () => {
  const ui = teacherAgreements();
  assertSearchToolbar(ui, "teacher-agreements-search");
  assert.ok(ui.text().includes("Cuerpo completo del acuerdo a1"), "the agreement body stays readable");
  ui.type("a2");
  assert.equal(bodyRows(ui).length, 1, "the visible agreement title is searchable");
  assert.match(text(bodyRows(ui)[0]), /Acuerdo a2/);
  assert.equal(ui.all().filter((node) => text(node) === "Publicar").length, 0, "published rows keep hiding publish");
  assert.ok(noResultsCell(teacherAgreements()) === undefined);
  ui.type("nadie");
  assert.ok(noResultsCell(ui), "a miss is reported separately from the empty dataset");
  ui.type("");
  assert.equal(bodyRows(ui).length, 2, "clearing the search restores every agreement");

  await ui.button("Publicar").props.onClick();
  await ui.tick();
  ui.render();
  assert.equal(ui.calls[0].url, "/api/teacher/follow-up-agreements/a1/publish");
  assert.equal(ui.calls[0].method, "POST");
  assert.match(ui.text(), /Acuerdo publicado para las familias involucradas/);

  ui.find((node) => node.props["aria-label"] === "Eliminar acuerdo Acuerdo a1").props.onClick();
  ui.render();
  assert.equal(ui.calls.length, 1, "opening the confirmation never deletes");
  await ui.button("Eliminar definitivamente").props.onClick();
  await ui.tick();
  ui.render();
  assert.equal(ui.calls[1].url, "/api/teacher/follow-up-agreements/a1");
  assert.equal(ui.calls[1].method, "DELETE");
  assert.equal(bodyRows(ui).length, 1, "the deleted agreement disappears from the list");
  assert.match(ui.text(), /Acuerdo a2/);
  const empty = teacherAgreements([]);
  assert.match(empty.text(), /Todavía no hay acuerdos cargados\./);
  assert.equal(empty.search(), undefined, "the initial empty state has no search toolbar");
});

test("S6: teacher agreements confirm dialog gates publishing when the user declines", async () => {
  const ui = teacherAgreements(undefined, { confirm: false });
  await ui.button("Publicar").props.onClick();
  ui.render();
  assert.equal(ui.calls.length, 0, "declining the browser confirmation never publishes");
  assert.equal(bodyRows(ui).length, 2);
});

test("S6: teacher follow-up agreements search the visible body and keep admin publish/delete gating", async () => {
  const admin = followUpClient([followUpRow("d1", "DRAFT"), followUpRow("p1", "PUBLISHED")], "admin");
  assertSearchToolbar(admin, "teacher-follow-up-agreements-search");
  admin.type("texto acordado d1");
  assert.equal(bodyRows(admin).length, 1, "the body rendered inside the row is searchable");
  assert.match(text(bodyRows(admin)[0]), /Seguimiento d1/);
  assert.equal(admin.all().filter((node) => text(node) === "Editar").length, 1, "draft rows keep editing");
  admin.type("dirección");
  assert.equal(bodyRows(admin).length, 2, "the visible author column is searchable");
  admin.type("nadie");
  assert.ok(noResultsCell(admin), "a miss reports no results instead of an empty dataset");
  admin.type("");
  assert.equal(bodyRows(admin).length, 2, "clearing the search restores both agreements");

  admin.type("d1");
  await admin.button("Publicar").props.onClick();
  await admin.tick();
  admin.render();
  assert.equal(admin.calls[0].url, "/api/teacher-follow-up-agreements/d1/publish");
  assert.equal(admin.calls[0].method, "POST");
  assert.equal(admin.button("Publicar"), undefined, "a published row freezes the publish action");
  assert.match(admin.text(), /Publicado/);
  admin.find((node) => node.props["aria-label"] === "Eliminar acuerdo Seguimiento d1").props.onClick();
  admin.render();
  assert.equal(admin.calls.length, 1);
  await admin.button("Eliminar definitivamente").props.onClick();
  await admin.tick();
  admin.render();
  assert.equal(admin.calls[1].url, "/api/teacher-follow-up-agreements/d1");
  assert.equal(admin.calls[1].method, "DELETE");
  assert.ok(noResultsCell(admin), "deleting the only match leaves the search with no results while other agreements stay listed");
  admin.type("");
  assert.equal(bodyRows(admin).length, 1, "clearing the search shows the remaining agreement");
  assert.match(admin.text(), /Seguimiento p1/);
});

test("S6: teacher follow-up agreements keep recipient gating and consent while searching", async () => {
  const recipient = followUpClient([followUpRow("d1", "DRAFT"), followUpRow("p1", "PUBLISHED")], "recipient");
  assertSearchToolbar(recipient, "teacher-follow-up-agreements-search");
  recipient.type("d1");
  assert.ok(noResultsCell(recipient), "recipients never reach drafts through search");
  assert.equal(recipient.all().filter((node) => text(node) === "Publicar").length, 0);
  assert.equal(recipient.find((node) => node.props["aria-label"] === "Eliminar acuerdo Seguimiento p1"), undefined);
  recipient.type("texto acordado p1");
  assert.equal(bodyRows(recipient).length, 1);
  await recipient.button("Dar conformidad").props.onClick();
  await recipient.tick();
  recipient.render();
  assert.equal(recipient.calls[0].url, "/api/teacher-follow-up-agreements/p1/consent");
  assert.equal(recipient.calls[0].method, "POST");
  assert.equal(recipient.button("Dar conformidad").props.disabled, true, "consent stays one-shot");
  const onlyDraft = followUpClient([followUpRow("d1", "DRAFT")], "recipient");
  assert.match(onlyDraft.text(), /Todavía no hay acuerdos publicados para vos\./);
  assert.equal(onlyDraft.search(), undefined, "a recipient with no published agreements sees no toolbar");
});

