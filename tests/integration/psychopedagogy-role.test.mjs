import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const specialist = "PSYCHOPEDAGOGY_TEACHER";
const UserRole = Object.fromEntries(["ADMIN", "ADMIN_OPERATOR", "ADMIN_TEACHER", "SUPERADMIN", "TEACHER", "PARENT", specialist].map((role) => [role, role]));
const InvitationStatus = { PENDING: "PENDING", ACCEPTED: "ACCEPTED", REVOKED: "REVOKED" };
function load(path, mocks = {}) {
  const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(output, {
    require: (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id === "server-only") return {};
      if (id === "@prisma/client") return { UserRole, InvitationStatus };
      if (["react", "react/jsx-runtime", "zod"].includes(id)) return require(id);
      throw new Error(`Unexpected dependency: ${id}`);
    }, module: compiled, exports: compiled.exports, console, process: { env: { NODE_ENV: "production" } }, Date,
  });
  return compiled.exports;
}
const roles = load("modules/auth/roles.ts");
const permissions = load("modules/auth/permissions/permission-catalog.ts");
const scope = load("modules/students/lib/student-read-scope.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));
const redirect = (path) => { throw new Error(`redirect:${path}`); };
function guardsFor(role, { accessRole = null, accessRoleId = null } = {}) {
  return load("modules/auth/server/auth-guards.ts", {
    "next/headers": { headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) },
    "next/navigation": { redirect },
    "@/lib/auth": { auth: { api: { getSession: async () => ({ user: { email: "test@example.test" } }) } } },
    "@/lib/prisma": { prisma: { user: { findUnique: async () => ({ id: "user-1", name: "Test", email: "test@example.test", role, familyId: null, accessRoleId, accessRole }) } } },
    "@/modules/auth/permissions/permission-catalog": permissions,
    "@/modules/auth/roles": roles,
  });
}

test("backfill plan supports specialist without resetting existing specialized or other dynamic roles", async () => {
  const { buildRoleBackfillPlan } = await import(new URL("../../scripts/role-defaults.mjs", import.meta.url).href);
  const plan = buildRoleBackfillPlan({ adminEmails: ["admin@example.test"], teacherEmails: ["teacher@example.test"], psychopedagogyTeacherEmails: ["special@example.test"] });
  assert.deepEqual(plan.map(({ role }) => role), ["ADMIN", "TEACHER", specialist, "PARENT"]);
  assert.deepEqual(plan[2].where, { email: { in: ["special@example.test"] } });
  assert.deepEqual(plan[3].where.email.notIn, ["admin@example.test", "teacher@example.test", "special@example.test"]);
  assert.deepEqual(plan[3].where.role.in, ["ADMIN", "TEACHER", "PARENT"]);
  assert.deepEqual(plan[3].where.accessRoleId, null);
  const old = buildRoleBackfillPlan({ adminEmails: ["admin@example.test"], teacherEmails: ["teacher@example.test"] });
  assert.deepEqual(old.map(({ role }) => role), ["ADMIN", "TEACHER", "PARENT"]);
});

test("specialist is a dashboard role, not a broad teacher or administrator, with minimal defaults", async () => {
  assert.equal(roles.isDashboardRole(specialist), true);
  assert.equal(roles.isTeacherRole(specialist), false);
  assert.equal(roles.isAdminRole(specialist), false);
  const guards = guardsFor(specialist);
  const user = await guards.requireDashboardUser();
  assert.deepEqual(plain(user.permissionKeys), ["dashboard.access", "students.view"]);
  assert.equal(await guards.getAdminUser(), null);
  for (const permission of ["students.manage", "families.view", "families.payments", "teachers.manage", "users.manage", "calendar.view", "cash-fund.view", "inventory.view", "roles.manage"]) {
    await assert.rejects(guards.requirePermission(permission), /redirect:\/dashboard\?error=forbidden/);
  }
  await assert.rejects(guards.requireRole(["TEACHER", "ADMIN_TEACHER"]), /redirect:/);
  assert.equal((await guards.requirePermission("students.view")).role, specialist);
});

test("assigned active dynamic permissions govern specialist auth; inactive roles never fall back", async () => {
  const active = guardsFor(specialist, { accessRoleId: "special", accessRole: { name: "Docente psicopedagógico", key: specialist, isActive: true, permissions: [{ permission: { key: "dashboard.access" } }, { permission: { key: "students.view" } }] } });
  assert.equal((await active.requireDashboardUser()).accessRoleKey, specialist);
  assert.deepEqual(plain((await active.requireUser()).permissionKeys), ["dashboard.access", "students.view"]);
  const inactive = guardsFor(specialist, { accessRoleId: "special", accessRole: { name: "Inactivo", key: specialist, isActive: false, permissions: [{ permission: { key: "dashboard.access" } }] } });
  assert.deepEqual(plain((await inactive.requireUser()).permissionKeys), []);
  await assert.rejects(inactive.requireDashboardUser(), /redirect:/);
});

test("Kanban guard excludes specialist without removing dashboard entry and preserves every prior dashboard role", async () => {
  const specialistGuards = guardsFor(specialist);
  await assert.rejects(specialistGuards.requireDashboardUser(undefined, "kanban"), /redirect:/);
  assert.equal((await specialistGuards.requireDashboardUser()).role, specialist);
  for (const role of ["ADMIN", "ADMIN_OPERATOR", "ADMIN_TEACHER", "SUPERADMIN", "TEACHER"]) {
    const user = await guardsFor(role).requireDashboardUser(undefined, "kanban");
    assert.equal(user.role, role);
    assert.equal(roles.isDashboardRole(role), true);
  }
  await assert.rejects(guardsFor("PARENT").requireDashboardUser(undefined, "kanban"), /redirect:/);
});

test("public Kanban actions reject specialist before any data query or mutation", async () => {
  const guards = guardsFor(specialist);
  let dataCalls = 0;
  const actions = load("modules/kanban/server/kanban.actions.ts", {
    "next/cache": { revalidatePath: () => { dataCalls++; } },
    "@/lib/prisma": { prisma: new Proxy({}, { get: () => { dataCalls++; throw new Error("unexpected data access"); } }) },
    "@/modules/auth/server/auth-guards": guards,
    "@/modules/kanban/domain/kanban-validation": {},
    "@/modules/kanban/server/kanban.repository": {},
    "@/modules/kanban/server/kanban-notifications": {},
  });
  for (const [name, args] of [["listBoardsAction", []], ["getBoardAction", ["board-1"]], ["listAssigneesAction", []], ["createBoardAction", [{ name: "Board" }]], ["listKanbanNotificationsAction", []]]) {
    await assert.rejects(actions[name](...args), /redirect:/);
  }
  assert.equal(dataCalls, 0);
});

test("Kanban assignees exclude specialist; existing active permission precedence is unchanged", async () => {
  const users = [
    { id: "specialist", name: "Specialist", role: specialist, accessRoleId: null, accessRole: null },
    { id: "teacher", name: "Teacher", role: "TEACHER", accessRoleId: null, accessRole: null },
    { id: "parent", name: "Parent", role: "PARENT", accessRoleId: null, accessRole: null },
    { id: "inactive", name: "Inactive", role: "ADMIN", accessRoleId: "inactive-role", accessRole: { isActive: false, permissions: [] } },
    { id: "custom", name: "Custom", role: "ADMIN", accessRoleId: "active-role", accessRole: { isActive: true, permissions: [{ permission: { key: "dashboard.access" } }] } },
  ];
  const repo = load("modules/kanban/server/kanban.repository.ts", {
    "@/lib/prisma": { prisma: { user: { findMany: async () => users } } },
    "@/modules/auth/permissions/permission-catalog": permissions,
    "@/modules/kanban/domain/kanban-validation": {},
  });
  assert.deepEqual(plain(await repo.listInternalAssignees()), [{ id: "teacher", name: "Teacher" }, { id: "custom", name: "Custom" }]);
  await assert.rejects(repo.requireAssignee({ user: { findUnique: async () => users[0] } }, "specialist"), /La persona responsable debe tener acceso al dashboard\./);
  assert.equal(await repo.requireAssignee({ user: { findUnique: async () => users[1] } }, "teacher"), undefined);
});

test("dashboard landing sends specialist to psychopedagogy, preserving Superadmin destination", async () => {
  for (const [role, path] of [[specialist, "/dashboard/psicopedagogia"], ["SUPERADMIN", "/dashboard/administracion"]]) {
    const { default: Page } = load("app/(dashboard)/dashboard/page.tsx", {
      "next/navigation": { redirect },
      "@/modules/auth/server/auth-guards": { requireDashboardUser: async () => ({ role, permissionKeys: [] }) },
      "@/modules/dashboard/components/dashboard-shell": {},
      "@/modules/dashboard/server/cms-pages.repository": {},
      "@/modules/teachers/views/teacher-home-view": {},
    });
    await assert.rejects(Page(), new RegExp(`redirect:${path}$`));
  }
});

function userRepository(prisma) {
  return load("modules/users/server/users.repository.ts", {
    "@/lib/prisma": { prisma },
    "@/modules/auth/roles": roles,
    "@/modules/mailing/server/invitation-delivery-job.repository": { cancelStaleInvitationDeliveryJobs: async () => {}, createInvitationDeliveryJob: async () => {} },
    "@/modules/users/lib/user-invitation-policy": load("modules/users/lib/user-invitation-policy.ts"),
    "@/modules/users/server/invitation-token-cipher": { encryptInvitationToken: () => "encrypted", decryptInvitationToken: () => "token" },
    "@/modules/users/server/user-invitation-token": { createInvitationToken: () => ({ token: "token", tokenHash: "hash", expiresAt: new Date("2030-01-01") }), hashInvitationToken: () => "hash" },
  });
}

test("dynamic assignment provisions specialist authorship profile, preserves teacher assignment, and deactivates on exit", async () => {
  for (const nextRole of [specialist, "TEACHER", "ADMIN_TEACHER", "PARENT"]) {
    const updates = [], profiles = [], deactivations = [];
    const tx = {
      user: { update: async ({ data }) => { updates.push(data); return { id: "user-1", name: "Test", email: "test@example.test", role: data.role }; } },
      teacherProfile: { upsert: async (data) => profiles.push(data), updateMany: async (data) => deactivations.push(data) },
    };
    const repo = userRepository({
      role: { findFirst: async () => ({ id: "role-next", key: nextRole, baseRole: nextRole }) },
      user: { findUnique: async () => ({ id: "user-1", role: specialist, accessRole: null }) },
      $transaction: async (fn) => fn(tx),
    });
    assert.equal((await repo.updateUserRole({ userId: "user-1", accessRoleId: "role-next" })).role, nextRole);
    assert.equal(updates[0].accessRoleId, "role-next");
    assert.equal(profiles.length, nextRole === "PARENT" ? 0 : 1);
    if (profiles.length) {
      assert.equal(profiles[0].where.userId, "user-1");
      assert.equal(profiles[0].create.isActive, true);
      assert.equal(profiles[0].update.isActive, true);
    }
    assert.equal(deactivations.length, nextRole === "PARENT" ? 1 : 0);
  }
});

test("invitation creation and signup carry dynamic specialist role and provision profile, without family or group grants", async () => {
  let invitation, userUpdate, profile;
  const tx = {
    user: { findUnique: async () => ({ id: "user-1", name: "Test", email: "test@example.test" }), update: async ({ data }) => { userUpdate = data; } },
    userInvitation: {
      findUnique: async () => invitation ?? null,
      create: async ({ data }) => { invitation = { id: "invite-1", ...data }; return invitation; },
      update: async ({ data }) => { invitation = { ...invitation, ...data }; return invitation; },
    },
    teacherProfile: { upsert: async (data) => { profile = data; } },
    studentGuardian: { updateMany: async () => {} },
  };
  const repo = userRepository({ role: { findFirst: async () => ({ id: "role-special", key: specialist, baseRole: specialist }) }, user: { findUnique: async () => null }, $transaction: async (fn) => fn(tx) });
  await repo.createUserInvitation({ email: "test@example.test", accessRoleId: "role-special", invitedById: "admin-1" });
  assert.equal(invitation.role, specialist);
  assert.equal(invitation.accessRoleId, "role-special");
  assert.equal(invitation.familyId, null);
  await repo.reconcileUserInvitationAfterSignup("test@example.test", "token");
  assert.deepEqual(plain(userUpdate), { role: specialist, accessRoleId: "role-special", familyId: null });
  assert.equal(profile.create.userId, "user-1");
  assert.equal(profile.create.isActive, true);
  assert.equal(profile.create.organizationGroup, null);
  assert.equal(invitation.status, "ACCEPTED");
});

test("specialist can open global read-only student detail; old teacher, parent and admin read scopes are preserved", async () => {
  const queries = [];
  const student = { id: "student-1", firstName: "Test", lastName: "Student", birthDate: new Date("2020-01-01"), updatedAt: new Date("2026-01-01"), group: { name: "Group" }, guardians: [], responsibles: [], recordStatus: "SUBMITTED" };
  const repo = load("modules/students/server/students.repository.ts", {
    "@/lib/prisma": { prisma: { student: { findFirst: async (query) => { queries.push(query); return student; } } } },
    "@/modules/students/lib/student-read-scope": scope,
  });
  assert.equal((await repo.getStudentRecordForViewer("student-1", { id: "user-1", role: specialist })).id, "student-1");
  assert.deepEqual(plain(queries[0].where), { id: "student-1" });
  assert.equal(queries[0].include.family.select.streetAndNumber, true);
  assert.equal(queries[0].include.family.select.payments, undefined);
  const pass = ({ children }) => React.createElement("div", null, children);
  let reportProps;
  const { default: Page } = load("app/(dashboard)/dashboard/students/[id]/page.tsx", {
    "lucide-react": { ArrowLeft: () => null }, "next/link": { default: ({ children, href }) => React.createElement("a", { href }, children), __esModule: true },
    "next/navigation": { notFound: () => { throw new Error("notFound"); } },
    "@/components/ui/badge": { Badge: pass }, "@/components/ui/button": { Button: ({ children }) => React.createElement("button", null, children) },
    "@/components/ui/accordion": { Accordion: pass, AccordionContent: pass, AccordionItem: pass, AccordionTrigger: pass },
    "@/components/ui/card": { Card: pass, CardContent: pass, CardHeader: pass, CardTitle: pass },
    "@/modules/auth/server/auth-guards": { requirePermission: async (permission) => { assert.equal(permission, "students.view"); return { id: "user-1", role: specialist, email: "test@example.test", permissionKeys: ["dashboard.access", "students.view"] }; } },
    "@/modules/dashboard/components/dashboard-shell": { DashboardShell: pass },
    "@/modules/dashboard/server/cms-pages.repository": { discoverPagesGroupRoutes: async () => [] },
    "@/modules/students/server/student.actions": { updateStudentRecordStatusAction: () => { throw new Error("must not edit"); } },
    "@/modules/students/server/students.repository": { getStudentRecordForViewer: async () => student, listStudentReportsForViewer: async () => [{ id: "report-1", createdAt: new Date(), teacher: { displayName: "Teacher", userId: "user-1" } }] },
    "@/modules/family-dashboard/lib/admission-questionnaire": { admissionQuestionnaireSections: [], readQuestionnaireAnswers: () => ({}) },
    "@/modules/teachers/components/create-student-report-dialog": { CreateStudentReportDialog: () => { throw new Error("must not grant teacher report creation"); } },
    "@/modules/teachers/components/teacher-reports-table": { TeacherReportsTable: (props) => { reportProps = props; return null; } },
    "@/modules/psychopedagogy/components/psychopedagogy-profile": { PsychopedagogyProfile: () => null },
  });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: "student-1" }) }));
  assert.match(html, /Test Student/);
  assert.doesNotMatch(html, /Solicitar cambios|Marcar revisada|Gestionar pagos/);
  assert.equal(reportProps.reports[0].canManageVisibility, false);
  for (const role of ["TEACHER", "ADMIN_TEACHER"]) {
    const where = scope.studentWhereForViewer({ id: "teacher-user", role });
    assert.equal(where.status, "ACTIVE");
    assert.equal(where.group.teacherResponsibilities.some.teacher.is.userId, "teacher-user");
  }
  assert.deepEqual(plain(scope.studentWhereForViewer({ id: "parent", role: "PARENT" })), { id: { in: [] } });
  assert.equal(scope.studentWhereForViewer({ id: "admin", role: "ADMIN" }), undefined);
});


test("specialist invitation email renders its role label and preserves existing labels", () => {
  const tags = { Html: "html", Head: "head", Body: "body", Container: "div", Preview: "div", Heading: "h1", Section: "section", Text: "p", Button: "a" };
  const components = Object.fromEntries(Object.entries(tags).map(([name, tag]) => [name, ({ children, ...props }) => React.createElement(tag, props, children)]));
  const { UserInvitationEmail } = load("modules/mailing/templates/user-invitation-email.tsx", {
    "@react-email/components": components,
    "@/modules/mailing/lib/email-copy": { EMAIL_LOCALE: "es", USER_INVITATION_SUBJECT: "Invitación a Koru" },
  });
  for (const [role, label] of [[specialist, "docente psicopedagógico"], ["TEACHER", "docente"], ["PARENT", "familia"], ["SUPERADMIN", "superadministrador"]]) {
    const html = renderToStaticMarkup(React.createElement(UserInvitationEmail, { email: "new@example.test", role, invitationUrl: "https://koru.test/invitation" }));
    assert.ok(html.includes(`<strong>${label}</strong>`), `Missing invitation label for ${role}`);
    assert.match(html, /href="https:\/\/koru.test\/invitation"/);
    assert.match(html, /new@example.test/);
  }
});
