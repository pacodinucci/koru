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
function load(path, mocks) {
  const output = ts.transpileModule(readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, { module: mod, exports: mod.exports, console, require: (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (["react", "react/jsx-runtime"].includes(id)) return require(id);
    throw new Error(`Unexpected dependency: ${id}`);
  } });
  return mod.exports;
}
const student = {
  id: "student-1", firstName: "Ana", lastName: "Pérez", birthDate: new Date("2020-01-01"), updatedAt: new Date("2026-01-01"),
  group: { name: "Grupo A" }, guardians: [], responsibles: [], recordStatus: "SUBMITTED",
};
async function renderDetail(role, permissionKeys = ["PSYCHOPEDAGOGY_TEACHER", "SUPERADMIN"].includes(role) ? ["dashboard.access", "students.view", "psychopedagogy.view", "psychopedagogy.manage"] : ["dashboard.access", "students.view"]) {
  const profileCalls = []; let classroomProps;
  const { default: Page } = load("app/(dashboard)/dashboard/students/[id]/page.tsx", {
    "lucide-react": { ArrowLeft: () => null },
    "next/link": { __esModule: true, default: ({ children, href }) => React.createElement("a", { href }, children) },
    "next/navigation": { notFound: () => { throw new Error("notFound"); } },
    "@/components/ui/badge": { Badge: pass },
    "@/components/ui/button": { Button: pass },
    "@/components/ui/accordion": { Accordion: pass, AccordionContent: pass, AccordionItem: pass, AccordionTrigger: pass },
    "@/components/ui/card": { Card: pass, CardContent: pass, CardHeader: pass, CardTitle: pass },
    "@/modules/auth/server/auth-guards": { requirePermission: async (permission) => {
      assert.equal(permission, "students.view"); return { id: "viewer-1", email: "viewer@example.test", role, permissionKeys };
    } },
    "@/modules/dashboard/components/dashboard-shell": { DashboardShell: pass },
    "@/modules/dashboard/server/cms-pages.repository": { discoverPagesGroupRoutes: async () => [] },
    "@/modules/students/server/student.actions": { updateStudentRecordStatusAction: () => { throw new Error("unexpected record mutation"); } },
    "@/modules/students/server/students.repository": {
      getStudentRecordForViewer: async (id) => { assert.equal(id, student.id); return student; },
      listStudentReportsForViewer: async () => [{ id: "classroom-1", title: "Classroom report", createdAt: new Date("2026-01-01"), teacher: { displayName: "Docente", userId: "teacher-1" } }],
    },
    "@/modules/family-dashboard/lib/admission-questionnaire": { admissionQuestionnaireSections: [], readQuestionnaireAnswers: () => ({}) },
    "@/modules/teachers/components/create-student-report-dialog": { CreateStudentReportDialog: () => React.createElement("span", null, "Classroom creation") },
    "@/modules/teachers/components/teacher-reports-table": { TeacherReportsTable: (props) => { classroomProps = props; return React.createElement("div", { "data-classroom-reports": true }, "Classroom reports"); } },
    "@/modules/psychopedagogy/components/psychopedagogy-profile": { PsychopedagogyProfile: (props) => { profileCalls.push(props); return React.createElement("div", { "data-psychopedagogy-profile": true }, "Four profile sections"); } },
  });
  return { html: renderToStaticMarkup(await Page({ params: Promise.resolve({ id: student.id }) })), profileCalls, classroomProps };
}

test("student detail places restricted psychopedagogy profile beneath unchanged classroom reports", async () => {
  for (const role of ["PSYCHOPEDAGOGY_TEACHER", "SUPERADMIN"]) {
    const { html, profileCalls, classroomProps } = await renderDetail(role);
    assert.equal(profileCalls.length, 1);
    assert.equal(profileCalls[0].student.id, student.id);
    assert.equal(profileCalls[0].student.firstName, "Ana");
    assert.equal(profileCalls[0].readOnly, true);
    assert.equal(profileCalls[0].canEditLearning ?? false, false);
    assert.ok(html.indexOf("data-psychopedagogy-profile") > html.indexOf("data-classroom-reports"));
    assert.match(html, /Perfil psicopedagógico/);
    assert.equal(classroomProps.reports[0].id, "classroom-1");
    assert.equal(classroomProps.reports[0].canManageVisibility, false);
    assert.doesNotMatch(html, /Classroom creation/);
  }
});

test("other roles and specialist without dashboard access never mount or fetch psychopedagogy profile", async () => {
  for (const role of ["TEACHER", "ADMIN_TEACHER", "ADMIN", "ADMIN_OPERATOR", "PARENT"]) {
    const { html, profileCalls } = await renderDetail(role);
    assert.equal(profileCalls.length, 0, role);
    assert.doesNotMatch(html, /data-psychopedagogy-profile|Perfil psicopedagógico/);
    assert.match(html, /data-classroom-reports/);
    if (["TEACHER", "ADMIN_TEACHER"].includes(role)) assert.match(html, /Classroom creation/);
  }
  assert.equal((await renderDetail("PSYCHOPEDAGOGY_TEACHER", ["students.view"])).profileCalls.length, 0);
});

test("profile URL delegates GET and POST to protected public handlers without altering input", async () => {
  const calls = [];
  const handlers = Object.fromEntries(["GET", "POST"].map((method) => [method, async (...args) => { calls.push([method, ...args]); return { status: method === "GET" ? 200 : 201 }; }]));
  const route = load("app/api/teacher/students/[id]/psychopedagogy/profile/route.ts", {
    "@/modules/psychopedagogy/server/psychopedagogy-profile.handlers": handlers,
  });
  const request = {}; const context = { params: Promise.resolve({ id: "student-1" }) };
  for (const method of ["GET", "POST"]) {
    const response = await route[method](request, context);
    assert.equal(response.status, method === "GET" ? 200 : 201);
    assert.equal(calls.at(-1)[0], method);
    assert.equal(calls.at(-1)[1], request); assert.equal(calls.at(-1)[2], context);
  }
});
