import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(output, { module: compiledModule, exports: compiledModule.exports, Request, Response, FormData, console, require: (id) => {
    if (id in mocks) return mocks[id];
    if (id === "next/server") return { NextResponse: { json: (body, init) => Response.json(body, init) } };
    if (["react/jsx-runtime", "zod"].includes(id)) return require(id);
    throw Error(`Unexpected dependency: ${id}`);
  } });
  return compiledModule.exports;
}
const view = "psychopedagogy.view", manage = "psychopedagogy.manage";
test("role catalog exposes separate psychopedagogy capabilities without granting unrelated legacy roles", () => {
  const { permissionCatalog, legacyRolePermissions } = load("modules/auth/permissions/permission-catalog.ts");
  assert.deepEqual(JSON.parse(JSON.stringify(permissionCatalog.filter((p) => p.section === "Psicopedagogía"))), [
    { key: view, section: "Psicopedagogía", label: "Ver" }, { key: manage, section: "Psicopedagogía", label: "Gestionar" },
  ]);
  for (const role of ["SUPERADMIN", "PSYCHOPEDAGOGY_TEACHER"]) for (const key of [view, manage]) assert.ok(legacyRolePermissions[role].includes(key));
  for (const role of ["ADMIN", "ADMIN_OPERATOR", "ADMIN_TEACHER", "TEACHER", "PARENT"]) for (const key of [view, manage]) assert.ok(!legacyRolePermissions[role].includes(key));
});
for (const path of ["modules/psychopedagogy/server/psychopedagogy-profile.handlers.ts", "app/api/teacher/students/[id]/psychopedagogy/route.ts"]) {
  test(`${path}: custom roles read with view, write with both, and cannot bypass revoked permissions`, async () => {
    for (const role of ["ADMIN", "PSYCHOPEDAGOGY_TEACHER", "SUPERADMIN"]) {
      for (const keys of [[], [manage], [view], [view, manage]]) {
        let calls = 0, writes = 0;
        const authorIds = [];
        const count = (value) => async () => { calls++; return value; };
        const api = load(path, {
          "@/modules/auth/server/auth-guards": { getAuthenticatedUser: async () => ({ id: "user-1", role, permissionKeys: keys }) },
          "@/modules/psychopedagogy/schemas/psychopedagogy-profile.schema": { psychopedagogyProfileSchema: { safeParse: (data) => ({ success: true, data }) } },
          "@/modules/psychopedagogy/server/psychopedagogy-profile.repository": {
            getPsychopedagogyProfile: count({}), savePsychopedagogyProfileSection: async (_id, teacherId, _data, userId) => { writes++; authorIds.push([teacherId, userId]); },
          },
          "@/modules/psychopedagogy/server/psychopedagogy.repository": {
            getPsychopedagogyStudentForSuperadmin: count({ id: "student-1" }), getPsychopedagogyTeacherForUser: count(role === "PSYCHOPEDAGOGY_TEACHER" ? { id: "teacher-1" } : null),
            listStudentPsychopedagogyEntriesForSuperadmin: count([]), createPsychopedagogyEntry: async (data) => { writes++; authorIds.push([data.teacherId, data.authorUserId]); },
          },
        });
        const context = { params: Promise.resolve({ id: "student-1" }) };
        const get = await api.GET(new Request("http://localhost"), context);
        assert.equal(get.status, keys.includes(view) ? 200 : 404);
        if (!keys.includes(view)) { assert.deepEqual(await get.json(), { error: "Alumno no disponible." }); assert.equal(calls, 0); }
        const before = calls;
        const post = await api.POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ section: "learning", description: "Visual", date: "2026-01-01", title: "Test", body: "Observation" }) }), context);
        const allowed = keys.includes(view) && keys.includes(manage);
        assert.equal(post.status, allowed ? 201 : 404, `${role}: ${keys}`);
        assert.deepEqual(await post.json(), allowed ? { ok: true } : { error: "Alumno no disponible." });
        assert.equal(writes, allowed ? 1 : 0);
        if (!allowed) assert.equal(calls, before);
        else assert.deepEqual(authorIds, [role === "PSYCHOPEDAGOGY_TEACHER" ? ["teacher-1", path.includes("handlers") ? null : undefined] : [null, "user-1"]]);
      }
    }
  });
}
for (const actorRole of ["SUPERADMIN", "ADMIN"]) test(`role editor respects ${actorRole} grant authority in create and edit forms`, () => {
  const catalog = load("modules/auth/permissions/permission-catalog.ts");
  const pass = ({ children }) => React.createElement("div", null, children);
  const { DashboardRolesView } = load("modules/roles/views/dashboard-roles-view.tsx", {
    "@prisma/client": { UserRole: { ADMIN: "ADMIN", SUPERADMIN: "SUPERADMIN" } },
    "@/components/ui/button": { Button: ({ children }) => React.createElement("button", null, children) },
    "@/components/ui/card": { Card: pass, CardContent: pass, CardHeader: pass, CardTitle: pass },
    "@/modules/auth/permissions/permission-catalog": catalog,
    "@/modules/roles/server/role.actions": { createRoleAction() {}, updateRoleAction() {}, deleteRoleAction() {} },
  });
  const html = renderToStaticMarkup(React.createElement(DashboardRolesView, {
    roles: [{ id: "custom", key: "CUSTOM", name: "Custom", description: null, baseRole: "ADMIN", isProtected: false, isActive: true,
      permissions: [{ permission: { key: view } }], _count: { users: 0, invitations: 0 } }],
    canManage: actorRole !== "SUPERADMIN", actorPermissions: [], actorRole,
  }));
  if (actorRole === "ADMIN") {
    assert.match(html, /disabled=""[^>]*value="psychopedagogy.manage"|value="psychopedagogy.manage"[^>]*disabled=""/);
    return;
  }
  assert.equal((html.match(/<legend[^>]*>Psicopedagogía<\/legend>/g) ?? []).length, 2);
  assert.doesNotMatch(html, /disabled=""/);
  for (const key of [view, manage]) assert.equal((html.match(new RegExp(`value="${key}"`, "g")) ?? []).length, 2);
  assert.match(html, /checked=""[^>]*value="psychopedagogy.view"|value="psychopedagogy.view"[^>]*checked=""/);
});

test("role actions save selected psychopedagogy permissions and reject unauthorized grants before writes", async () => {
  for (const method of ["createRoleAction", "updateRoleAction"]) for (const actorRole of ["SUPERADMIN", "ADMIN"]) for (const canGrant of [true, false]) {
    let writes = 0, invalidations = 0;
    const stored = [];
    const mutation = async (args) => { writes++; stored.push(args); return {}; };
    const { [method]: action } = load("modules/roles/server/role.actions.ts", {
      "@prisma/client": { UserRole: { ADMIN: "ADMIN", SUPERADMIN: "SUPERADMIN" } },
      "next/cache": { revalidatePath: () => invalidations++ },
      "@/modules/auth/permissions/permission-catalog": load("modules/auth/permissions/permission-catalog.ts"),
      "@/modules/auth/server/auth-guards": { requirePermission: async (permission) => {
        assert.equal(permission, "roles.manage");
        return { role: actorRole, accessRoleId: "actor", accessRoleKey: "CUSTOM", permissionKeys: canGrant ? [view, manage] : [] };
      } },
      "@/lib/prisma": { prisma: {
        permission: { findMany: async ({ where }) => where.key.in.map((key) => ({ id: key })) },
        role: { findUnique: async () => method === "createRoleAction" ? null : { key: "CUSTOM", permissions: [] }, create: mutation, update: mutation },
        rolePermission: { deleteMany: mutation, createMany: mutation },
        $transaction: async (operations) => Promise.all(operations),
      } },
    });
    const data = new FormData();
    for (const [key, value] of [["id", "custom"], ["name", "Psychopedagogy"], ["baseRole", "ADMIN"], ["permissions", view], ["permissions", manage], ["isActive", "on"]]) data.append(key, value);
    if (!canGrant && actorRole !== "SUPERADMIN") {
      await assert.rejects(action(data), /invalid_permission/);
      assert.equal(writes, 0); assert.equal(invalidations, 0); assert.deepEqual(stored, []);
    } else {
      await action(data);
      assert.ok(writes > 0); assert.equal(invalidations, 2);
      const grants = method === "createRoleAction" ? stored[0].data.permissions.create : stored.at(-1).data;
      assert.deepEqual(Array.from(grants, ({ permissionId }) => permissionId), [view, manage]);
    }
  }
});

test("psychopedagogy page uses view permission and propagates actual editing capability", async () => {
  for (const permissionKeys of [[view], [view, manage]]) {
    let checked;
    const { default: Page } = load("app/(dashboard)/dashboard/psicopedagogia/page.tsx", {
      "@/modules/auth/server/auth-guards": { requirePermission: async (key) => { checked = key; return { id: "u", role: "ADMIN", email: "x", permissionKeys }; } },
      "@/modules/dashboard/components/dashboard-shell": { DashboardShell: () => null },
      "@/modules/dashboard/server/cms-pages.repository": { discoverPagesGroupRoutes: async () => [] },
      "@/modules/psychopedagogy/views/psychopedagogy-view": { PsychopedagogyView: () => null },
    });
    const tree = await Page();
    assert.equal(checked, view);
    assert.equal(tree.props.children.props.readOnly, !permissionKeys.includes(manage));
  }
});
