import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const plain = (value) => JSON.parse(JSON.stringify(value));
function load(file, mocks = {}, env = "production", globals = {}) {
  const output = ts.transpileModule(readFileSync(new URL(`../../src/${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, {
    module: mod, exports: mod.exports, process: { env: { NODE_ENV: env }, cwd: () => "/app" }, ...globals,
    require: (id) => {
      if (id in mocks) return mocks[id];
      if (id === "server-only") return {};
      if (id.startsWith("react")) return require(id);
      if (id === "node:path") return path;
      throw new Error(`Unexpected dependency: ${id}`);
    },
  });
  return mod.exports;
}

// React's server dispatcher owns cache lifetime. Model distinct concurrent requests,
// not a process-global memoizer (React cache is a no-op outside a server render).
function identityFixture(env = "production") {
  const requests = new AsyncLocalStorage();
  const calls = { sessions: 0, users: 0, targets: 0, cookies: 0 };
  const targetQueries = [];
  const cache = (fn) => {
    const key = Symbol();
    return (...args) => {
      const request = requests.getStore();
      if (!request) return fn(...args);
      if (!request.cache.has(key)) request.cache.set(key, fn(...args));
      return request.cache.get(key);
    };
  };
  const guards = load("modules/auth/server/auth-guards.ts", {
    react: { cache },
    "next/headers": {
      headers: async () => requests.getStore(),
      cookies: async () => { calls.cookies++; return { get: () => ({ value: requests.getStore().target }) }; },
    },
    "next/navigation": { redirect: (to) => { throw new Error(`redirect:${to}`); } },
    "@/lib/auth": { auth: { api: { getSession: async ({ headers }) => { calls.sessions++; if (headers.failSession) throw new Error("session failed"); return headers.user ? { user: { email: headers.user.email } } : null; } } } },
    "@/lib/prisma": { prisma: { user: {
      findUnique: async () => { calls.users++; return requests.getStore().user; },
      findFirst: async (query) => { calls.targets++; targetQueries.push(query); return requests.getStore().targetUser ?? null; },
    } } },
    "@prisma/client": { UserRole: { PARENT: "PARENT", TEACHER: "TEACHER", ADMIN_TEACHER: "ADMIN_TEACHER" } },
    "@/modules/calendar/lib/calendar-access": { isInternalCalendarRole: (role) => role !== "PARENT" },
    "@/modules/auth/permissions/permission-catalog": { legacyRolePermissions: { PARENT: [], TEACHER: ["dashboard.access"], ADMIN: ["dashboard.access"] } },
    "@/modules/auth/roles": { isAdminRole: (role) => ["ADMIN", "SUPERADMIN"].includes(role) },
  }, env);
  return { guards, calls, targetQueries, run: (user, fn, extra = {}) => requests.run({ user, cache: new Map(), ...extra }, fn) };
}
const user = (id, extra = {}) => ({ id, name: id, email: `${id}@example.test`, role: "TEACHER", familyId: null, accessRoleId: null, accessRole: null, ...extra });

test("identity is reused within a request, isolated across concurrent users and a subsequent anonymous request", async () => {
  const { guards, run, calls } = identityFixture();
  await Promise.all(["alice", "bob"].map((id) => run(user(id), async () => {
    const [session, actual, effective, again] = await Promise.all([guards.getSession(), guards.getActualAuthenticatedUser(), guards.getAuthenticatedUser(), guards.requireUser()]);
    assert.equal(session.user.email, `${id}@example.test`);
    assert.equal(actual.id, id);
    assert.equal(effective, actual);
    assert.equal(again, actual);
    assert.equal(await guards.getAdminUser(), null);
  })));
  assert.deepEqual(calls, { sessions: 2, users: 2, targets: 0, cookies: 0 });
  await run(null, async () => {
    assert.equal(await guards.getAuthenticatedUser(), null);
    await assert.rejects(guards.requireUser(), /redirect:\/sign-in/);
    await assert.rejects(guards.requireSession("/login"), /redirect:\/login/);
  });
  assert.deepEqual(calls, { sessions: 3, users: 2, targets: 0, cookies: 0 });
});

test("session errors do not poison a subsequent request", async () => {
  const { guards, run, calls } = identityFixture();
  await run(user("alice"), async () => {
    await assert.rejects(guards.getAuthenticatedUser(), /session failed/);
    await assert.rejects(guards.getAuthenticatedUser(), /session failed/);
  }, { failSession: true });
  assert.equal(calls.sessions, 1); assert.equal(calls.users, 0);
  await run(user("bob"), async () => assert.equal((await guards.requireUser()).id, "bob"));
  assert.equal(calls.sessions, 2); assert.equal(calls.users, 1);
});

test("cached identity preserves permission, role, admin and inactive-role refusals", async () => {
  const { guards, run, calls } = identityFixture();
  await run(user("inactive", { accessRoleId: "disabled", accessRole: { name: "Disabled", key: "disabled", isActive: false, permissions: [{ permission: { key: "dashboard.access" } }] } }), async () => {
    assert.deepEqual(plain((await guards.requireUser()).permissionKeys), []);
    for (const action of [() => guards.requirePermission("dashboard.access"), () => guards.requireAnyPermission(["dashboard.access"]), () => guards.requireRole(["ADMIN"]), () => guards.requireAdmin(), () => guards.requireDashboardUser()]) {
      await assert.rejects(action(), /redirect:\/dashboard\?error=forbidden/);
    }
  });
  assert.deepEqual(calls, { sessions: 1, users: 1, targets: 0, cookies: 0 });
  await run(user("admin", { role: "ADMIN" }), async () => {
    assert.equal((await guards.requireAdmin()).id, "admin");
    assert.equal((await guards.requirePermission("calendar.manage")).id, "admin");
    assert.equal((await guards.requireAnyPermission(["calendar.view"])).id, "admin");
    assert.equal((await guards.requireRole(["ADMIN"])).id, "admin");
    assert.equal((await guards.requireDashboardUser()).id, "admin");
  });
});

test("development impersonation is reused per request, invalid targets fall back, production ignores cookie", async () => {
  const source = readFileSync(new URL("../../src/modules/auth/server/auth-guards.ts", import.meta.url), "utf8");
  const controllerEmail = source.match(/DEVELOPMENT_VIEWER_EMAIL = "([^"]+)"/)[1];
  const controller = user("controller", { email: controllerEmail });
  const dev = identityFixture("development");
  await dev.run(controller, async () => {
    const [a, b] = await Promise.all([dev.guards.getAuthenticatedUser(), dev.guards.getAuthenticatedUser()]);
    assert.equal(a.id, "family"); assert.equal(a, b);
    assert.equal((await dev.guards.getActualAuthenticatedUser()).id, "controller");
  }, { target: "family", targetUser: user("family", { role: "PARENT", familyId: "f" }) });
  assert.deepEqual(dev.calls, { sessions: 1, users: 1, targets: 1, cookies: 1 });
  assert.deepEqual(plain(dev.targetQueries[0].where), { id: "family", OR: [{ role: "PARENT", familyId: { not: null } }, { role: { in: ["TEACHER", "ADMIN_TEACHER"] }, teacherProfile: { is: { isActive: true } } }] });
  await dev.run(user("ordinary"), async () => assert.equal((await dev.guards.getAuthenticatedUser()).id, "ordinary"), { target: "family" });
  assert.equal(dev.calls.targets, 1); assert.equal(dev.calls.cookies, 1);
  await dev.run(controller, async () => assert.equal((await dev.guards.getAuthenticatedUser()).id, "controller"), { target: "invalid" });
  const prod = identityFixture();
  await prod.run(controller, async () => assert.equal((await prod.guards.getAuthenticatedUser()).id, "controller"), { target: "family" });
  assert.equal(prod.calls.targets, 0); assert.equal(prod.calls.cookies, 0);
});

function developmentApi(env, allowed = true) {
  const calls = { auth: 0, reads: 0, body: 0, cookie: 0, writes: [] };
  const route = load("app/api/development/view/route.ts", {
    "next/server": { NextResponse: { json: (body, { status = 200 } = {}) => ({ body, status, cookies: { set: (...args) => calls.writes.push(args), delete: (...args) => calls.writes.push(args) } }) } },
    "@prisma/client": { UserRole: { TEACHER: "TEACHER", ADMIN_TEACHER: "ADMIN_TEACHER", PARENT: "PARENT" } },
    "@/modules/auth/server/auth-guards": {
      DEVELOPMENT_VIEW_COOKIE: "view", getActualAuthenticatedUser: async () => { calls.auth++; return allowed ? {} : null; },
      isDevelopmentViewController: () => allowed,
      getDevelopmentViewTargetId: async () => { calls.cookie++; return "target"; },
    },
    "@/lib/prisma": { prisma: {
      teacherProfile: { findMany: async () => { calls.reads++; return [{ userId: "t", displayName: "Teacher" }]; } },
      user: { findMany: async () => { calls.reads++; return [{ id: "f", name: "Parent", family: { name: "Family" } }]; }, findFirst: async ({ where }) => { calls.reads++; return where.id === "valid" ? { id: "valid" } : null; } },
    } },
  }, env);
  const post = (input) => route.POST({ json: async () => { calls.body++; return input; } });
  return { route, calls, post };
}

test("production development API returns exact 404 before auth, cookies, body or database work", async () => {
  const { route, calls, post } = developmentApi("production");
  for (const result of [await route.GET(), await post({ kind: "own" })]) {
    assert.equal(result.status, 404); assert.deepEqual(plain(result.body), { ok: false });
  }
  assert.deepEqual(calls, { auth: 0, reads: 0, body: 0, cookie: 0, writes: [] });
});

test("development API preserves listing, teacher/family selection, own view and refusal without writes", async () => {
  const { route, calls, post } = developmentApi("development");
  assert.deepEqual(plain((await route.GET()).body), { enabled: true, selectedUserId: "target", teachers: [{ id: "t", label: "Teacher" }], families: [{ id: "f", label: "Family · Parent" }] });
  for (const kind of ["teacher", "family"]) {
    const response = await post({ kind, targetUserId: "valid" });
    assert.equal(response.status, 200);
    assert.equal(response.body.redirectTo, kind === "family" ? "/family-dashboard?view=dashboard" : "/dashboard");
    assert.deepEqual(plain(calls.writes.at(-1)), ["view", "valid", { httpOnly: true, sameSite: "lax", path: "/" }]);
  }
  assert.equal((await post({ kind: "own" })).status, 200);
  assert.deepEqual(calls.writes.at(-1), ["view"]);
  const writes = calls.writes.length;
  for (const input of [null, { kind: "unknown" }, { kind: "family" }, { kind: "teacher", targetUserId: "invalid" }]) {
    const response = await post(input);
    assert.equal(response.status, 400); assert.deepEqual(plain(response.body), { ok: false });
  }
  assert.equal(calls.writes.length, writes);
  const denied = developmentApi("development", false);
  assert.equal((await denied.route.GET()).status, 404);
  assert.equal((await denied.post({ kind: "own" })).status, 404);
  assert.deepEqual(denied.calls, { auth: 2, reads: 0, body: 0, cookie: 0, writes: [] });
});

test("production switcher performs no fetch; development still loads options", async () => {
  for (const env of ["production", "development"]) {
    const calls = [];
    const component = load("modules/auth/components/development-view-switcher.tsx", {
      react: { useState: (initial) => [initial, () => {}], useEffect: (fn) => fn() },
      "lucide-react": {}, "@/components/ui/button": {},
    }, env, { fetch: (...args) => { calls.push(args); return Promise.resolve({ ok: false }); } });
    assert.equal(component.DevelopmentViewSwitcher(), null);
    await Promise.resolve();
    assert.deepEqual(plain(calls), env === "production" ? [] : [["/api/development/view", { cache: "no-store" }]]);
  }
});

function cmsFixture(env = "production") {
  const calls = { scans: 0, saves: [], invalidations: 0 };
  let rejectScan = false, failStage = "";
  const repo = load("modules/dashboard/server/cms-pages.repository.ts", {
    "node:fs/promises": { readdir: async () => {
      calls.scans++;
      if (rejectScan) throw new Error("scan failed");
      return [{ name: "page.tsx", isDirectory: () => false }];
    } },
    "@prisma/client": { BlockType: { RICH_TEXT: "RICH_TEXT" }, PageStatus: { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED" } },
    "@/lib/prisma": { prisma: {
      page: { upsert: async (input) => { calls.saves.push("page"); if (failStage === "page") throw new Error("page failed"); return { id: "p", ...input.create }; }, findUnique: async () => null },
      pageBlock: { upsert: async () => { calls.saves.push("block"); if (failStage === "block") throw new Error("block failed"); } },
    } },
    "@/modules/cms/server/published-cms-cache": { invalidatePublishedCms: () => { calls.invalidations++; } },
  }, env);
  return { repo, calls, rejectScan: (value) => { rejectScan = value; }, failAt: (value) => { failStage = value; } };
}

test("production route discovery shares in-flight/successful work and retries rejected discovery; development stays fresh", async () => {
  const prod = cmsFixture();
  prod.rejectScan(true);
  const failed = await Promise.allSettled([prod.repo.discoverPagesGroupRoutes(), prod.repo.discoverPagesGroupRoutes()]);
  assert.deepEqual(failed.map((r) => r.status), ["rejected", "rejected"]);
  assert.equal(prod.calls.scans, 1);
  prod.rejectScan(false);
  const [a, b] = await Promise.all([prod.repo.discoverPagesGroupRoutes(), prod.repo.discoverPagesGroupRoutes()]);
  assert.equal(a[0].slug, "/"); assert.deepEqual(plain(a), plain(b));
  a[0].slug = "/mutated";
  a.length = 0;
  assert.equal((await prod.repo.discoverPagesGroupRoutes())[0].slug, "/");
  assert.equal(b[0].slug, "/");
  assert.equal(prod.calls.scans, 2);
  const dev = cmsFixture("development");
  await dev.repo.discoverPagesGroupRoutes(); await dev.repo.discoverPagesGroupRoutes();
  assert.equal(dev.calls.scans, 2);
});

test("CMS invalidates public content only after both persistence steps succeed, including draft/unpublish; errors never invalidate", async () => {
  for (const status of ["PUBLISHED", "DRAFT"]) {
    for (const stage of ["page", "block", ""]) {
      const { repo, calls, failAt } = cmsFixture();
      failAt(stage);
      const save = repo.saveEditableCmsPage({ slug: "/", title: "Home", status, content: "updated", seoTitle: "", seoDescription: "" });
      if (stage) await assert.rejects(save, new RegExp(`${stage} failed`));
      else await save;
      assert.equal(calls.invalidations, stage ? 0 : 1);
      assert.deepEqual(calls.saves, stage === "page" ? ["page"] : ["page", "block"]);
    }
  }
  assert.deepEqual(plain(await cmsFixture().repo.getEditableCmsPage("/missing")), { slug: "/missing", title: "Missing", status: "DRAFT", seoTitle: "", seoDescription: "", content: "" });
});
