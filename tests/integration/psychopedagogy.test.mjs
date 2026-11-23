import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path, mocks) {
  const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(output, {
    require: (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id === "react" || id === "react/jsx-runtime") return require(id);
      throw new Error(`Unexpected dependency: ${id}`);
    }, module: compiledModule, exports: compiledModule.exports, Request, Response, Date, console,
  });
  return compiledModule.exports;
}
const role = "PSYCHOPEDAGOGY_TEACHER";
const routePath = "app/api/teacher/students/[id]/psychopedagogy/route.ts";
function setup({ userRole = role, exists = true, activeProfile = true, permissionKeys = [role, "SUPERADMIN"].includes(userRole) ? ["dashboard.access", "students.view", "psychopedagogy.view", "psychopedagogy.manage"] : ["dashboard.access", "students.view"] } = {}) {
  const writes = [], assignmentCalls = [], privateReads = [], globalReads = [], studentReads = [], profileReads = [];
  const routes = load(routePath, {
    "next/server": { NextResponse: { json: (data, init) => Response.json(data, init) } },
    "@/modules/auth/server/auth-guards": { getAuthenticatedUser: async () => userRole ? { id: "user-1", role: userRole, permissionKeys } : null },
    "@/modules/teachers/server/student-reports.repository": { getAssignedTeacherStudent: async (...args) => {
      assignmentCalls.push(args); return { teacherId: "teacher-1" };
    } },
    "@/modules/psychopedagogy/server/psychopedagogy.repository": {
      getPsychopedagogyTeacherForUser: async (id) => { profileReads.push(id); return activeProfile ? { id: "teacher-1" } : null; },
      getPsychopedagogyStudentForSuperadmin: async (id) => { studentReads.push(id); return exists ? { id } : null; },
      listStudentPsychopedagogyEntriesForSuperadmin: async (id) => { globalReads.push(id); return [{ id: "historical", title: "Otra docente", body: "Seguimiento global", entryDate: "2026-02-28" }]; },
      createPsychopedagogyEntry: async (data) => { writes.push(data); return { id: "entry-1" }; },
      listStudentPsychopedagogyEntries: async (...args) => { privateReads.push(args); return []; },
    },
  });
  return { ...routes, writes, assignmentCalls, privateReads, globalReads, studentReads, profileReads };
}
const context = { params: Promise.resolve({ id: "student-1" }) };
const valid = { date: "2026-02-28", title: " Seguimiento ", body: " Texto libre\nSegunda línea " };
const request = (data) => new Request("http://localhost/api/teacher/students/student-1/psychopedagogy", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
});
const unavailable = { error: "Alumno no disponible." };

test("specialist creates for any existing student using server-derived authorship, not assignments", async () => {
  const api = setup();
  const response = await api.POST(request({ ...valid, teacherId: "spoofed", studentId: "other" }), context);
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(api.writes.length, 1);
  assert.equal(JSON.stringify(api.writes[0]), JSON.stringify({ studentId: "student-1", teacherId: "teacher-1", entryDate: "2026-02-28T00:00:00.000Z", title: "Seguimiento", body: "Texto libre\nSegunda línea" }));
  assert.deepEqual(api.studentReads, ["student-1"]);
  assert.deepEqual(api.profileReads, ["user-1"]);
  assert.deepEqual(api.assignmentCalls, []);
  assert.deepEqual(api.globalReads, []);
  assert.deepEqual(api.privateReads, []);
});

test("invalid dates, required fields, limits and malformed JSON never create entries", async () => {
  const invalid = [null, [], {}, { ...valid, date: "2026-02-30" }, { ...valid, date: "2026-2-1" },
    { ...valid, date: "2025-02-29" }, { ...valid, title: " " }, { ...valid, title: "x".repeat(161) },
    { ...valid, body: " " }, { ...valid, body: "x".repeat(10001) }, { ...valid, body: 123 }];
  for (const userRole of [role, "SUPERADMIN"]) for (const input of [...invalid.map(request), new Request("http://localhost", { method: "POST", body: "{" })]) {
    const api = setup({ userRole });
    const response = await api.POST(input, context);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Ingresá una fecha válida, un título (máximo 160 caracteres) y un texto (máximo 10.000 caracteres)." });
    assert.deepEqual(api.writes, []);
    assert.deepEqual(api.globalReads, []);
    assert.deepEqual(api.privateReads, []);
    assert.deepEqual(api.assignmentCalls, []);
  }
});

test("preserves valid leap days, exact field limits, and plain-text bodies", async () => {
  const api = setup();
  const response = await api.POST(request({ date: "2028-02-29", title: "x".repeat(160), body: "<b>" + "x".repeat(9993) + "</b>" }), context);
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(api.writes.length, 1);
  assert.equal(api.writes[0].entryDate.toISOString(), "2028-02-29T00:00:00.000Z");
  assert.equal(api.writes[0].title.length, 160);
  assert.equal(api.writes[0].body.length, 10000);
  assert.ok(api.writes[0].body.startsWith("<b>"));
});

test("denies anonymous and every other role even with an assigned active teacher profile", async () => {
  for (const userRole of [null, "TEACHER", "ADMIN_TEACHER", "PARENT", "ADMIN", "ADMIN_OPERATOR"]) {
    const api = setup({ userRole });
    for (const response of [await api.GET(new Request("http://localhost"), context), await api.POST(request(valid), context)]) {
      assert.equal(response.status, 404, userRole);
      assert.deepEqual(await response.json(), unavailable);
    }
    for (const calls of [api.writes, api.privateReads, api.globalReads, api.studentReads, api.profileReads, api.assignmentCalls]) assert.deepEqual(calls, []);
  }
});

test("specialist with disabled dynamic dashboard access cannot read or write", async () => {
  const api = setup({ permissionKeys: [] });
  for (const response of [await api.GET(new Request("http://localhost"), context), await api.POST(request(valid), context)]) {
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), unavailable);
  }
  for (const calls of [api.writes, api.studentReads, api.globalReads, api.profileReads, api.assignmentCalls]) assert.deepEqual(calls, []);
});

test("both admitted roles read global history without assignments and without caching", async () => {
  for (const userRole of [role, "SUPERADMIN"]) {
    const api = setup({ userRole, activeProfile: false });
    const response = await api.GET(new Request("http://localhost"), context);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(await response.json(), { entries: [{ id: "historical", title: "Otra docente", body: "Seguimiento global", entryDate: "2026-02-28" }] });
    assert.deepEqual(api.studentReads, ["student-1"]);
    assert.deepEqual(api.globalReads, ["student-1"]);
    for (const calls of [api.writes, api.privateReads, api.profileReads, api.assignmentCalls]) assert.deepEqual(calls, []);
  }
});

test("Superadmin creates observations with session authorship without a teacher profile", async () => {
  for (const activeProfile of [false, true]) {
    const api = setup({ userRole: "SUPERADMIN", activeProfile });
    const response = await api.POST(request({ ...valid, teacherId: "spoofed", authorUserId: "other", studentId: "other" }), context);
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(api.writes.length, 1);
    assert.equal(api.writes[0].teacherId, null);
    assert.equal(api.writes[0].authorUserId, "user-1");
    assert.equal(api.writes[0].studentId, "student-1");
    assert.equal(api.writes[0].title, "Seguimiento");
    assert.equal(api.writes[0].body, "Texto libre\nSegunda línea");
    assert.equal(api.writes[0].entryDate.toISOString(), "2026-02-28T00:00:00.000Z");
    for (const calls of [api.globalReads, api.privateReads, api.profileReads, api.assignmentCalls]) assert.deepEqual(calls, []);
  }
});

test("missing students return 404 for both roles without reading history or writing", async () => {
  for (const userRole of [role, "SUPERADMIN"]) {
    const api = setup({ userRole, exists: false });
    const get = await api.GET(new Request("http://localhost"), context);
    assert.equal(get.status, 404);
    assert.deepEqual(await get.json(), unavailable);
    const post = await api.POST(request(valid), context);
    assert.equal(post.status, 404);
    assert.deepEqual(await post.json(), unavailable);
    assert.deepEqual(api.studentReads, ["student-1", "student-1"]);
    for (const calls of [api.writes, api.globalReads, api.privateReads, api.profileReads, api.assignmentCalls]) assert.deepEqual(calls, []);
  }
});

test("specialist without an active authorship profile cannot create", async () => {
  const api = setup({ activeProfile: false });
  const response = await api.POST(request(valid), context);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), unavailable);
  assert.deepEqual(api.profileReads, ["user-1"]);
  assert.deepEqual(api.writes, []);
  assert.deepEqual(api.globalReads, []);
  assert.deepEqual(api.assignmentCalls, []);
});

test("section checks view permission and derives editing mode on server", async () => {
  for (const userRole of [role, "SUPERADMIN"]) {
    let received;
    const { default: Page } = load("app/(dashboard)/dashboard/psicopedagogia/page.tsx", {
      "@/modules/auth/server/auth-guards": { requirePermission: async (permission) => {
        assert.equal(permission, "psychopedagogy.view");
        return { id: "user-1", role: userRole, email: "user@example.test", permissionKeys: ["psychopedagogy.view", "psychopedagogy.manage"] };
      } },
      "@/modules/dashboard/components/dashboard-shell": { DashboardShell: ({ children }) => React.createElement("div", null, children) },
      "@/modules/dashboard/server/cms-pages.repository": { discoverPagesGroupRoutes: async () => [] },
      "@/modules/psychopedagogy/views/psychopedagogy-view": { PsychopedagogyView: (props) => { received = props; return null; } },
    });
    renderToStaticMarkup(await Page());
    assert.equal(received.readOnly, false);
  }
});

test("global GET uses real repository to retain inactive authors' history but never another student's entries", async () => {
  const entries = [
    { id: "own", studentId: "student-1", teacherId: "teacher-1", teacherActive: true },
    { id: "historical", studentId: "student-1", teacherId: "teacher-2", teacherActive: false },
    { id: "unrelated", studentId: "student-2", teacherId: "teacher-2", teacherActive: true },
  ];
  const before = JSON.stringify(entries);
  let writes = 0;
  const repository = load("modules/psychopedagogy/server/psychopedagogy.repository.ts", {
    "server-only": {},
    "@/lib/prisma": { prisma: {
      student: { findUnique: async ({ where }) => ({ id: where.id }) },
      psychopedagogyEntry: {
        findMany: async ({ where }) => entries.filter((entry) => entry.studentId === where.studentId && (!where.teacherId || entry.teacherId === where.teacherId) && (!where.teacher?.isActive || entry.teacherActive)),
        create: async () => { writes++; },
      },
    } },
  });
  for (const userRole of [role, "SUPERADMIN"]) {
    const api = load(routePath, {
      "next/server": { NextResponse: { json: (data, init) => Response.json(data, init) } },
      "@/modules/auth/server/auth-guards": { getAuthenticatedUser: async () => ({ id: "user-1", role: userRole, permissionKeys: ["dashboard.access", "students.view", "psychopedagogy.view", "psychopedagogy.manage"] }) },
      "@/modules/psychopedagogy/server/psychopedagogy.repository": repository,
      "@/modules/teachers/server/student-reports.repository": { getAssignedTeacherStudent: async () => { throw new Error("Assignments must not be read"); } },
    });
    const response = await api.GET(new Request("http://localhost"), context);
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).entries.map(({ id }) => id), ["own", "historical"]);
  }
  // Preserve the old repository helper's private scope, even though teachers no longer access this section.
  const own = await repository.listStudentPsychopedagogyEntries("student-1", "teacher-1");
  assert.equal(JSON.stringify(own.map(({ id }) => id)), '["own"]');
  assert.equal(writes, 0);
  assert.equal(JSON.stringify(entries), before);
});
