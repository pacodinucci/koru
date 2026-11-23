import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const roles = ["ADMIN", "ADMIN_OPERATOR", "ADMIN_TEACHER", "SUPERADMIN", "TEACHER", "PSYCHOPEDAGOGY_TEACHER", "PARENT"];
const enumValues = Object.fromEntries([...roles, "ALL", "TEACHERS", "PARENTS", "PRIVATE"].map(value => [value, value]));

function fixture() {
  let grants = [];
  const cache = new Map();
  function load(path) {
    if (cache.has(path)) return cache.get(path).exports;
    const module = { exports: {} };
    cache.set(path, module);
    const source = readFileSync(new URL(`../../src/${path}.ts`, import.meta.url), "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(output, {
      Error, module, exports: module.exports,
      require(id) {
        if (id === "server-only") return {};
        if (id === "@prisma/client") return { UserRole: enumValues, CalendarAudienceType: enumValues };
        if (id === "@/lib/prisma") return { prisma: { calendarAreaGrant: { findMany: async () => grants } } };
        if (id.startsWith("@/")) return load(id.slice(2));
        throw new Error(`Unexpected dependency: ${id}`);
      },
    });
    return module.exports;
  }
  return { load, setGrants(value) { grants = value; } };
}

function matches(record, where) {
  return Object.entries(where).every(([key, value]) => {
    if (key === "OR") return value.some(clause => matches(record, clause));
    if (key === "AND") return value.every(clause => matches(record, clause));
    if (value && typeof value === "object") {
      if ("some" in value) return (record[key] ?? []).some(item => matches(item, value.some));
      if ("in" in value) return value.in.includes(record[key]);
      return matches(record[key] ?? {}, value);
    }
    return record[key] === value;
  });
}

test("S2/S3/S5: actual query and pure policy match independent expectations", async () => {
  const ctx = fixture();
  const pure = ctx.load("modules/calendar/lib/calendar-access");
  const query = ctx.load("modules/calendar/server/calendar-access");
  let checked = 0;
  for (const role of [...roles, null])
  for (const grantKind of ["none", "read", "edit", "other"])
  for (const recipient of [false, true])
  for (const scope of ["LEGACY", "INTERNAL", "AREAS", "PEOPLE"])
  for (const status of ["PUBLISHED", "DRAFT", "CANCELED"])
  for (const audienceType of ["ALL", "TEACHERS", "PARENTS", "PRIVATE"])
  for (const visibility of ["PUBLIC", "MEMBERS"]) {
    const grants = grantKind === "none" ? [] : [{ areaId: grantKind === "other" ? "operations" : "academic", canEdit: grantKind === "edit" }];
    ctx.setGrants(grants);
    const viewer = role ? { id: "viewer", role } : undefined;
    const internal = roles.slice(0, 6).includes(role);
    const event = {
      status, accessScope: scope, audienceType, visibility, responsibleAreaId: "academic",
      audienceAreas: [{ areaId: "academic" }], audiences: recipient ? [{ userId: "viewer" }] : [],
    };
    const legacyAudience = role
      ? audienceType === "ALL" || (audienceType === "PRIVATE" && recipient) || (
          ["ADMIN", "SUPERADMIN", "ADMIN_OPERATOR"].includes(role)
            ? ["TEACHERS", "PARENTS"].includes(audienceType)
            : ["TEACHER", "ADMIN_TEACHER"].includes(role)
              ? audienceType === "TEACHERS" : audienceType === "PARENTS"
        )
      : visibility === "PUBLIC" && audienceType === "ALL";
    const audienceAllowed = scope === "LEGACY" ? legacyAudience
      : scope === "PEOPLE" ? Boolean(role) && recipient
        : scope === "INTERNAL" ? internal : internal && ["read", "edit"].includes(grantKind);
    const expectedRead = status === "PUBLISHED" && audienceAllowed;
    const pureEvent = { ...event, audienceAreaIds: ["academic"], audienceUserIds: recipient ? ["viewer"] : [], createdById: "creator" };
    const pureViewer = viewer ? { ...viewer, canManageCalendar: false, areaGrants: grants } : null;
    const label = JSON.stringify({ role, grantKind, recipient, scope, status, audienceType, visibility });
    assert.equal(matches(event, await query.getCalendarReadWhere(viewer)), expectedRead, label);
    assert.equal(pure.canReadCalendarEvent(pureEvent, pureViewer), expectedRead, label);
    if (viewer) {
      for (const manager of [false, true]) {
        const expectedEdit = scope === "LEGACY" ? manager : internal && audienceAllowed && (manager || grantKind === "edit");
        assert.equal(matches(event, await query.getCalendarEditWhere({ ...viewer, permissionKeys: manager ? ["calendar.manage"] : [] })), expectedEdit, `${label}; manager=${manager}`);
        assert.equal(pure.canEditCalendarEvent(pureEvent, { ...pureViewer, canManageCalendar: manager }), expectedEdit, `${label}; manager=${manager}`);
      }
    }
    checked++;
  }
  assert.equal(checked, 6144);
});

test("S1/S4: filters union involved areas without duplicating events", () => {
  const ctx = fixture();
  const { filterCalendarEventsByAreas } = ctx.load("modules/calendar/lib/calendar-area-types");
  const events = [{ id: "shared", areaLinks: [{ areaId: "academic" }, { areaId: "operations" }] }, { id: "legacy" }];
  const ids = rows => Array.from(rows, row => row.id);
  assert.deepEqual(ids(filterCalendarEventsByAreas(events, [])), ["shared", "legacy"]);
  assert.deepEqual(ids(filterCalendarEventsByAreas(events, ["academic", "operations"])), ["shared"]);
  assert.deepEqual(ids(filterCalendarEventsByAreas(events, ["unknown"])), []);
});
