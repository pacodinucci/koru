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
const stubs = new Proxy({}, { get: () => pass });
let pathname = "/dashboard/psicopedagogia";
function load(path, overrides = {}) {
  const output = ts.transpileModule(readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(output, { module: compiledModule, exports: compiledModule.exports, require: (id) => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === "react" || id === "react/jsx-runtime") return require(id);
    if (id === "next/navigation") return { usePathname: () => pathname, useSearchParams: () => new URLSearchParams() };
    if (id === "next/link") return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) };
    if (id === "next/image") return { __esModule: true, default: () => null };
    if (id.endsWith("content-page-config")) return { getCmsContentNavigation: () => [] };
    if (id.endsWith("auth/roles")) return { isAdminRole: (role) => ["ADMIN", "ADMIN_TEACHER", "SUPERADMIN"].includes(role), isSuperAdminRole: (role) => role === "SUPERADMIN" };
    if (id.endsWith("dashboard-editor-panel")) return { DashboardEditorPanelProvider: pass, DashboardEditorPanelLayout: pass, useDashboardEditorPanel: () => ({ open: false, setOpen() {} }) };
    if (id.endsWith("ui/sidebar")) return new Proxy({}, { get: (_, name) => name === "SidebarMenuButton" ? ({ render, isActive, hidden, children }) => hidden ? null : React.cloneElement(render ?? React.createElement("button"), { "data-active": String(Boolean(isActive)) }, children) : pass });
    if (id.endsWith("ui/input")) return { Input: (props) => React.createElement("input", props) };
    if (id.endsWith("ui/label")) return { Label: (props) => React.createElement("label", props) };
    if (id.endsWith("ui/button")) return { Button: (props) => React.createElement("button", props) };
    return stubs;
  } });
  return compiledModule.exports;
}
const { DashboardShell } = load("modules/dashboard/components/dashboard-shell.tsx");
test("Psicopedagogía has a teacher-only active navigation entry without changing Reportes", () => {
  for (const role of ["TEACHER", "ADMIN_TEACHER"]) {
    for (const path of ["/dashboard/psicopedagogia", "/dashboard/psicopedagogia/nuevo"]) {
      pathname = path;
      const html = renderToStaticMarkup(React.createElement(DashboardShell, { userEmail: "teacher@example.com", userRole: role }, "Content"));
      assert.match(html, /href="\/dashboard\/psicopedagogia" data-active="true"[^>]*>.*?Psicopedagogía/);
      assert.match(html, /href="\/dashboard\/reportes" data-active="false"/);
    }
  }
  for (const role of ["PARENT", "ADMIN", "SUPERADMIN"]) {
    const html = renderToStaticMarkup(React.createElement(DashboardShell, { userEmail: "user@example.com", userRole: role }, "Content"));
    assert.doesNotMatch(html, /href="\/dashboard\/psicopedagogia"/);
  }
});
const { PsychopedagogyClient } = load("modules/psychopedagogy/components/psychopedagogy-client.tsx");
test("entry form links to an assigned student and exposes date, title and plain text", () => {
  const html = renderToStaticMarkup(React.createElement(PsychopedagogyClient, { students: [{ id: "student-1", firstName: "Ana", lastName: "Pérez", group: { name: "Grupo A" } }] }));
  assert.match(html, /value="student-1" selected="">Pérez, Ana · Grupo A/);
  assert.match(html, /Nueva bitácora/);
  assert.match(html, /type="date"[^>]*name="date"|name="date"[^>]*type="date"/);
  assert.match(html, /<input(?=[^>]*name="title")(?=[^>]*maxLength="160")(?=[^>]*required="")[^>]*>/);
  assert.match(html, /<textarea[^>]*name="body"[^>]*maxLength="10000"[^>]*required=""/);
  assert.doesNotMatch(html, /type="file"|contentEditable|visibleToFamily/);
});
test("without assigned students the screen explains the empty state and disables creation", () => {
  const html = renderToStaticMarkup(React.createElement(PsychopedagogyClient, { students: [] }));
  assert.match(html, /No tenés alumnos asignados/);
  assert.match(html, /Sin alumnos asignados/);
});
test("view passes assigned students to the dedicated client", async () => {
  let receivedUser;
  let receivedStudents;
  const students = [{ id: "student-1", firstName: "Ana", lastName: "Pérez", group: { name: "Grupo A" } }];
  const { PsychopedagogyView } = load("modules/psychopedagogy/views/psychopedagogy-view.tsx", {
    "@/modules/teachers/server/teachers.repository": { listTeacherHomeData: async (userId) => { receivedUser = userId; return { students }; } },
    "@/modules/psychopedagogy/components/psychopedagogy-client": { PsychopedagogyClient: (props) => { receivedStudents = props.students; return null; } },
  });
  const html = renderToStaticMarkup(await PsychopedagogyView({ userId: "user-1" }));
  assert.equal(receivedUser, "user-1");
  assert.equal(receivedStudents, students);
  assert.match(html, />Psicopedagogía<\/h1>/);
});
