import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
let pathname = "/dashboard/acuerdos-seguimiento";
const passthrough = ({ children }) =>
  React.createElement("div", null, children);
const stubs = new Proxy({}, { get: () => passthrough });

function loadComponent(path) {
  const source = readFileSync(
    new URL(`../../src/${path}`, import.meta.url),
    "utf8",
  );
  const output = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const compiledModule = { exports: {} };
  const mockRequire = (id) => {
    if (id === "react" || id === "react/jsx-runtime") return require(id);
    if (id === "next/navigation")
      return {
        usePathname: () => pathname,
        useSearchParams: () => new URLSearchParams(),
      };
    if (id === "next/link")
      return {
        __esModule: true,
        default: ({ children, ...props }) =>
          React.createElement("a", props, children),
      };
    if (id === "next/image") return { __esModule: true, default: () => null };
    if (id.endsWith("content-page-config"))
      return { getCmsContentNavigation: () => [] };
    if (id.endsWith("auth/roles"))
      return {
        isAdminRole: (role) =>
          ["ADMIN", "ADMIN_TEACHER", "SUPERADMIN"].includes(role),
        isSuperAdminRole: (role) => role === "SUPERADMIN",
      };
    if (id.endsWith("dashboard-editor-panel"))
      return {
        ...Object.fromEntries(
          ["DashboardEditorPanelProvider", "DashboardEditorPanelLayout"].map(
            (name) => [name, passthrough],
          ),
        ),
        useDashboardEditorPanel: () => ({ open: false, setOpen() {} }),
      };
    if (id.endsWith("ui/sidebar"))
      return new Proxy(
        {},
        {
          get: (_, name) =>
            name === "SidebarMenuButton"
              ? ({ render, isActive, hidden, children }) =>
                  hidden
                    ? null
                    : React.cloneElement(
                        render ?? React.createElement("button"),
                        { "data-active": String(Boolean(isActive)) },
                        children,
                      )
              : passthrough,
        },
      );
    if (id.endsWith("student-reports.repository"))
      return { listTeacherOwnedReports: async () => [] };
    if (id.endsWith("teachers.repository"))
      return { listTeacherHomeData: async () => ({ students: [] }) };
    return stubs;
  };
  vm.runInNewContext(output, {
    require: mockRequire,
    module: compiledModule,
    exports: compiledModule.exports,
  });
  return compiledModule.exports;
}

const { DashboardShell } = loadComponent(
  "modules/dashboard/components/dashboard-shell.tsx",
);
const { TeacherReportsView } = loadComponent(
  "modules/teachers/views/teacher-reports-view.tsx",
);

function renderShell(role, path, props = {}) {
  pathname = path;
  return renderToStaticMarkup(
    React.createElement(
      DashboardShell,
      { userEmail: "teacher@example.com", userRole: role, ...props },
      "Content",
    ),
  );
}

test("teachers have a direct, active Acuerdos de Seguimiento entry, including nested routes", () => {
  for (const role of ["TEACHER", "ADMIN_TEACHER"]) {
    for (const path of [
      "/dashboard/acuerdos-seguimiento",
      "/dashboard/acuerdos-seguimiento/nuevo",
      "/dashboard/acuerdos-seguimiento/123/editar",
    ]) {
      const html = renderShell(role, path);
      assert.match(
        html,
        /href="\/dashboard\/acuerdos-seguimiento" data-active="true"[^>]*>.*?Acuerdos de Seguimiento<\/span><\/a>/,
      );
      assert.match(html, /href="\/dashboard\/reportes" data-active="false"/);
    }
    const reports = renderShell(role, "/dashboard/reportes");
    assert.match(reports, /href="\/dashboard\/reportes" data-active="true"/);
    assert.match(
      reports,
      /href="\/dashboard\/acuerdos-seguimiento" data-active="false"/,
    );
  }
});

test("navigation preserves the existing teacher-only agreement and report access", () => {
  for (const role of ["ADMIN", "SUPERADMIN", "PARENT"]) {
    const html = renderShell(role, "/dashboard");
    assert.doesNotMatch(
      html,
      /href="\/dashboard\/(acuerdos-seguimiento|reportes)"/,
    );
  }
});

test("recipient agreements have a separate teacher-only active entry without replacing authored student agreements", () => {
  for (const role of ["TEACHER", "ADMIN_TEACHER"]) {
    const html = renderShell(role, "/dashboard/mis-acuerdos-seguimiento", { userPermissions: [] });
    assert.match(html, /href="\/dashboard\/mis-acuerdos-seguimiento" data-active="true"[^>]*>.*?Mis acuerdos de seguimiento<\/span><\/a>/);
    assert.match(html, /href="\/dashboard\/acuerdos-seguimiento" data-active="false"/);
    const authored = renderShell(role, "/dashboard/acuerdos-seguimiento");
    assert.match(authored, /href="\/dashboard\/mis-acuerdos-seguimiento" data-active="false"/);
  }
  for (const role of ["SUPERADMIN", "ADMIN", "PARENT"]) {
    assert.doesNotMatch(renderShell(role, "/dashboard"), /href="\/dashboard\/mis-acuerdos-seguimiento"/);
  }
});

test("Reports retains its content without an agreement shortcut", async () => {
  const html = renderToStaticMarkup(
    await TeacherReportsView({ userId: "teacher-id" }),
  );
  assert.match(html, />Reportes<\/h1>/);
  assert.match(html, /Tus reportes por alumno/);
  assert.doesNotMatch(html, /acuerdos-seguimiento|Ir a Acuerdos/);
});

test("admin navigation is grouped by work area, with no duplicates or dead links", () => {
  const html = renderShell("SUPERADMIN", "/dashboard");
  const ordered = [
    "Inicio",
    "Gestión escolar",
    "Alumnos",
    "Familias",
    "Docentes",
    "Basecamp",
    "Calendario",
    "Operaciones",
    "Administración",
    "Caja chica",
    "Inventario",
    "Documentos",
    "Comunicación y web",
    "Mailing",
    "Blog",
    "Contenido",
    "Sistema",
    "Usuarios",
    "Roles",
  ];
  let position = -1;
  for (const label of ordered) {
    const next = html.indexOf(`>${label}<`, position + 1);
    assert.ok(
      next > position,
      `${label} should follow the previous navigation entry`,
    );
    position = next;
  }
  assert.doesNotMatch(html, /href="#"|>Navigation</);
  const expanded = renderShell("SUPERADMIN", "/dashboard/content/landing");
  for (const route of ["blog", "calendar"]) {
    assert.equal(
      (expanded.match(new RegExp(`href="/dashboard/${route}"`, "g")) ?? [])
        .length,
      1,
    );
  }
});

test("calendar permission administration is a permission-gated System entry independent of event management", () => {
  const path = "/dashboard/calendar-permissions";
  const allowed = renderShell("TEACHER", path, { userPermissions: ["calendar.permissions.manage"] });
  assert.match(allowed, /Sistema/);
  assert.match(allowed, /href="\/dashboard\/calendar-permissions" data-active="true"[^>]*>.*?Permisos del calendario<\/span><\/a>/);
  assert.ok(allowed.indexOf('>Sistema<') < allowed.indexOf('>Permisos del calendario<'));
  assert.doesNotMatch(allowed, /href="\/dashboard\/calendar"/);
  for (const permissions of [[], ["calendar.view"], ["calendar.manage"]]) {
    const denied = renderShell("ADMIN", path, { userPermissions: permissions });
    assert.doesNotMatch(denied, /href="\/dashboard\/calendar-permissions"|>Sistema</);
  }
  const calendar = renderShell("TEACHER", "/dashboard/calendar", { userPermissions: ["calendar.view", "calendar.permissions.manage"] });
  assert.match(calendar, /href="\/dashboard\/calendar" data-active="true"/);
  assert.match(calendar, /href="\/dashboard\/calendar-permissions" data-active="false"/);
});

test("navigation omits empty groups and preserves explicit permissions and role-only entries", () => {
  const empty = renderShell("PARENT", "/dashboard", { userPermissions: [] });
  assert.doesNotMatch(
    empty,
    />Gestión escolar<|>Operaciones<|>Comunicación y web<|>Sistema</,
  );
  const restricted = renderShell("ADMIN", "/dashboard/inventario", {
    userPermissions: ["inventory.view"],
  });
  assert.match(restricted, />Operaciones</);
  assert.match(restricted, /href="\/dashboard\/inventario" data-active="true"/);
  assert.doesNotMatch(
    restricted,
    /href="\/dashboard\/(users|roles|students|families|caja-chica|documentos|blog|calendar|mailing)"/,
  );
  assert.doesNotMatch(restricted, />Sistema<|>Comunicación y web</);
  const teacher = renderShell("TEACHER", "/dashboard/basecamp", {
    userPermissions: [],
  });
  assert.match(teacher, />Gestión escolar</);
  assert.match(teacher, /href="\/dashboard\/basecamp" data-active="true"/);
  assert.match(teacher, /href="\/dashboard\/acuerdos-seguimiento"/);
  assert.doesNotMatch(teacher, /href="\/dashboard\/(teachers|administracion)"/);
});
