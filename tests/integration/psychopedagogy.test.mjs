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
function setup({ role = "TEACHER", assigned = true } = {}) {
  const writes = [];
  const reads = [];
  const assignmentCalls = [];
  const routes = load(routePath, {
    "next/server": { NextResponse: { json: (data, init) => Response.json(data, init) } },
    "@/modules/auth/server/auth-guards": { getAuthenticatedUser: async () => role ? { id: "user-1", role } : null },
    "@/modules/teachers/server/student-reports.repository": { getAssignedTeacherStudent: async (...args) => {
      assignmentCalls.push(args);
      return assigned ? { teacherId: "teacher-1", studentId: args[1] } : null;
    } },
    "@/modules/psychopedagogy/server/psychopedagogy.repository": {
      createPsychopedagogyEntry: async (data) => { writes.push(data); return { id: "entry-1" }; },
      listStudentPsychopedagogyEntries: async (...args) => { reads.push(args); return [{ id: "entry-1", title: "Seguimiento", body: "Texto", entryDate: "2026-02-28" }]; },
    },
  });
  return { ...routes, writes, reads, assignmentCalls };
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
  for (const options of [{ role: null }, { role: "PARENT" }, { role: "ADMIN" }, { role: "SUPERADMIN" }, { assigned: false }]) {
    const api = setup(options);
    for (const response of [await api.GET(new Request("http://localhost"), context), await api.POST(request(valid), context)]) {
      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { error: "Alumno no disponible." });
    }
    assert.equal(api.writes.length, 0);
    assert.equal(api.reads.length, 0);
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

test("dashboard page follows Reportes role guard and renders the dedicated view", async () => {
  const roles = [];
  const pass = ({ children }) => React.createElement("div", null, children);
  const { default: Page } = load("app/(dashboard)/dashboard/psicopedagogia/page.tsx", {
    "@/modules/auth/server/auth-guards": { requireRole: async (allowed) => { roles.push(...allowed); return { id: "user-1", role: "TEACHER", email: "teacher@example.com", permissionKeys: [] }; } },
    "@/modules/dashboard/components/dashboard-shell": { DashboardShell: pass },
    "@/modules/dashboard/server/cms-pages.repository": { discoverPagesGroupRoutes: async () => [] },
    "@/modules/psychopedagogy/views/psychopedagogy-view": { PsychopedagogyView: ({ userId }) => React.createElement("h1", null, `Psicopedagogía ${userId}`) },
  });
  const html = renderToStaticMarkup(await Page());
  assert.deepEqual(roles, ["TEACHER", "ADMIN_TEACHER"]);
  assert.match(html, /Psicopedagogía user-1/);
});
