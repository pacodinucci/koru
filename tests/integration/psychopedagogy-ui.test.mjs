import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const pass = ({ children }) => React.createElement("div", null, children);
let pathname = "/dashboard/psicopedagogia";
function load(path, overrides = {}, globals = {}) {
  const output = ts.transpileModule(readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(output, { module: compiledModule, exports: compiledModule.exports, Error, AbortController,
    FormData: class { constructor(form) { this.values = form.values; } get(key) { return this.values[key] ?? null; } },
    ...globals, require: (id) => {
      if (Object.hasOwn(overrides, id)) return overrides[id];
      if (id === "react" || id === "react/jsx-runtime") return require(id);
      if (id === "next/navigation") return { usePathname: () => pathname, useSearchParams: () => new URLSearchParams() };
      if (id === "next/link") return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) };
      if (id === "next/image") return { __esModule: true, default: () => null };
      if (id === "lucide-react") return new Proxy({}, { get: (_, name) => (props) => React.createElement("svg", { ...props, "data-icon": name }) });
      if (id.endsWith("content-page-config")) return { getCmsContentNavigation: () => [] };
      if (id.endsWith("auth/roles")) return { isAdminRole: (role) => ["ADMIN", "ADMIN_TEACHER", "SUPERADMIN"].includes(role), isSuperAdminRole: (role) => role === "SUPERADMIN" };
      if (id.endsWith("dashboard-editor-panel")) return { DashboardEditorPanelProvider: pass, DashboardEditorPanelLayout: pass, useDashboardEditorPanel: () => ({ open: false, setOpen() {} }) };
      if (id.endsWith("ui/sidebar")) return new Proxy({}, { get: (_, name) => name === "SidebarMenuButton" ? ({ render, isActive, hidden, children }) => hidden ? null : React.cloneElement(render ?? React.createElement("button"), { "data-active": String(Boolean(isActive)) }, children) : pass });
      if (id.endsWith("ui/input")) return { Input: (props) => React.createElement("input", props) };
      if (id.endsWith("ui/label")) return { Label: (props) => React.createElement("label", props) };
      if (id.endsWith("ui/button")) return { Button: ({ variant, size, ...props }) => React.createElement("button", props) };
      if (id.endsWith("ui/table")) return Object.fromEntries(Object.entries({ Table: "table", TableBody: "tbody", TableCell: "td", TableHead: "th", TableHeader: "thead", TableRow: "tr" }).map(([name, tag]) => [name, (props) => React.createElement(tag, props)]));
      if (id.endsWith("ui/responsive-dialog")) return {
        ResponsiveDialog: ({ open, children }) => open ? React.createElement("div", { role: "dialog" }, children) : null,
        ResponsiveDialogContent: pass, ResponsiveDialogHeader: pass, ResponsiveDialogBody: pass,
        ResponsiveDialogFooter: pass, ResponsiveDialogTitle: ({ children }) => React.createElement("h2", null, children), ResponsiveDialogDescription: pass,
      };
      if (id === "./psychopedagogy-profile") return { profileSectionLabels: { learning: "Estilo de aprendizaje y temperamento", followups: "Seguimientos realizados", interventions: "Intervenciones realizadas", instruments: "Instrumentos psicopedagógicos aplicados" }, PsychopedagogyProfileSection: ({ student, section, readOnly }) => React.createElement("article", { "data-section": section, "data-readonly": readOnly }, student.id) };
      return new Proxy({}, { get: () => pass });
    } });
  return compiledModule.exports;
}
const students = [
  { id: "student-1", firstName: "Ana", lastName: "Pérez", group: { name: "Grupo A" } },
  { id: "student-2", firstName: "Bruno", lastName: "Gómez", group: { name: "Grupo B" } },
];
function harness(props = {}) {
  const slots = []; let cursor = 0; let tree;
  const { PsychopedagogyClient } = load("modules/psychopedagogy/components/psychopedagogy-client.tsx", {
    react: { ...React, useEffect() {}, useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], (value) => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }]; } },
  });
  function expand(node) {
    if (!node || typeof node !== "object") return node;
    if (Array.isArray(node)) return node.map(expand);
    if (typeof node.type === "function") return expand(node.type(node.props));
    return React.cloneElement(node, {}, ...React.Children.toArray(node.props.children).map(expand));
  }
  function nodes(node) { return !node || typeof node !== "object" ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props.children)]; }
  const text = (node) => typeof node === "string" || typeof node === "number" ? String(node) : Array.isArray(node) ? node.map(text).join("") : node?.props ? text(node.props.children) : "";
  const ui = {
    render() { cursor = 0; tree = expand(PsychopedagogyClient({ students, ...props })); return tree; },
    html() { return renderToStaticMarkup(ui.render()); },
    find(predicate) { return nodes(ui.render()).find(predicate); },
    button(label) { const node = ui.find((node) => node.type === "button" && (node.props["aria-label"] === label || text(node) === label)); assert.ok(node, `Missing button: ${label}`); return node; },
    async click(label) { await ui.button(label).props.onClick(); ui.render(); },
    search(value) { ui.find((node) => node.type === "input" && node.props.type === "search").props.onChange({ target: { value } }); ui.render(); },
  };
  return ui;
}

test("four accessible icons share the final balanced column after unset status for both roles", async () => {
  for (const readOnly of [false, true]) {
    const ui = harness({ readOnly });
    const row = ui.find((node) => node.type === "tr" && renderToStaticMarkup(node).includes('href="/dashboard/students/student-1"'));
    const cells = React.Children.toArray(row.props.children); assert.equal(cells.length, 4);
    assert.match(renderToStaticMarkup(cells[2]), /Sin estado de seguimiento/);
    const html = renderToStaticMarkup(cells[3]);
    for (const label of ["estilo de aprendizaje y temperamento", "seguimientos realizados", "intervenciones realizadas", "instrumentos psicopedagógicos aplicados"]) assert.ok(html.includes(`aria-label="Ver ${label} de Ana Pérez"`));
    assert.equal((html.match(/<button/g) ?? []).length, 4);
    const columns = React.Children.toArray(ui.find((node) => node.type === "colgroup").props.children);
    assert.deepEqual(columns.map((column) => column.props.style.width), ["36%", "26%", "14%", "24%"]);
    assert.match(ui.find((node) => node.type === "table").props.className, /min-w-\[760px\]/);
    assert.match(html, /min-w-\[160px\]/);
    const header = renderToStaticMarkup(ui.find((node) => node.type === "thead"));
    assert.match(header, /<span class="sr-only">Perfil psicopedagógico<\/span>/); assert.doesNotMatch(header, /Acciones|Agregar reporte/);
    await ui.click("Ver seguimientos realizados de Ana Pérez");
    const section = ui.find((node) => node.type === "article");
    assert.equal(section.props["data-section"], "followups"); assert.equal(section.props["data-readonly"], readOnly);
    assert.match(renderToStaticMarkup(section), /student-1/);
    await ui.click("Cerrar"); assert.equal(ui.find((node) => node.type === "article"), undefined);
  }
});

test("student table filters names and surnames, links profiles and leaves follow-up unset", () => {
  const ui = harness(); const html = ui.html();
  assert.match(html, /<table/); assert.match(html, /<th[^>]*>Estado/);
  for (const student of students) assert.match(html, new RegExp(`href="/dashboard/students/${student.id}"`));
  assert.doesNotMatch(html, />Activo</); assert.match(html, /Sin estado de seguimiento/);
  ui.search("ana"); assert.match(ui.html(), /Pérez, Ana/); assert.doesNotMatch(ui.html(), /Gómez, Bruno/);
  ui.search("gómez"); assert.match(ui.html(), /Gómez, Bruno/); assert.doesNotMatch(ui.html(), /Pérez, Ana/);
  ui.search("nadie"); assert.match(ui.html(), /No encontramos alumnos con esa búsqueda/);
  ui.search(""); assert.match(ui.html(), /Pérez, Ana/); assert.match(ui.html(), /Gómez, Bruno/);
});

test("read-only and empty tables retain links without standalone creation or inline report blocks", () => {
  const ui = harness({ readOnly: true }); assert.match(ui.html(), /href="\/dashboard\/students\/student-1"/);
  assert.doesNotMatch(ui.html(), /Agregar reporte|Guardar reporte|<form|<textarea|<article/);
  for (const readOnly of [false, true]) { const empty = harness({ students: [], readOnly }).html(); assert.match(empty, /No hay alumnos registrados/); assert.doesNotMatch(empty, /asignados|aria-label="Ver/); }
});

test("pagination keeps all students reachable and search resets the current page", async () => {
  const many = Array.from({ length: 12 }, (_, index) => ({ id: `s-${index}`, firstName: `Alumno ${index}`, lastName: "Pérez", group: { name: "A" } }));
  const ui = harness({ students: many });
  assert.match(ui.html(), /Página 1 de 2/); assert.doesNotMatch(ui.html(), /href="\/dashboard\/students\/s-11"/);
  await ui.click("Siguiente"); assert.match(ui.html(), /href="\/dashboard\/students\/s-11"/);
  await ui.click("Anterior"); assert.match(ui.html(), /Página 1 de 2/);
  await ui.click("Siguiente"); ui.search("Alumno 11"); assert.match(ui.html(), /Página 1 de 1/); assert.match(ui.html(), /href="\/dashboard\/students\/s-11"/);
  ui.search(""); ui.find((node) => node.type === "select").props.onChange({ target: { value: "20" } }); assert.match(ui.html(), /Página 1 de 1/); assert.match(ui.html(), /href="\/dashboard\/students\/s-11"/);
});

test("section navigation is restricted to psychopedagogical teachers and Superadmin", () => {
  const { DashboardShell } = load("modules/dashboard/components/dashboard-shell.tsx");
  for (const role of ["PSYCHOPEDAGOGY_TEACHER", "SUPERADMIN"]) {
    for (const path of ["/dashboard/psicopedagogia", "/dashboard/psicopedagogia/nuevo"]) {
      pathname = path;
      const html = renderToStaticMarkup(React.createElement(DashboardShell, { userEmail: "teacher@example.com", userRole: role }, "Content"));
      assert.match(html, /href="\/dashboard\/psicopedagogia" data-active="true"[^>]*>.*?Psicopedagogía/);
      assert.equal((html.match(/href="\/dashboard\/psicopedagogia"/g) ?? []).length, 1);
      for (const route of ["reportes", "acuerdos-seguimiento", "mis-acuerdos-seguimiento"]) assert.ok(!html.includes(`href="/dashboard/${route}"`));
    }
  }
  for (const role of ["PARENT", "ADMIN", "ADMIN_OPERATOR", "TEACHER", "ADMIN_TEACHER"]) {
    const html = renderToStaticMarkup(React.createElement(DashboardShell, { userEmail: "user@example.com", userRole: role }, "Content"));
    assert.doesNotMatch(html, /href="\/dashboard\/psicopedagogia"/);
    if (["TEACHER", "ADMIN_TEACHER"].includes(role)) assert.match(html, /href="\/dashboard\/reportes"/);
  }
});

test("view loads every student for both requested roles without teacher assignments", async () => {
  for (const readOnly of [false, true]) {
    let received; let teacherCalls = 0; let globalCalls = 0;
    const { PsychopedagogyView } = load("modules/psychopedagogy/views/psychopedagogy-view.tsx", {
      "@/modules/teachers/server/teachers.repository": { listTeacherHomeData: async () => { teacherCalls++; return { students: [] }; } },
      "@/modules/psychopedagogy/server/psychopedagogy.repository": { listPsychopedagogyStudentsForSuperadmin: async () => { globalCalls++; return students; } },
      "@/modules/psychopedagogy/components/psychopedagogy-client": { PsychopedagogyClient: (props) => { received = props; return null; } },
    });
    const html = renderToStaticMarkup(await PsychopedagogyView({ userId: "user-1", readOnly }));
    assert.equal(teacherCalls, 0); assert.equal(globalCalls, 1); assert.equal(received.students, students); assert.equal(received.readOnly, readOnly);
    assert.equal(received.canEditFollowups, readOnly);
    assert.equal(received.canEditLearning, readOnly);
    assert.equal(received.canEditInterventions, readOnly);
    assert.equal(received.canEditInstruments, readOnly);
    if (readOnly) {
      assert.match(html, /intervenciones/);
      assert.match(html, /instrumentos/);
      assert.doesNotMatch(html, /instrumentos son de solo lectura/);
    }
    assert.match(html, />Psicopedagogía<\/h1>/); if (readOnly) assert.match(html, /crear bitácoras de observación y acompañamientos/);
  }
});
