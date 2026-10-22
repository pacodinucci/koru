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
const routePath = "app/api/teacher/students/[id]/psychopedagogy/route.ts";
function setup({ role = "TEACHER", assigned = true, exists = true } = {}) {
  const writes = [];
  const reads = [];
  const assignmentCalls = [];
  const globalReads = [];
  const studentReads = [];
  const routes = load(routePath, {
    "next/server": { NextResponse: { json: (data, init) => Response.json(data, init) } },
    "@/modules/auth/server/auth-guards": { getAuthenticatedUser: async () => role ? { id: "user-1", role } : null },
    "@/modules/teachers/server/student-reports.repository": { getAssignedTeacherStudent: async (...args) => {
      assignmentCalls.push(args);
      return assigned ? { teacherId: "teacher-1", studentId: args[1] } : null;
    } },
    "@/modules/psychopedagogy/server/psychopedagogy.repository": {
      getPsychopedagogyStudentForSuperadmin: async (id) => { studentReads.push(id); return exists ? { id } : null; },
      listStudentPsychopedagogyEntriesForSuperadmin: async (id) => { globalReads.push(id); return [{ id: "entry-other-teacher", title: "Otra docente", body: "Seguimiento global", entryDate: "2026-02-28" }]; },
      createPsychopedagogyEntry: async (data) => { writes.push(data); return { id: "entry-1" }; },
      listStudentPsychopedagogyEntries: async (...args) => { reads.push(args); return [{ id: "entry-1", title: "Seguimiento", body: "Texto", entryDate: "2026-02-28" }]; },
    },
  });
  return { ...routes, writes, reads, assignmentCalls, globalReads, studentReads };
}
const context = { params: Promise.resolve({ id: "student-1" }) };
const valid = { date: "2026-02-28", title: " Seguimiento ", body: " Texto libre\nSegunda línea " };
function request(data) {
  return new Request("http://localhost/api/teacher/students/student-1/psychopedagogy", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
}

test("creates a dated plain-text entry for the assigned student, separately from reports", async () => {
  for (const role of ["TEACHER", "ADMIN_TEACHER"]) {
    const api = setup({ role });
    const response = await api.POST(request(valid), context);
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(api.writes.length, 1);
    assert.equal(api.writes[0].studentId, "student-1");
    assert.equal(api.writes[0].teacherId, "teacher-1");
    assert.equal(api.writes[0].entryDate.toISOString(), "2026-02-28T00:00:00.000Z");
    assert.equal(api.writes[0].title, "Seguimiento");
    assert.equal(api.writes[0].body, "Texto libre\nSegunda línea");
    assert.equal(JSON.stringify(api.assignmentCalls), '[["user-1","student-1"]]');
  }
});

test("rejects invalid dates, missing fields and oversized text without creating entries", async () => {
  const invalid = [null, [], {}, { ...valid, date: "2026-02-30" }, { ...valid, date: "2026-2-1" },
    { ...valid, date: "2025-02-29" }, { ...valid, title: " " }, { ...valid, title: "x".repeat(161) },
    { ...valid, body: " " }, { ...valid, body: "x".repeat(10001) }, { ...valid, body: 123 }];
  for (const data of invalid) {
    const api = setup();
    const response = await api.POST(request(data), context);
    assert.equal(response.status, 400, JSON.stringify(data)?.slice(0, 100));
    assert.deepEqual(await response.json(), { error: "Ingresá una fecha válida, un título (máximo 160 caracteres) y un texto (máximo 10.000 caracteres)." });
    assert.equal(api.writes.length, 0);
    assert.equal(api.reads.length, 0);
  }
  const api = setup();
  const malformed = new Request("http://localhost", { method: "POST", body: "{" });
  assert.equal((await api.POST(malformed, context)).status, 400);
  assert.equal(api.writes.length, 0);
});

test("accepts leap days and exact field limits", async () => {
  const api = setup();
  const response = await api.POST(request({ date: "2028-02-29", title: "x".repeat(160), body: "x".repeat(10000) }), context);
  assert.equal(response.status, 201);
  assert.equal(api.writes.length, 1);
});

test("denies anonymous, non-teacher and unassigned access before querying or writing entries", async () => {
  for (const options of [{ role: null }, { role: "PARENT" }, { role: "ADMIN" }, { role: "ADMIN_OPERATOR" }, { assigned: false }]) {
    const api = setup(options);
    for (const response of [await api.GET(new Request("http://localhost"), context), await api.POST(request(valid), context)]) {
      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { error: "Alumno no disponible." });
    }
    assert.equal(api.writes.length, 0);
    assert.equal(api.reads.length, 0);
    assert.equal(api.globalReads.length, 0);
    assert.equal(api.studentReads.length, 0);
  }
});

test("lists only this teacher's entries for the selected student without caching", async () => {
  const api = setup();
  const response = await api.GET(new Request("http://localhost"), context);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await response.json(), { entries: [{ id: "entry-1", title: "Seguimiento", body: "Texto", entryDate: "2026-02-28" }] });
  assert.equal(JSON.stringify(api.reads), '[["student-1","teacher-1"]]');
  assert.equal(api.writes.length, 0);
});

test("dashboard page admits teachers and Superadmin and renders the dedicated view", async () => {
  const roles = [];
  const pass = ({ children }) => React.createElement("div", null, children);
  const { default: Page } = load("app/(dashboard)/dashboard/psicopedagogia/page.tsx", {
    "@/modules/auth/server/auth-guards": { requireRole: async (allowed) => { roles.push(...allowed); return { id: "user-1", role: "TEACHER", email: "teacher@example.com", permissionKeys: [] }; } },
    "@/modules/dashboard/components/dashboard-shell": { DashboardShell: pass },
    "@/modules/dashboard/server/cms-pages.repository": { discoverPagesGroupRoutes: async () => [] },
    "@/modules/psychopedagogy/views/psychopedagogy-view": { PsychopedagogyView: ({ userId }) => React.createElement("h1", null, `Psicopedagogía ${userId}`) },
  });
  const html = renderToStaticMarkup(await Page());
  assert.deepEqual(roles, ["TEACHER", "ADMIN_TEACHER", "SUPERADMIN"]);
  assert.match(html, /Psicopedagogía user-1/);
});


test("Superadmin can read any existing student's entries without a teacher assignment and cannot create", async () => {
  const api = setup({ role: "SUPERADMIN", assigned: false });
  const response = await api.GET(new Request("http://localhost"), context);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await response.json(), { entries: [{ id: "entry-other-teacher", title: "Otra docente", body: "Seguimiento global", entryDate: "2026-02-28" }] });
  assert.deepEqual(api.studentReads, ["student-1"]);
  assert.deepEqual(api.globalReads, ["student-1"]);
  assert.deepEqual(api.assignmentCalls, []);
  assert.deepEqual(api.reads, []);
  for (const assigned of [false, true]) {
    const readOnly = setup({ role: "SUPERADMIN", assigned });
    const denied = await readOnly.POST(request(valid), context);
    assert.equal(denied.status, 404);
    assert.deepEqual(await denied.json(), { error: "Alumno no disponible." });
    assert.deepEqual(readOnly.writes, []);
    assert.deepEqual(readOnly.assignmentCalls, []);
    assert.deepEqual(readOnly.globalReads, []);
    assert.deepEqual(readOnly.studentReads, []);
  }
  assert.deepEqual(api.writes, []);
});

test("Superadmin receives 404 for a nonexistent student without querying entries", async () => {
  const api = setup({ role: "SUPERADMIN", assigned: false, exists: false });
  const response = await api.GET(new Request("http://localhost"), context);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Alumno no disponible." });
  assert.deepEqual(api.studentReads, ["student-1"]);
  assert.deepEqual(api.globalReads, []);
  assert.deepEqual(api.writes, []);
});

test("page passes server-derived read-only mode only for Superadmin", async () => {
  for (const role of ["TEACHER", "ADMIN_TEACHER", "SUPERADMIN"]) {
    let received;
    const { default: Page } = load("app/(dashboard)/dashboard/psicopedagogia/page.tsx", {
      "@/modules/auth/server/auth-guards": { requireRole: async (allowed) => {
        assert.ok(allowed.includes(role));
        return { id: "user-1", role, email: "user@example.test", permissionKeys: [] };
      } },
      "@/modules/dashboard/components/dashboard-shell": { DashboardShell: ({ children }) => React.createElement("div", null, children) },
      "@/modules/dashboard/server/cms-pages.repository": { discoverPagesGroupRoutes: async () => [] },
      "@/modules/psychopedagogy/views/psychopedagogy-view": { PsychopedagogyView: (props) => { received = props; return null; } },
    });
    renderToStaticMarkup(await Page());
    assert.equal(received.userId, "user-1");
    assert.equal(received.readOnly, role === "SUPERADMIN");
  }
});


test("public GET with real repository scopes global history to one student and keeps teacher reads private", async () => {
  const entries = [
    { id: "own", studentId: "student-1", teacherId: "teacher-1", teacherActive: true, entryDate: "2026-03-03", title: "Propia", body: "Texto propio" },
    { id: "other", studentId: "student-1", teacherId: "teacher-2", teacherActive: false, entryDate: "2026-03-02", title: "Histórica", body: "Otra docente" },
    { id: "unrelated", studentId: "student-2", teacherId: "teacher-2", teacherActive: true, entryDate: "2026-03-01", title: "Otro alumno", body: "No corresponde" },
  ];
  const before = JSON.stringify(entries);
  let writes = 0;
  const repository = load("modules/psychopedagogy/server/psychopedagogy.repository.ts", {
    "server-only": {},
    "@/lib/prisma": { prisma: {
      student: { findUnique: async ({ where }) => ["student-1", "student-2"].includes(where.id) ? { id: where.id } : null },
      psychopedagogyEntry: {
        findMany: async ({ where }) => entries.filter((entry) => entry.studentId === where.studentId
          && (!where.teacherId || entry.teacherId === where.teacherId)
          && (!where.teacher?.isActive || entry.teacherActive))
          .map(({ id, entryDate, title, body }) => ({ id, entryDate, title, body })),
        create: async () => { writes++; return { id: "unexpected" }; },
      },
    } },
  });
  for (const role of ["TEACHER", "ADMIN_TEACHER", "SUPERADMIN", "ADMIN", "ADMIN_OPERATOR", "PARENT", null]) {
    const api = load(routePath, {
      "next/server": { NextResponse: { json: (data, init) => Response.json(data, init) } },
      "@/modules/auth/server/auth-guards": { getAuthenticatedUser: async () => role ? { id: "user-1", role } : null },
      "@/modules/teachers/server/student-reports.repository": { getAssignedTeacherStudent: async () => ({ teacherId: "teacher-1" }) },
      "@/modules/psychopedagogy/server/psychopedagogy.repository": repository,
    });
    const response = await api.GET(new Request("http://localhost"), context);
    if (["TEACHER", "ADMIN_TEACHER", "SUPERADMIN"].includes(role)) {
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.deepEqual(data.entries.map((entry) => entry.id), role === "SUPERADMIN" ? ["own", "other"] : ["own"]);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
    } else {
      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { error: "Alumno no disponible." });
    }
    if (role === "SUPERADMIN") {
      const denied = await api.POST(request({ ...valid, teacherId: "teacher-1", readOnly: false }), context);
      assert.equal(denied.status, 404);
      assert.deepEqual(await denied.json(), { error: "Alumno no disponible." });
    }
    assert.equal(writes, 0);
    assert.equal(JSON.stringify(entries), before);
  }
});
