import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const plain = (value) => JSON.parse(JSON.stringify(value));
const roles = ["ADMIN", "ADMIN_OPERATOR", "ADMIN_TEACHER", "SUPERADMIN", "TEACHER", "PSYCHOPEDAGOGY_TEACHER"];
const model = (schema, name) => {
  const match = schema.match(new RegExp(`model ${name} \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `missing ${name} model`);
  return match[1];
};

function load(path, mocks) {
  const module = { exports: {} };
  const output = ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(output, {
    module, exports: module.exports,
    require: (id) => {
      if (id === "server-only") return {};
      assert.ok(Object.hasOwn(mocks, id), `unexpected dependency ${id}`);
      return mocks[id];
    },
  });
  return module.exports;
}

test("S1 schema adds classification, responsible area, multiple involved areas and scoped audiences", () => {
  const schema = read("prisma/schema.prisma");
  assert.match(schema, /enum CalendarAccessScope \{\s+LEGACY\s+INTERNAL\s+AREAS\s+PEOPLE\s+\}/);
  const event = model(schema, "CalendarEvent");
  assert.match(event, /accessScope\s+CalendarAccessScope\s+@default\(LEGACY\)/);
  assert.match(event, /responsibleAreaId\s+String\?/);
  assert.match(event, /responsibleArea\s+CalendarArea\?\s+@relation\("CalendarResponsibleArea", fields: \[responsibleAreaId\], references: \[id\], onDelete: Restrict\)/);
  assert.match(event, /areaLinks\s+CalendarEventArea\[\]/);
  assert.match(event, /audienceAreas\s+CalendarEventAudienceArea\[\]/);
  const area = model(schema, "CalendarArea");
  assert.match(area, /id\s+String\s+@id @default\(cuid\(\)\)/);
  assert.match(area, /name\s+String\s+@unique/);
  assert.match(area, /color\s+String/);
  assert.match(area, /grants\s+CalendarAreaGrant\[\]/);
  assert.match(area, /responsibleEvents\s+CalendarEvent\[\]\s+@relation\("CalendarResponsibleArea"\)/);
  assert.match(area, /eventLinks\s+CalendarEventArea\[\]/);
  assert.match(area, /audienceEvents\s+CalendarEventAudienceArea\[\]/);
  for (const name of ["CalendarEventArea", "CalendarEventAudienceArea"]) {
    const link = model(schema, name);
    assert.match(link, /@@id\(\[eventId, areaId\]\)/);
    assert.match(link, /event\s+CalendarEvent\s+@relation\(fields: \[eventId\], references: \[id\], onDelete: Cascade\)/);
    assert.match(link, /area\s+CalendarArea\s+@relation\(fields: \[areaId\], references: \[id\], onDelete: Cascade\)/);
  }
});

test("S2 schema adds unique per-user read/edit grants", () => {
  const schema = read("prisma/schema.prisma");
  const grant = model(schema, "CalendarAreaGrant");
  assert.match(grant, /id\s+String\s+@id @default\(cuid\(\)\)/);
  assert.match(grant, /user\s+User\s+@relation\(fields: \[userId\], references: \[id\], onDelete: Cascade\)/);
  assert.match(grant, /area\s+CalendarArea\s+@relation\(fields: \[areaId\], references: \[id\], onDelete: Cascade\)/);
  assert.match(grant, /canEdit\s+Boolean\s+@default\(false\)/);
  assert.match(grant, /@@unique\(\[areaId, userId\]\)/);
  assert.match(model(schema, "User"), /calendarAreaGrants\s+CalendarAreaGrant\[\]/);
});

test("S1/S2 additive PostgreSQL migration preserves legacy events and seeds exactly four fixed areas", () => {
  const sql = read("prisma/migrations/20260901090000_calendar_institutional_areas/migration.sql");
  assert.match(sql, /CREATE TYPE "CalendarAccessScope" AS ENUM \('LEGACY', 'INTERNAL', 'AREAS', 'PEOPLE'\)/);
  assert.match(sql, /ADD COLUMN\s+"accessScope" "CalendarAccessScope" NOT NULL DEFAULT 'LEGACY'/);
  assert.match(sql, /ADD COLUMN\s+"responsibleAreaId" TEXT/);
  assert.match(sql, /FOREIGN KEY \("responsibleAreaId"\) REFERENCES "CalendarArea"\("id"\) ON DELETE RESTRICT ON UPDATE CASCADE/);
  assert.match(sql, /"canEdit" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(sql, /CREATE UNIQUE INDEX "CalendarAreaGrant_areaId_userId_key" ON "CalendarAreaGrant"\("areaId", "userId"\)/);
  assert.match(sql, /FOREIGN KEY \("userId"\) REFERENCES "user"\("id"\) ON DELETE CASCADE/);
  for (const table of ["CalendarEventArea", "CalendarEventAudienceArea"]) {
    assert.match(sql, new RegExp(`CONSTRAINT "${table}_pkey" PRIMARY KEY \\("eventId", "areaId"\\)`));
    assert.match(sql, new RegExp(`ALTER TABLE "${table}"[\\s\\S]*?FOREIGN KEY \\("eventId"\\) REFERENCES "CalendarEvent"\\("id"\\) ON DELETE CASCADE`));
    assert.match(sql, new RegExp(`ALTER TABLE "${table}"[\\s\\S]*?FOREIGN KEY \\("areaId"\\) REFERENCES "CalendarArea"\\("id"\\) ON DELETE CASCADE`));
  }
  const seeds = [
    ["direction", "Dirección"], ["academic", "Académico"],
    ["psychopedagogy", "Coordinación Psicopedagógica y Acompañamiento a Familias"],
    ["operations", "Operaciones y Mantenimiento"],
  ];
  for (const [id, name] of seeds) {
    assert.match(sql, new RegExp(`\\('calendar-area-${id}', '${name}', '#[0-9A-Fa-f]{6}'\\)`));
  }
  assert.equal((sql.match(/\('calendar-area-/g) ?? []).length, 4);
  assert.doesNotMatch(sql, /\b(?:UPDATE|DELETE FROM|DROP|TRUNCATE)\s+"?(?:CalendarEvent|CalendarEventAudience|user)"?/i);
});

test("PRESERVE existing legacy event defaults and person audience relation remain available", () => {
  const schema = read("prisma/schema.prisma");
  const event = model(schema, "CalendarEvent");
  assert.match(event, /visibility\s+CalendarEventVisibility\s+@default\(MEMBERS\)/);
  assert.match(event, /audienceType\s+CalendarAudienceType\s+@default\(ALL\)/);
  assert.match(event, /audiences\s+CalendarEventAudience\[\]/);
  assert.match(model(schema, "CalendarEventAudience"), /@@unique\(\[eventId, userId\]\)/);
});

function app() {
  let grant = null;
  let userRole = "TEACHER";
  let areaExists = true;
  let denied = false;
  const effects = { writes: 0, guards: [], refreshes: [], callbacks: [], syncs: [] };
  const prisma = {
    calendarArea: {
      findUnique: async ({ where }) => areaExists && where.id === "area" ? { id: "area" } : null,
      findMany: async (args) => {
        if (args.select) {
          assert.deepEqual(plain(args.select), { id: true, name: true, color: true });
          return [{ id: "area", name: "Académico", color: "#2563eb" }];
        }
        assert.deepEqual(plain(args.include.grants.include.user.select), { id: true, name: true, email: true, role: true });
        return [{ id: "area", name: "Académico", color: "#2563eb", grants: grant ? [{ ...grant, user: { id: "user", name: "Docente", email: "teacher@example.invalid", role: userRole } }] : [] }];
      },
    },
    user: { findUnique: async ({ where }) => where.id === "user" && userRole ? { id: "user", role: userRole } : null },
    calendarAreaGrant: {
      findMany: async ({ where, select }) => {
        assert.deepEqual(plain(select), { areaId: true, canEdit: true });
        return grant && where.userId === grant.userId ? [{ areaId: grant.areaId, canEdit: grant.canEdit }] : [];
      },
      upsert: async ({ where, create, update }) => {
        assert.deepEqual(plain(where), { areaId_userId: { areaId: "area", userId: "user" } });
        effects.writes++;
        grant = grant ? { ...grant, ...update } : { id: "grant", ...create };
        return grant;
      },
      deleteMany: async ({ where }) => {
        assert.deepEqual(plain(where), { areaId: "area", userId: "user" });
        const count = grant ? 1 : 0;
        effects.writes += count;
        grant = null;
        return { count };
      },
    },
  };
  const repository = load("src/modules/calendar/server/calendar-areas.repository.ts", {
    "@/lib/prisma": { prisma },
    "@prisma/client": { UserRole: Object.fromEntries([...roles, "PARENT"].map((role) => [role, role])) },
  });
  const actions = load("src/modules/calendar/server/calendar-areas.actions.ts", {
    "@/modules/auth/server/auth-guards": { requirePermission: async (permission) => { effects.guards.push(permission); if (denied) throw new Error("forbidden"); return { id: "manager" }; } },
    "@/modules/calendar/server/calendar-areas.repository": repository,
    "next/cache": { revalidatePath: (path) => effects.refreshes.push(path) },
    "next/server": { after: callback => effects.callbacks.push(callback) },
    "@/modules/calendar/server/google-calendar/google-calendar-sync.service": { syncUpcomingConfirmedEventsForUser: async userId => effects.syncs.push(userId) },
  });
  return { repository, actions, effects, role: (value) => { userRole = value; }, missingArea: () => { areaExists = false; }, deny: () => { denied = true; } };
}
const input = (overrides = {}) => ({ areaId: "area", userId: "user", canEdit: false, enabled: true, ...overrides });
const form = (level = "read") => {
  const data = new FormData();
  data.set("areaId", "area"); data.set("userId", "user"); data.set("accessLevel", level);
  return data;
};
async function rejectedWithoutEffects(ctx, call, message) {
  const before = plain(await ctx.repository.getCalendarAreaGrants("user"));
  const writes = ctx.effects.writes;
  const refreshes = [...ctx.effects.refreshes];
  const callbackCount = ctx.effects.callbacks.length;
  await assert.rejects(call, { message });
  assert.deepEqual(plain(await ctx.repository.getCalendarAreaGrants("user")), before);
  assert.equal(ctx.effects.writes, writes);
  assert.deepEqual(ctx.effects.refreshes, refreshes);
  assert.equal(ctx.effects.callbacks.length, callbackCount);
}

test("S2 repository lists metadata/grants and supports read, edit, downgrade and idempotent removal", async () => {
  const ctx = app();
  assert.deepEqual(plain(await ctx.repository.listCalendarAreaOptions()), [{ id: "area", name: "Académico", color: "#2563eb" }]);
  assert.deepEqual(plain(await ctx.repository.getCalendarAreaGrants("user")), []);
  for (const canEdit of [false, true, false]) {
    await ctx.repository.setCalendarAreaGrant(input({ canEdit }));
    assert.deepEqual(plain(await ctx.repository.getCalendarAreaGrants("user")), [{ areaId: "area", canEdit }]);
  }
  const areas = plain(await ctx.repository.listCalendarAreas());
  assert.deepEqual(areas[0].grants[0].user, { id: "user", name: "Docente", email: "teacher@example.invalid", role: "TEACHER" });
  await ctx.repository.setCalendarAreaGrant(input({ enabled: false }));
  await ctx.repository.setCalendarAreaGrant(input({ enabled: false }));
  assert.deepEqual(plain(await ctx.repository.getCalendarAreaGrants("user")), []);
  assert.equal(ctx.effects.writes, 4);
});

test("S2 only explicit internal roles can receive grants; invalid targets never mutate existing grants", async () => {
  for (const role of roles) {
    const ctx = app(); ctx.role(role);
    await ctx.repository.setCalendarAreaGrant(input());
    assert.deepEqual(plain(await ctx.repository.getCalendarAreaGrants("user")), [{ areaId: "area", canEdit: false }]);
  }
  for (const role of ["PARENT", "FUTURE_ROLE", null]) {
    for (const enabled of [true, false]) {
      const ctx = app();
      await ctx.repository.setCalendarAreaGrant(input());
      ctx.role(role);
      await rejectedWithoutEffects(ctx, () => ctx.repository.setCalendarAreaGrant(input({ enabled })), "calendar_area_user_not_internal");
    }
  }
  const ctx = app();
  await ctx.repository.setCalendarAreaGrant(input()); ctx.missingArea();
  await rejectedWithoutEffects(ctx, () => ctx.repository.setCalendarAreaGrant(input()), "calendar_area_not_found");
});

test("S2 action authenticates/authorizes every request before mutations and revalidates both admin paths", async () => {
  const ctx = app();
  for (const [level, expected] of [["read", false], ["edit", true], ["read", false], ["none", null]]) {
    await ctx.actions.setCalendarAreaGrantAction(form(level));
    assert.deepEqual(plain(await ctx.repository.getCalendarAreaGrants("user")), expected === null ? [] : [{ areaId: "area", canEdit: expected }]);
  }
  assert.deepEqual(ctx.effects.guards, Array(4).fill("calendar.permissions.manage"));
  assert.deepEqual(ctx.effects.refreshes, Array(4).fill(["/dashboard/calendar-permissions", "/dashboard/calendar"]).flat());
  assert.equal(ctx.effects.callbacks.length, 4);
  for (const callback of ctx.effects.callbacks) await callback();
  assert.deepEqual(ctx.effects.syncs, Array(4).fill("user"));
  ctx.deny();
  await rejectedWithoutEffects(ctx, () => ctx.actions.setCalendarAreaGrantAction(form("edit")), "forbidden");
  assert.equal(ctx.effects.guards.length, 5);
});

test("S2 invalid form values fail closed without persistence or revalidation", async () => {
  const ctx = app();
  await ctx.actions.setCalendarAreaGrantAction(form());
  for (const level of ["", "admin", "EDIT"]) {
    await rejectedWithoutEffects(ctx, () => ctx.actions.setCalendarAreaGrantAction(form(level)), "invalid_calendar_area_grant");
  }
  for (const key of ["areaId", "userId"]) {
    const data = form(); data.set(key, " ");
    await rejectedWithoutEffects(ctx, () => ctx.actions.setCalendarAreaGrantAction(data), "invalid_calendar_area_grant");
  }
});

test("S2 standalone view guards before loading internal users and exposes the access manager", () => {
  const view = read("src/modules/calendar/views/calendar-areas-admin-view.tsx");
  assert.match(view, /await requirePermission\("calendar\.permissions\.manage"\)/);
  assert.ok(view.indexOf("await requirePermission") < view.indexOf("prisma.user.findMany"));
  assert.match(view, /role: \{ in: calendarInternalRoles \}/);
  assert.match(view, /CalendarAreaAccessManager/);
  const component = read("src/modules/calendar/components/calendar-area-access-manager.tsx");
  assert.match(component, /action=\{setCalendarAreaGrantAction\}/);
  for (const value of ["none", "read", "edit"]) assert.ok(component.includes(`value="${value}"`));
  assert.match(component, /Consulta permite ver los eventos dirigidos al área/);
});
