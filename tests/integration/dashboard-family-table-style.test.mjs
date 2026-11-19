import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const ROOT = new URL("../../", import.meta.url);

// Structural/rendered checks only: this task is visual polish, so there is no
// behavioral RED. Components render through their public props with the real
// shadcn table module and deterministic mocks for client-only primitives.
const cn = (...inputs) => inputs.filter(Boolean).join(" ");
const tableModule = loadModule("src/components/ui/table.tsx", { "@/lib/utils": { cn } });

function loadModule(path, mocks = {}) {
  const output = ts.transpileModule(readFileSync(new URL(path, ROOT), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(output, {
    module: compiledModule,
    exports: compiledModule.exports,
    require: (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id === "react" || id === "react/jsx-runtime") return require(id);
      if (!id.startsWith("@/") && !id.startsWith("./")) return require(id);
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return compiledModule.exports;
}

const pass = ({ children }) => React.createElement("div", null, children);
const Input = (props) => React.createElement("input", props);
// Client primitives are replaced by plain elements; base-ui-only props are dropped.
const Button = ({ render, variant, size, nativeButton, children, ...props }) => {
  void render;
  void variant;
  void size;
  void nativeButton;
  return React.createElement("button", props, children);
};
const Badge = ({ variant, children, ...props }) => {
  void variant;
  return React.createElement("span", props, children);
};
const icons = new Proxy({}, { get: (_, name) => (props) => React.createElement("svg", { "data-icon": name, ...props }) });

const uiMocks = {
  "react": React,
  "next/link": { __esModule: true, default: ({ children, href, ...props }) => React.createElement("a", { href, ...props }, children) },
  "lucide-react": icons,
  "@/lib/utils": { cn },
  "@/components/ui/table": tableModule,
  "@/components/ui/input": { Input },
  "@/components/ui/button": { Button },
  "@/components/ui/badge": { Badge },
  "@/components/ui/responsive-dialog": {
    ResponsiveDialog: ({ children }) => React.createElement(React.Fragment, null, children),
    ResponsiveDialogTrigger: ({ render, children }) => React.cloneElement(render, {}, children),
    ResponsiveDialogContent: () => null,
    ResponsiveDialogHeader: pass,
    ResponsiveDialogBody: pass,
    ResponsiveDialogFooter: pass,
    ResponsiveDialogDescription: pass,
    ResponsiveDialogTitle: pass,
  },
  "@/modules/families/server/rubrics.actions": {
    createBillingRubricAction: async () => ({ message: null }),
    updateBillingRubricAction: async () => ({ message: null }),
  },
  "./psychopedagogy-profile": {
    profileSectionLabels: {
      learning: "Estilo de aprendizaje y temperamento",
      followups: "Seguimientos realizados",
      interventions: "Intervenciones realizadas",
      instruments: "Instrumentos psicopedagógicos aplicados",
    },
    PsychopedagogyProfileSection: () => null,
  },
};

function renderFamilies(props) {
  const { FamiliesDataTable } = loadModule("src/modules/families/components/families-data-table.tsx", uiMocks);
  return renderToStaticMarkup(React.createElement(FamiliesDataTable, props));
}

function renderRubrics(props) {
  const { RubricCatalog } = loadModule("src/modules/families/components/rubric-catalog.tsx", uiMocks);
  return renderToStaticMarkup(React.createElement(RubricCatalog, props));
}

function renderPsychopedagogy(props) {
  const { PsychopedagogyClient } = loadModule("src/modules/psychopedagogy/components/psychopedagogy-client.tsx", uiMocks);
  return renderToStaticMarkup(React.createElement(PsychopedagogyClient, props));
}

const families = [
  { id: "f1", name: "Familia Pérez", status: "ACTIVE", rubricsCount: 2, balance: "0.00", usersCount: 3, studentsCount: 2 },
  { id: "f2", name: "Familia Gómez", status: "SUSPENDED", rubricsCount: 0, balance: "1500.50", usersCount: 1, studentsCount: 1 },
];
const manyFamilies = Array.from({ length: 12 }, (_, index) => ({
  id: `family-${index}`,
  name: `Familia ${index}`,
  status: "ACTIVE",
  rubricsCount: index,
  balance: "0.00",
  usersCount: 1,
  studentsCount: 1,
}));
const rubric = { id: "materials", name: "Materiales", amount: "120000.00", isActive: true };
const inactiveRubric = { id: "old", name: "Inscripción", amount: "100.00", isActive: false };
const students = [
  { id: "student-1", firstName: "Ana", lastName: "Pérez", group: { name: "Grupo A" } },
  { id: "student-2", firstName: "Bruno", lastName: "Gómez", group: { name: "Grupo B" } },
];
const manyStudents = Array.from({ length: 12 }, (_, index) => ({
  id: `student-${index}`,
  firstName: `Alumno ${index}`,
  lastName: "Pérez",
  group: { name: "Grupo A" },
}));

const toolbarPattern = /<div aria-label="([^"]*)" class="([^"]*)">/;
const searchWrapperPattern = /<div class="([^"]*)"><label for="([^"]*)"[^>]*>Buscar<\/label><input id="([^"]*)" type="search"/;
const shellPattern = /<div class="([^"]*)"><div data-slot="table-container"/;

/** Shared Alumnos toolbar/spacing contract applied to the three surfaces. */
function assertAlumnosSurface(html, { toolbarLabel, searchId }) {
  const [, label, toolbarClass] = html.match(toolbarPattern) ?? [];
  assert.equal(label, toolbarLabel);
  assert.equal(toolbarClass, "flex flex-wrap items-end gap-x-4 gap-y-3", "toolbar matches the Alumnos wrapping layout");

  const [, wrapperClass, labelFor, inputId] = html.match(searchWrapperPattern) ?? [];
  assert.equal(wrapperClass, "w-full min-w-0 space-y-1 lg:w-64 lg:shrink-0", "search field matches the Alumnos labelled 16rem column");
  assert.equal(labelFor, searchId, "visible Buscar label points at the search input");
  assert.equal(inputId, searchId);
  assert.equal((html.match(new RegExp(`id="${searchId}"`, "g")) ?? []).length, 1, "search id stays unique");

  const [, shellClass] = html.match(shellPattern) ?? [];
  assert.ok(
    ["rounded-xl", "border", "border-slate-200", "bg-white", "p-3"].every((token) => shellClass?.split(/\s+/).includes(token)),
    `table shell keeps the shared border plus the compact Alumnos padding: ${shellClass}`,
  );

  return { toolbarClass, wrapperClass, shellClass };
}

function assertOutsideTable(html, text, surface) {
  const index = html.indexOf(text);
  assert.ok(index > -1, `${surface}: missing "${text}"`);
  const toolbarIndex = html.search(toolbarPattern);
  assert.ok(index > toolbarIndex, `${surface}: "${text}" sits after the toolbar`);
  const tableStart = html.indexOf("<table");
  const tableEnd = html.indexOf("</table>") + "</table>".length;
  assert.ok(index < tableStart || index > tableEnd, `${surface}: "${text}" stays outside the table`);
}

test("S1-S4 families, rubrics and psychopedagogy reuse the Alumnos search toolbar and table shell", () => {
  assertAlumnosSurface(renderFamilies({ families }), { toolbarLabel: "Buscar y filtrar familias", searchId: "families-search" });
  assertAlumnosSurface(renderRubrics({ rubrics: [rubric, inactiveRubric], canManage: true }), { toolbarLabel: "Buscar y filtrar rubros", searchId: "rubrics-search" });
  assertAlumnosSurface(renderPsychopedagogy({ students }), { toolbarLabel: "Buscar y filtrar alumnos", searchId: "psychopedagogy-search" });
});

test("S1-S4 families count stays in the toolbar while columns, badges and pagination are preserved", () => {
  const html = renderFamilies({ families, onManage: () => undefined });
  assertOutsideTable(html, "2 familias", "families");

  for (const heading of ["Familia", "Integrantes", "Rubros asignados", "Estado", "Saldo"]) {
    assert.ok(html.includes(`>${heading}</th>`), `missing "${heading}" column`);
  }
  assert.match(html, /3 usuarios · 2 alumnos/);
  assert.match(html, /2 rubros asignados/);
  assert.match(html, /Sin rubros asignados/);
  assert.match(html, />Activa</);
  assert.match(html, />Suspendida</);
  assert.match(html, />Gestionar</);
  assert.match(html, /href="\/dashboard\/families\/f1"/);

  assert.match(html, /Página 1 de 1/);
  assert.match(html, /aria-label="Filas por página"/);
  assert.match(html, />10 por página</);
  assert.match(html, />20 por página</);
  assert.match(html, />50 por página</);
  assert.match(html, />Anterior</);
  assert.match(html, />Siguiente</);
});

test("S1-S4 families keep the initial search filter, page size and empty state", () => {
  const filtered = renderFamilies({ families, initialSearch: "gómez" });
  assert.match(filtered, /Familia Gómez/);
  assert.equal(filtered.includes("Familia Pérez"), false, "initial search still filters rows");
  assertOutsideTable(filtered, "1 familia", "families");

  const paginated = renderFamilies({ families: manyFamilies });
  assert.match(paginated, /12 familias/);
  assert.match(paginated, /Página 1 de 2/);
  assert.match(paginated, /href="\/dashboard\/families\/family-9"/);
  assert.equal(paginated.includes('href="/dashboard/families/family-11"'), false, "only the first page renders");

  const empty = renderFamilies({ families: [], initialSearch: "nadie" });
  assert.match(empty, /No encontramos familias con ese nombre/);
});

test("S1-S4 rubric catalog keeps its explanatory copy and does not split toolbar and table", () => {
  const html = renderRubrics({ rubrics: [rubric, inactiveRubric], canManage: true });
  const copy = "El catálogo define el importe total. Las cuotas y el mes se eligen al agregar cada rubro a un alumno. Los cambios no modifican las asignaciones existentes.";
  assert.equal(html.split(copy).length - 1, 1, "explanatory copy is preserved exactly once");
  const tableIndex = html.indexOf("<table");
  assert.ok(html.indexOf(copy) > tableIndex, "explanatory copy follows the table instead of splitting toolbar and table");
  assertOutsideTable(html, "2 de 2 rubros", "rubrics");

  assert.match(html, /<table[^>]*aria-label="Rubros"/);
  assert.ok(html.includes(">Nombre</th>"));
  assert.ok(html.includes(">Importe total</th>"));
  assert.ok(html.includes(">Estado</th>"));
  assert.match(html, /120\.000,00/);
  assert.match(html, />Activo</);
  assert.match(html, />Inactivo</);
});

test("S1-S4 rubric catalog keeps manager actions in the toolbar and the read-only variant clean", () => {
  const manager = renderRubrics({ rubrics: [rubric], canManage: true });
  const actionIndex = manager.indexOf('<div class="ml-auto');
  assert.ok(actionIndex > -1, "manager action sits in the trailing toolbar slot");
  assert.ok(actionIndex < manager.indexOf("Nuevo rubro"), "the trailing slot wraps the creation action");
  assert.ok(manager.indexOf("Nuevo rubro") < manager.indexOf("<table"), "creation action stays above the table");
  assert.match(manager, /aria-label="Editar Materiales"/);

  const viewer = renderRubrics({ rubrics: [rubric], canManage: false });
  assert.equal(viewer.includes("Nuevo rubro"), false);
  assert.equal(viewer.includes("Editar Materiales"), false);
  assert.match(viewer, /1 de 1 rubro/);

  const empty = renderRubrics({ rubrics: [], canManage: false });
  assert.match(empty, /Todavía no hay rubros cargados/);
});

test("S1-S4 psychopedagogy count stays in the toolbar and profile actions stay intact", () => {
  const html = renderPsychopedagogy({ students });
  assertOutsideTable(html, "2 alumnos", "psychopedagogy");
  assert.match(renderPsychopedagogy({ students: [students[0]] }), /1 alumno</);

  const columns = html.match(/<col style="width:([^"]*)"/g) ?? [];
  assert.deepEqual(columns, ['<col style="width:36%"', '<col style="width:26%"', '<col style="width:14%"', '<col style="width:24%"']);
  assert.match(html, /<table[^>]*class="[^"]*min-w-\[760px\][^"]*table-fixed/);
  for (const student of students) {
    assert.match(html, new RegExp(`href="/dashboard/students/${student.id}"`));
  }
  for (const label of ["estilo de aprendizaje y temperamento", "seguimientos realizados", "intervenciones realizadas", "instrumentos psicopedagógicos aplicados"]) {
    assert.ok(html.includes(`aria-label="Ver ${label} de Ana Pérez"`), `missing ${label} action`);
  }
  assert.equal((html.match(/aria-label="Ver /g) ?? []).length, 8, "four profile actions per student");
  assert.match(html, /Sin estado de seguimiento/);
  assert.equal(html.includes("<form"), false);
});

test("S1-S4 psychopedagogy pagination and empty states remain reachable", () => {
  const paginated = renderPsychopedagogy({ students: manyStudents });
  assert.match(paginated, /12 alumnos/);
  assert.match(paginated, /Página 1 de 2/);
  assert.match(paginated, /href="\/dashboard\/students\/student-9"/);
  assert.equal(paginated.includes('href="/dashboard/students/student-11"'), false);
  assert.match(paginated, /aria-label="Filas por página"/);

  const empty = renderPsychopedagogy({ students: [] });
  assert.match(empty, /No hay alumnos registrados/);
  assert.equal(empty.includes("aria-label=\"Ver "), false, "no profile actions without students");
  assert.match(empty, />Anterior</);
  assert.match(empty, />Siguiente</);
});

