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
const passthrough = ({ children }) => React.createElement("div", null, children);
const stubs = new Proxy({}, { get: () => passthrough });

function loadComponent(path) {
  const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  } }).outputText;
  const compiledModule = { exports: {} };
  const mockRequire = (id) => {
    if (id === "react" || id === "react/jsx-runtime") return require(id);
    if (id === "next/navigation") return { usePathname: () => pathname, useSearchParams: () => new URLSearchParams() };
    if (id === "next/link") return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) };
    if (id === "next/image") return { __esModule: true, default: () => null };
    if (id.endsWith("content-page-config")) return { getCmsContentNavigation: () => [] };
    if (id.endsWith("auth/roles")) return { isAdminRole: (role) => ["ADMIN", "ADMIN_TEACHER", "SUPERADMIN"].includes(role), isSuperAdminRole: (role) => role === "SUPERADMIN" };
    if (id.endsWith("dashboard-editor-panel")) return { ...Object.fromEntries(["DashboardEditorPanelProvider", "DashboardEditorPanelLayout"].map((name) => [name, passthrough])), useDashboardEditorPanel: () => ({ open: false, setOpen() {} }) };
    if (id.endsWith("ui/sidebar")) return new Proxy({}, { get: (_, name) => name === "SidebarMenuButton" ? ({ render, isActive, hidden, children }) => hidden ? null : React.cloneElement(render ?? React.createElement("button"), { "data-active": String(Boolean(isActive)) }, children) : passthrough });
    if (id.endsWith("student-reports.repository")) return { listTeacherOwnedReports: async () => [] };
    if (id.endsWith("teachers.repository")) return { listTeacherHomeData: async () => ({ students: [] }) };
    return stubs;
  };
  vm.runInNewContext(output, { require: mockRequire, module: compiledModule, exports: compiledModule.exports });
  return compiledModule.exports;
}

const { DashboardShell } = loadComponent("modules/dashboard/components/dashboard-shell.tsx");
const { TeacherReportsView } = loadComponent("modules/teachers/views/teacher-reports-view.tsx");

function renderShell(role, path) {
  pathname = path;
  return renderToStaticMarkup(React.createElement(DashboardShell, { userEmail: "teacher@example.com", userRole: role }, "Content"));
}

test("teachers have a direct, active Acuerdos de Seguimiento entry, including nested routes", () => {
  for (const role of ["TEACHER", "ADMIN_TEACHER"]) {
    for (const path of ["/dashboard/acuerdos-seguimiento", "/dashboard/acuerdos-seguimiento/nuevo", "/dashboard/acuerdos-seguimiento/123/editar"]) {
      const html = renderShell(role, path);
      assert.match(html, /href="\/dashboard\/acuerdos-seguimiento" data-active="true"[^>]*>.*?Acuerdos de Seguimiento<\/span><\/a>/);
      assert.match(html, /href="\/dashboard\/reportes" data-active="false"/);
    }
    const reports = renderShell(role, "/dashboard/reportes");
    assert.match(reports, /href="\/dashboard\/reportes" data-active="true"/);
    assert.match(reports, /href="\/dashboard\/acuerdos-seguimiento" data-active="false"/);
  }
});

test("navigation preserves the existing teacher-only agreement and report access", () => {
  for (const role of ["ADMIN", "SUPERADMIN", "PARENT"]) {
    const html = renderShell(role, "/dashboard");
    assert.doesNotMatch(html, /href="\/dashboard\/(acuerdos-seguimiento|reportes)"/);
  }
});

test("Reports retains its content without an agreement shortcut", async () => {
  const html = renderToStaticMarkup(await TeacherReportsView({ userId: "teacher-id" }));
  assert.match(html, />Reportes<\/h1>/);
  assert.match(html, /Tus reportes por alumno/);
  assert.doesNotMatch(html, /acuerdos-seguimiento|Ir a Acuerdos/);
});
