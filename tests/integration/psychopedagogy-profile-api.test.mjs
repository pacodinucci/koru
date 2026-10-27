import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = "modules/psychopedagogy/";
const handlerPath = `${root}server/psychopedagogy-profile.handlers.ts`;
const specialist = "PSYCHOPEDAGOGY_TEACHER";
const cache = "private, no-store";
const unavailable = { error: "Alumno no disponible." };
const invalid = { error: "Revisá la sección, la fecha y los campos requeridos (títulos de hasta 160 caracteres y textos de hasta 10.000 caracteres)." };
const context = (id = "student-1") => ({ params: Promise.resolve({ id }) });
const request = (payload) => new Request("http://localhost/api/teacher/students/student-1/psychopedagogy/profile", {
  method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" },
});
const learning = { section: "learning", description: " Aprende observando. " };
const accompaniment = { section: "accompaniment", date: "2026-02-28", kind: "INDIVIDUAL", title: " Encuentro ", body: " Texto libre\nSegunda línea " };
const intervention = { section: "intervention", date: "2028-02-29", title: " Plan ", observationAnalysis: " Observación ", strategyFeedback: " Estrategia ", workPlan: " Trabajo ", implementation: " Implementación ", evaluationResults: " Resultados " };
const instrument = { section: "instrument", date: "2026-01-01", name: " Entrevista ", body: " Texto " };
const empty = { learningStyleAndTemperament: "", observations: [], accompaniments: [], interventions: [], instruments: [] };

function load(path, mocks) {
  const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(output, {
    require: (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id === "zod") return require(id);
      throw new Error(`Unexpected dependency: ${id}`);
    }, module: compiled, exports: compiled.exports, Request, Response, Date, console: { error() {} },
  });
  return compiled.exports;
}

function setup({ role = specialist, permissionKeys = [specialist, "SUPERADMIN"].includes(role) ? ["dashboard.access", "psychopedagogy.view", "psychopedagogy.manage"] : ["dashboard.access"], activeProfile = true, exists = true, history = false, interventionHistory = false, instrumentHistory = false, failure = null } = {}) {
  const state = { learning: [], observations: [], accompaniments: [], interventions: [], instruments: [], nextId: 1, writes: 0 };
  const calls = [];
  if (history) state.observations.push(
    { id: "old", studentId: "student-1", teacherId: "inactive-author", entryDate: new Date("2025-01-01Z"), title: "Historial", body: "Original", createdAt: new Date("2025-01-01Z") },
    { id: "other", studentId: "student-2", teacherId: "other-author", entryDate: new Date("2026-01-01Z"), title: "Privado", body: "Otro alumno", createdAt: new Date("2026-01-01Z") },
  );
  if (interventionHistory) state.interventions.push(
    { ...intervention, id: "legacy", studentId: "student-1", teacherId: "inactive-author", entryDate: new Date("2025-01-01Z"), createdAt: new Date("2025-01-01Z") },
    { ...intervention, id: "private", studentId: "student-2", teacherId: "other-author", entryDate: new Date("2025-01-01Z"), createdAt: new Date("2025-01-01Z") },
  );
  if (instrumentHistory) state.instruments.push(
    { id: "legacy-missing", studentId: "student-1", teacherId: "inactive-author", entryDate: new Date("2025-01-01Z"), name: "Cuestionario histórico", body: "Original", createdAt: new Date("2025-01-01Z") },
    { id: "legacy-null", studentId: "student-1", teacherId: "inactive-author", kind: null, entryDate: new Date("2024-01-01Z"), name: "Test histórico", body: "Sin clasificar", createdAt: new Date("2024-01-01Z") },
    { id: "private-instrument", studentId: "student-2", teacherId: "other-author", kind: "OTHER", entryDate: new Date("2025-01-01Z"), name: "Privado", body: "Otro alumno", createdAt: new Date("2025-01-01Z") },
  );
  const project = (row, select) => {
    assert.ok(select, "every persistence operation must use a minimal select");
    assert.ok(Object.values(select).every((value) => value === true));
    return Object.fromEntries(Object.keys(select).filter((key) => select[key]).map((key) => [key, row[key]]));
  };
  const prisma = {
    student: { findUnique: async (args) => {
      calls.push(["student", args]);
      assert.equal(JSON.stringify(args.select), '{"id":true}');
      return exists ? { id: args.where.id } : null;
    } },
    teacherProfile: { findFirst: async (args) => {
      calls.push(["author", args]);
      assert.equal(JSON.stringify(args.where), '{"userId":"user-1","isActive":true}');
      assert.equal(JSON.stringify(args.select), '{"id":true}');
      return activeProfile ? { id: "teacher-1" } : null;
    } },
  };
  for (const [model, bucket] of Object.entries({ psychopedagogyLearningProfile: "learning", psychopedagogyEntry: "observations", psychopedagogyAccompaniment: "accompaniments", psychopedagogyIntervention: "interventions", psychopedagogyInstrument: "instruments" })) {
    prisma[model] = {
      findUnique: async (args) => {
        calls.push([bucket, args]);
        if (failure) throw failure;
        assert.deepEqual(Object.keys(args.where), ["studentId"]);
        assert.equal(JSON.stringify(args.select), '{"description":true}');
        const row = state[bucket].find((row) => row.studentId === args.where.studentId);
        return row ? project(row, args.select) : null;
      },
      findMany: async (args) => {
        calls.push([bucket, args]);
        assert.deepEqual(Object.keys(args.where), ["studentId"]);
        assert.equal(JSON.stringify(args.orderBy), '[{"entryDate":"desc"},{"createdAt":"desc"},{"id":"desc"}]');
        assert.ok(!Object.keys(args.select).some((key) => ["studentId", "teacherId", "createdAt", "student", "teacher"].includes(key)));
        return state[bucket].filter((row) => row.studentId === args.where.studentId)
          .sort((a, b) => b.entryDate - a.entryDate || b.createdAt - a.createdAt || b.id.localeCompare(a.id))
          .map((row) => project(row, args.select));
      },
      create: async ({ data, select }) => {
        assert.notEqual(bucket, "observations", "profile must never copy observations");
        const row = { ...data, id: `new-${state.nextId++}`, createdAt: new Date("2026-03-01Z") };
        state[bucket].push(row); state.writes++;
        return project(row, select);
      },
      upsert: async ({ where, create, update, select }) => {
        assert.equal(bucket, "learning");
        assert.equal(where.studentId, create.studentId);
        let row = state.learning.find((row) => row.studentId === where.studentId);
        if (row) Object.assign(row, update);
        else { row = { ...create, id: `new-${state.nextId++}` }; state.learning.push(row); }
        state.writes++;
        return project(row, select);
      },
    };
  }
  const mocks = {
    "server-only": {},
    "next/server": { NextResponse: { json: (data, init) => Response.json(data, init) } },
    "@/lib/prisma": { prisma },
    "@/modules/auth/server/auth-guards": { getAuthenticatedUser: async () => role ? { id: "user-1", role, permissionKeys } : null },
  };
  // Load real validation/repositories lazily through the public handler boundary.
  for (const [id, path] of Object.entries({
    "@/modules/psychopedagogy/schemas/psychopedagogy-profile.schema": `${root}schemas/psychopedagogy-profile.schema.ts`,
    "@/modules/psychopedagogy/server/psychopedagogy.repository": `${root}server/psychopedagogy.repository.ts`,
    "@/modules/psychopedagogy/server/psychopedagogy-profile.repository": `${root}server/psychopedagogy-profile.repository.ts`,
  })) Object.defineProperty(mocks, id, { get: () => load(path, mocks), enumerable: true });
  return { ...load(handlerPath, mocks), state, calls };
}
async function expectResponse(response, status, body) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get("cache-control"), cache);
  assert.deepEqual(await response.json(), body);
}
async function read(api, id) {
  const response = await api.GET(new Request("http://localhost"), context(id));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), cache);
  return (await response.json()).profile;
}

test("learning report server actions roundtrip through the real authenticated handlers without an HTTP route", async () => {
  const api = setup({ role: "SUPERADMIN", activeProfile: false, history: true });
  const actions = load(`${root}server/learning-report.actions.ts`, {
    "@/modules/psychopedagogy/server/psychopedagogy-profile.handlers": api,
  });
  const initial = await actions.readLearningReportAction("student-1");
  assert.equal(initial.ok, true);
  assert.equal(initial.description, "");
  for (const description of [" Visual ", "Aprende experimentando"]) {
    assert.equal((await actions.saveLearningReportAction("student-1", description)).ok, true);
    const result = await actions.readLearningReportAction("student-1");
    assert.equal(result.ok, true);
    assert.equal(result.description, description.trim());
  }
  assert.equal(api.state.learning.length, 1);
  assert.equal(api.state.learning[0].updatedByUserId, "user-1");
  assert.equal((await actions.readLearningReportAction("student-2")).description, "");
  const before = JSON.stringify(api.state);
  const rejected = await actions.saveLearningReportAction("student-1", " ");
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error, invalid.error);
  assert.equal(JSON.stringify(api.state), before);
  for (const role of [null, "TEACHER", "PARENT"]) {
    const deniedApi = setup({ role });
    const deniedActions = load(`${root}server/learning-report.actions.ts`, {
      "@/modules/psychopedagogy/server/psychopedagogy-profile.handlers": deniedApi,
    });
    assert.equal((await deniedActions.readLearningReportAction("student-1")).error, unavailable.error);
    assert.equal((await deniedActions.saveLearningReportAction("student-1", "Texto")).error, unavailable.error);
    assert.equal(deniedApi.state.writes, 0);
  }
});

test("empty GET has exact contract and never initializes storage for either admitted role", async () => {
  for (const role of [specialist, "SUPERADMIN"]) {
    const api = setup({ role, activeProfile: false });
    const before = JSON.stringify(api.state);
    assert.deepEqual(await read(api), empty);
    assert.deepEqual(await read(api), empty);
    assert.equal(JSON.stringify(api.state), before);
    assert.ok(!api.calls.some(([name]) => name === "author"));
  }
});

test("GET includes unchanged historical observations from inactive authors, scoped to student and separate from classroom reports", async () => {
  for (const role of [specialist, "SUPERADMIN"]) {
    const api = setup({ role, history: true });
    const before = JSON.stringify(api.state);
    assert.deepEqual(await read(api), { ...empty, observations: [{ id: "old", entryDate: "2025-01-01T00:00:00.000Z", title: "Historial", body: "Original" }] });
    assert.deepEqual(await read(api, "student-2"), { ...empty, observations: [{ id: "other", entryDate: "2026-01-01T00:00:00.000Z", title: "Privado", body: "Otro alumno" }] });
    assert.equal(JSON.stringify(api.state), before);
  }
});

test("learning upserts while all dated sections append and roundtrip with server authorship", async () => {
  const api = setup({ history: true });
  const observations = JSON.stringify(api.state.observations);
  for (const payload of [learning, { ...learning, description: " Actualizado " }, accompaniment, { ...accompaniment, kind: "FAMILY", date: "2028-02-29" }, intervention, instrument]) {
    await expectResponse(await api.POST(request(payload), context()), 201, { ok: true });
  }
  assert.deepEqual(await read(api), {
    ...empty, learningStyleAndTemperament: "Actualizado",
    observations: [{ id: "old", entryDate: "2025-01-01T00:00:00.000Z", title: "Historial", body: "Original" }],
    accompaniments: [
      { id: "new-3", entryDate: "2028-02-29T00:00:00.000Z", kind: "FAMILY", title: "Encuentro", body: "Texto libre\nSegunda línea" },
      { id: "new-2", entryDate: "2026-02-28T00:00:00.000Z", kind: "INDIVIDUAL", title: "Encuentro", body: "Texto libre\nSegunda línea" },
    ],
    interventions: [{ id: "new-4", entryDate: "2028-02-29T00:00:00.000Z", title: "Plan", observationAnalysis: "Observación", strategyFeedback: "Estrategia", workPlan: "Trabajo", implementation: "Implementación", evaluationResults: "Resultados" }],
    instruments: [{ id: "new-5", entryDate: "2026-01-01T00:00:00.000Z", kind: null, name: "Entrevista", body: "Texto" }],
  });
  assert.equal(api.state.learning.length, 1);
  assert.equal(api.state.learning[0].updatedById, "teacher-1");
  for (const bucket of ["accompaniments", "interventions", "instruments"]) {
    assert.ok(api.state[bucket].every((row) => row.studentId === "student-1" && row.teacherId === "teacher-1"));
  }
  for (const payload of [learning, accompaniment, intervention, instrument]) {
    await expectResponse(await api.POST(request(payload), context("student-2")), 201, { ok: true });
  }
  const other = await read(api, "student-2");
  assert.equal(other.learningStyleAndTemperament, "Aprende observando.");
  for (const bucket of ["accompaniments", "interventions", "instruments"]) assert.equal(other[bucket].length, 1);
  assert.equal((await read(api)).accompaniments.length, 2);
  assert.equal(JSON.stringify(api.state.observations), observations);
});

test("denied roles and disabled dashboard permission are rejected before any profile or student access", async () => {
  for (const options of [
    ...[null, "TEACHER", "ADMIN_TEACHER", "ADMIN", "ADMIN_OPERATOR", "PARENT"].map((role) => ({ role })),
    { permissionKeys: [] },
  ]) {
    const api = setup(options);
    const before = JSON.stringify(api.state);
    await expectResponse(await api.GET(new Request("http://localhost"), context()), 404, unavailable);
    await expectResponse(await api.POST(request(learning), context()), 404, unavailable);
    assert.deepEqual(api.calls, []);
    assert.equal(JSON.stringify(api.state), before);
  }
});

test("Superadmin can upsert learning without a teacher profile and with authenticated user authorship", async () => {
  const api = setup({ role: "SUPERADMIN", activeProfile: false });
  for (const description of ["Visual", "Aprende haciendo"]) {
    await expectResponse(await api.POST(request({ section: "learning", description }), context()), 201, { ok: true });
    assert.equal((await read(api)).learningStyleAndTemperament, description);
  }
  assert.equal(api.state.learning.length, 1);
  assert.equal(api.state.learning[0].updatedByUserId, "user-1");
  assert.equal(api.state.learning[0].updatedById, null);
  assert.ok(!api.calls.some(([name]) => name === "author"));
});

test("Superadmin appends both accompaniment kinds with session authorship and no teacher profile", async () => {
  const api = setup({ role: "SUPERADMIN", activeProfile: false });
  for (const kind of ["INDIVIDUAL", "FAMILY"]) {
    await expectResponse(await api.POST(request({ ...accompaniment, kind }), context()), 201, { ok: true });
    const profile = await read(api);
    assert.ok(profile.accompaniments.some((entry) => entry.kind === kind && entry.title === "Encuentro"));
  }
  assert.equal(api.state.accompaniments.length, 2);
  for (const row of api.state.accompaniments) {
    assert.equal(row.authorUserId, "user-1"); assert.equal(row.teacherId, null); assert.equal(row.studentId, "student-1");
  }
  assert.ok(!api.calls.some(([name]) => name === "author"));
});

test("Superadmin interventions append complete reports with session authorship and preserve specialist history and student isolation", async () => {
  for (const activeProfile of [true, false]) {
    const api = setup({ role: "SUPERADMIN", activeProfile, interventionHistory: true });
    const initial = await read(api);
    const otherInitial = await read(api, "student-2");
    const legacy = JSON.stringify(api.state.interventions);
    const report = (id, title = "Plan") => ({
      id, entryDate: "2028-02-29T00:00:00.000Z", title,
      observationAnalysis: "Observación", strategyFeedback: "Estrategia", workPlan: "Trabajo",
      implementation: "Implementación", evaluationResults: "Resultados",
    });
    for (const title of ["Plan", "Segundo plan"]) {
      await expectResponse(await api.POST(request({ ...intervention, title }), context()), 201, { ok: true });
    }
    assert.deepEqual(await read(api), { ...initial, interventions: [report("new-2", "Segundo plan"), report("new-1"), ...initial.interventions] });
    assert.deepEqual(await read(api, "student-2"), otherInitial);
    await expectResponse(await api.POST(request(intervention), context("student-2")), 201, { ok: true });
    assert.deepEqual(await read(api, "student-2"), { ...otherInitial, interventions: [report("new-3"), ...otherInitial.interventions] });
    assert.deepEqual((await read(api)).interventions, [report("new-2", "Segundo plan"), report("new-1"), ...initial.interventions]);
    assert.equal(JSON.stringify(api.state.interventions.slice(0, 2)), legacy);
    for (const row of api.state.interventions.slice(2)) {
      assert.equal(row.authorUserId, "user-1");
      assert.equal(row.teacherId, null);
    }
    assert.equal(api.state.writes, 3);
    assert.ok(!api.calls.some(([name]) => name === "author"));
  }
});

test("Superadmin intervention validation rejects every required field, limit overflow and invalid date without changing reports or counters", async () => {
  const api = setup({ role: "SUPERADMIN", activeProfile: false, interventionHistory: true });
  const initial = await read(api);
  const before = JSON.stringify(api.state);
  const payloads = [];
  for (const field of ["title", "observationAnalysis", "strategyFeedback", "workPlan", "implementation", "evaluationResults"]) {
    const missing = { ...intervention }; delete missing[field]; payloads.push(missing);
    for (const value of [null, 42, {}, [], "", " \n ", "x".repeat(field === "title" ? 161 : 10001)]) payloads.push({ ...intervention, [field]: value });
  }
  const missingDate = { ...intervention }; delete missingDate.date; payloads.push(missingDate);
  for (const date of ["2025-02-29", "1900-02-29", "2026-02-30", "2026-04-31", "2026-00-01", "2026-13-01", "2026-01-00", "2026-2-1", "2026-01-01T00:00:00Z", " 2026-01-01", "0000-01-01", "", null, 20260101]) payloads.push({ ...intervention, date });
  for (const payload of payloads) {
    await expectResponse(await api.POST(request(payload), context()), 400, invalid);
    assert.equal(JSON.stringify(api.state), before);
    assert.deepEqual(await read(api), initial);
  }
  for (const date of ["0001-01-01", "0099-12-31", "2000-02-29", "2028-02-29", "9999-12-31"]) {
    const payload = { ...intervention, date, title: "x".repeat(160) };
    for (const field of ["observationAnalysis", "strategyFeedback", "workPlan", "implementation", "evaluationResults"]) payload[field] = "<b>" + "x".repeat(9993) + "</b>";
    await expectResponse(await api.POST(request(payload), context()), 201, { ok: true });
    const saved = (await read(api)).interventions.find((entry) => entry.entryDate === `${date}T00:00:00.000Z`);
    const { section, date: _date, ...fields } = payload;
    assert.deepEqual(saved, { id: `new-${api.state.writes}`, entryDate: `${date}T00:00:00.000Z`, ...fields });
  }
});

test("intervention POST preserves role, dashboard, active specialist author and missing-student denials", async () => {
  for (const options of [
    ...[null, "TEACHER", "ADMIN_TEACHER", "ADMIN", "ADMIN_OPERATOR", "PARENT"].map((role) => ({ role })),
    { permissionKeys: [] }, { activeProfile: false }, { exists: false }, { role: "SUPERADMIN", exists: false },
  ]) {
    const api = setup({ ...options, interventionHistory: true });
    const before = JSON.stringify(api.state);
    await expectResponse(await api.POST(request(intervention), context()), 404, unavailable);
    assert.equal(JSON.stringify(api.state), before);
    assert.ok(api.calls.every(([name]) => ["student", "author"].includes(name)));
  }
});

test("intervention migration adds nullable authenticated authorship without rewriting existing records", () => {
  const schema = readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");
  const model = schema.match(/model PsychopedagogyIntervention \{([\s\S]*?)\n\}/)?.[1];
  assert.match(model, /teacherId\s+String\?/);
  assert.match(model, /teacher\s+TeacherProfile\?/);
  assert.match(model, /authorUserId\s+String\?/);
  assert.match(model, /authorUser\s+User\?\s+@relation\("InterventionUserAuthor", fields: \[authorUserId\], references: \[id\], onDelete: Restrict\)/);
  assert.match(model, /@@index\(\[authorUserId\]\)/);
  assert.match(schema, /authoredPsychopedagogyInterventions\s+PsychopedagogyIntervention\[\]\s+@relation\("InterventionUserAuthor"\)/);
  const sql = readFileSync(new URL("../../prisma/migrations/20261024150000_allow_superadmin_interventions/migration.sql", import.meta.url), "utf8");
  assert.match(sql, /BEGIN;/);
  assert.match(sql, /ALTER TABLE "PsychopedagogyIntervention"/);
  assert.match(sql, /ALTER COLUMN "teacherId" DROP NOT NULL/);
  assert.match(sql, /ADD COLUMN "authorUserId" TEXT/);
  assert.match(sql, /CHECK \("teacherId" IS NOT NULL OR "authorUserId" IS NOT NULL\)/);
  assert.match(sql, /CREATE INDEX "PsychopedagogyIntervention_authorUserId_idx" ON "PsychopedagogyIntervention"\("authorUserId"\)/);
  assert.match(sql, /FOREIGN KEY \("authorUserId"\) REFERENCES "user"\("id"\) ON DELETE RESTRICT ON UPDATE CASCADE/);
  assert.match(sql, /COMMIT;/);
  assert.doesNotMatch(sql, /\b(?:UPDATE\s+"|DELETE\s+FROM|TRUNCATE|DROP\s+(?:TABLE|COLUMN)|INSERT\s+INTO)\b/i);
});

test("Superadmin spoofed authorship cannot change data or counters in any section", async () => {
  for (const activeProfile of [true, false]) {
    const api = setup({ role: "SUPERADMIN", activeProfile });
    const before = JSON.stringify(api.state);
    for (const payload of [learning, accompaniment, intervention, instrument]) for (const spoof of [{ authorUserId: "other" }, { teacherId: "other" }, { studentId: "other" }, { updatedByUserId: "other" }, { updatedById: "other" }, { role: specialist }, { readOnly: false }]) {
      await expectResponse(await api.POST(request({ ...payload, ...spoof }), context()), 400, invalid);
      assert.equal(JSON.stringify(api.state), before);
    }
    assert.ok(!api.calls.some(([name]) => name === "author"));
  }
});

test("instrument kinds have exact runtime labels and backwards-compatible DTO/payload contracts", () => {
  const contract = load(`${root}lib/profile-contract.ts`, {});
  assert.deepEqual(JSON.parse(JSON.stringify(contract.instrumentKindLabels)), {
    QUESTIONNAIRE: "Cuestionario", ASSESSMENT: "Prueba", INTERVIEW: "Entrevista", TEST: "Test", OTHER: "Otro",
  });
  const source = readFileSync(new URL(`../../src/${root}lib/profile-contract.ts`, import.meta.url), "utf8");
  assert.match(source, /export type InstrumentKind\s*=/);
  assert.match(source, /export type InstrumentDTO\s*=[\s\S]*?kind\?: InstrumentKind \| null/);
  assert.match(source, /section: "instrument";[^}]*kind\?: InstrumentKind/);
});

test("instrument creation persists and roundtrips all five kinds for specialist and Superadmin without changing earlier sections or history", async () => {
  for (const options of [{}, { role: "SUPERADMIN", activeProfile: false }, { role: "SUPERADMIN", activeProfile: true }]) {
    const api = setup({ ...options, history: true, interventionHistory: true, instrumentHistory: true });
    const initial = await read(api);
    const other = await read(api, "student-2");
    const legacy = JSON.stringify(api.state.instruments);
    for (const [index, kind] of ["QUESTIONNAIRE", "ASSESSMENT", "INTERVIEW", "TEST", "OTHER"].entries()) {
      await expectResponse(await api.POST(request({ ...instrument, kind }), context()), 201, { ok: true });
      const row = api.state.instruments.at(-1);
      assert.equal(row.kind, kind);
      assert.equal(row.teacherId, options.role ? null : "teacher-1");
      assert.equal(row.authorUserId ?? null, options.role ? "user-1" : null);
      assert.equal(row.studentId, "student-1");
      assert.deepEqual((await read(api)).instruments[0], {
        id: `new-${index + 1}`, entryDate: "2026-01-01T00:00:00.000Z", kind, name: "Entrevista", body: "Texto",
      });
      assert.equal(api.state.writes, index + 1);
      assert.equal(api.state.nextId, index + 2);
    }
    const profile = await read(api);
    assert.deepEqual(profile, { ...initial, instruments: [
      ...["OTHER", "TEST", "INTERVIEW", "ASSESSMENT", "QUESTIONNAIRE"].map((kind, index) => ({
        id: `new-${5 - index}`, entryDate: "2026-01-01T00:00:00.000Z", kind, name: "Entrevista", body: "Texto",
      })), ...initial.instruments,
    ] });
    assert.deepEqual(await read(api, "student-2"), other);
    await expectResponse(await api.POST(request({ ...instrument, kind: "TEST" }), context("student-2")), 201, { ok: true });
    assert.deepEqual(await read(api, "student-2"), { ...other, instruments: [
      { id: "new-6", entryDate: "2026-01-01T00:00:00.000Z", kind: "TEST", name: "Entrevista", body: "Texto" }, ...other.instruments,
    ] });
    assert.deepEqual(await read(api), profile);
    assert.equal(JSON.stringify(api.state.instruments.slice(0, 3)), legacy);
    if (options.role) assert.ok(!api.calls.some(([name]) => name === "author"));
  }
});

test("instrument legacy omitted kind writes remain compatible and old missing/null kinds project null without reclassification or mutation", async () => {
  for (const role of [specialist, "SUPERADMIN"]) {
    const api = setup({ role, instrumentHistory: true });
    const before = JSON.stringify(api.state);
    const expected = [
      { id: "legacy-missing", entryDate: "2025-01-01T00:00:00.000Z", kind: null, name: "Cuestionario histórico", body: "Original" },
      { id: "legacy-null", entryDate: "2024-01-01T00:00:00.000Z", kind: null, name: "Test histórico", body: "Sin clasificar" },
    ];
    assert.deepEqual(await read(api), { ...empty, instruments: expected });
    assert.deepEqual(await read(api), { ...empty, instruments: expected });
    assert.equal(JSON.stringify(api.state), before);
    await expectResponse(await api.POST(request(instrument), context()), 201, { ok: true });
    assert.equal(api.state.instruments.at(-1).kind, null);
    assert.equal(api.state.writes, 1);
    assert.equal(api.state.nextId, 2);
    assert.deepEqual(await read(api), { ...empty, instruments: [
      { id: "new-1", entryDate: "2026-01-01T00:00:00.000Z", kind: null, name: "Entrevista", body: "Texto" }, ...expected,
    ] });
  }
});

test("instrument invalid kinds and spoofed ownership reject with exact errors and no stored data or counter changes", async () => {
  for (const role of [specialist, "SUPERADMIN"]) {
    const api = setup({ role, history: true, interventionHistory: true, instrumentHistory: true });
    const initial = await read(api);
    const before = JSON.stringify(api.state);
    for (const payload of [
      ...[null, "", " ", "questionnaire", "FAMILY", "UNKNOWN", 0, {}, [], " TEST "].map((kind) => ({ ...instrument, kind })),
      ...["studentId", "teacherId", "authorUserId", "authorId", "updatedById", "updatedByUserId", "role", "readOnly"].map((field) => ({ ...instrument, kind: "TEST", [field]: "spoofed" })),
    ]) {
      await expectResponse(await api.POST(request(payload), context()), 400, invalid);
      assert.equal(JSON.stringify(api.state), before);
      assert.deepEqual(await read(api), initial);
    }
  }
});

test("instrument GET/POST retain role, dashboard, active specialist author and missing-student denials without mutation", async () => {
  for (const options of [
    ...[null, "TEACHER", "ADMIN_TEACHER", "ADMIN", "ADMIN_OPERATOR", "PARENT"].map((role) => ({ role })),
    { permissionKeys: [] }, { activeProfile: false }, { exists: false }, { role: "SUPERADMIN", exists: false },
  ]) {
    const api = setup({ ...options, instrumentHistory: true });
    const before = JSON.stringify(api.state);
    await expectResponse(await api.POST(request({ ...instrument, kind: "TEST" }), context()), 404, unavailable);
    assert.equal(JSON.stringify(api.state), before);
    assert.ok(api.calls.every(([name]) => ["student", "author"].includes(name)));
    if (options.activeProfile === false) {
      assert.equal((await read(api)).instruments.length, 2);
    } else {
      await expectResponse(await api.GET(new Request("http://localhost"), context()), 404, unavailable);
    }
    assert.equal(JSON.stringify(api.state), before);
  }
});

test("instrument migration adds nullable classification and authenticated authorship without rewriting existing records", () => {
  const schema = readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");
  const model = schema.match(/model PsychopedagogyInstrument \{([\s\S]*?)\n\}/)?.[1];
  assert.match(schema, /enum PsychopedagogyInstrumentKind\s*\{\s*QUESTIONNAIRE\s+ASSESSMENT\s+INTERVIEW\s+TEST\s+OTHER\s*\}/);
  assert.match(model, /kind\s+PsychopedagogyInstrumentKind\?/);
  assert.doesNotMatch(model, /kind[^\n]*@default/);
  assert.match(model, /teacherId\s+String\?/);
  assert.match(model, /teacher\s+TeacherProfile\?/);
  assert.match(model, /authorUserId\s+String\?/);
  assert.match(model, /authorUser\s+User\?\s+@relation\("InstrumentUserAuthor", fields: \[authorUserId\], references: \[id\], onDelete: Restrict\)/);
  assert.match(model, /@@index\(\[authorUserId\]\)/);
  assert.match(schema, /authoredPsychopedagogyInstruments\s+PsychopedagogyInstrument\[\]\s+@relation\("InstrumentUserAuthor"\)/);
  const sql = readFileSync(new URL("../../prisma/migrations/20261024160000_classify_psychopedagogy_instruments/migration.sql", import.meta.url), "utf8");
  assert.match(sql, /BEGIN;/);
  assert.match(sql, /CREATE TYPE "PsychopedagogyInstrumentKind" AS ENUM \('QUESTIONNAIRE', 'ASSESSMENT', 'INTERVIEW', 'TEST', 'OTHER'\)/);
  assert.match(sql, /ALTER TABLE "PsychopedagogyInstrument"/);
  assert.match(sql, /ADD COLUMN "kind" "PsychopedagogyInstrumentKind"/);
  assert.match(sql, /ALTER COLUMN "teacherId" DROP NOT NULL/);
  assert.match(sql, /ADD COLUMN "authorUserId" TEXT/);
  assert.match(sql, /CHECK \("teacherId" IS NOT NULL OR "authorUserId" IS NOT NULL\)/);
  assert.match(sql, /CREATE INDEX "PsychopedagogyInstrument_authorUserId_idx" ON "PsychopedagogyInstrument"\("authorUserId"\)/);
  assert.match(sql, /FOREIGN KEY \("authorUserId"\) REFERENCES "user"\("id"\) ON DELETE RESTRICT ON UPDATE CASCADE/);
  assert.match(sql, /COMMIT;/);
  assert.doesNotMatch(sql, /\b(?:UPDATE\s+"|DELETE\s+FROM|TRUNCATE|DROP\s+(?:TABLE|COLUMN)|INSERT\s+INTO|DEFAULT)\b/i);
  assert.deepEqual([...sql.matchAll(/ALTER TABLE "([^"]+)"/g)].map((match) => match[1]), ["PsychopedagogyInstrument", "PsychopedagogyInstrument"]);
});

test("missing student and inactive authorship cannot read profile data or mutate any storage", async () => {
  for (const role of [specialist, "SUPERADMIN"]) {
    const api = setup({ role, exists: false });
    const before = JSON.stringify(api.state);
    await expectResponse(await api.GET(new Request("http://localhost"), context()), 404, unavailable);
    await expectResponse(await api.POST(request(learning), context()), 404, unavailable);
    assert.ok(api.calls.every(([name]) => name === "student"));
    assert.equal(JSON.stringify(api.state), before);
  }
  const api = setup({ activeProfile: false });
  const before = JSON.stringify(api.state);
  await expectResponse(await api.POST(request(learning), context()), 404, unavailable);
  assert.ok(api.calls.some(([name]) => name === "author"));
  assert.ok(api.calls.every(([name]) => ["student", "author"].includes(name)));
  assert.equal(JSON.stringify(api.state), before);
});

test("strict discriminants, kinds, fields, malformed JSON and spoofed ownership reject without changing data or counters", async () => {
  const payloads = [null, [], {}, 5, "learning", { section: "followups" }, { ...learning, section: "observations" },
    { ...learning, section: "Learning" }, { ...accompaniment, kind: "individual" }, { ...accompaniment, kind: "OTHER" },
    { ...intervention, section: "instrument" }, { ...instrument, section: "intervention" }];
  for (const valid of [learning, accompaniment, intervention, instrument]) {
    for (const [key, value] of Object.entries(valid)) {
      if (key === "section" || key === "kind" || key === "date") continue;
      for (const bad of [null, 123, {}, [], "", " \n ", "x".repeat(["title", "name"].includes(key) ? 161 : 10001)]) payloads.push({ ...valid, [key]: bad });
      const missing = { ...valid }; delete missing[key]; payloads.push(missing);
    }
    for (const spoof of [{ studentId: "student-2" }, { teacherId: "other" }, { authorId: "other" }, { updatedById: "other" }, { kind: "FAMILY", ...(valid.section === "accompaniment" ? { description: "wrong" } : {}) }]) {
      payloads.push({ ...valid, ...spoof });
    }
  }
  const api = setup({ history: true });
  await expectResponse(await api.POST(request(learning), context()), 201, { ok: true });
  const before = JSON.stringify(api.state);
  for (const input of [...payloads.map(request), new Request("http://localhost", { method: "POST", body: "{" })]) {
    await expectResponse(await api.POST(input, context()), 400, invalid);
    assert.equal(JSON.stringify(api.state), before);
  }
  assert.ok(api.calls.every(([name]) => ["student", "author"].includes(name)));
});

test("real date validation rejects non-leap days, rollover, timestamps and malformed strings without mutations", async () => {
  const api = setup();
  const before = JSON.stringify(api.state);
  for (const payload of [accompaniment, intervention, instrument]) {
    for (const date of ["2026-02-30", "2025-02-29", "1900-02-29", "2026-04-31", "2026-00-01", "2026-13-01", "2026-01-00", "2026-2-1", "2026-01-01T00:00:00Z", " 2026-01-01", "0000-01-01", "", null, 20260101]) {
      await expectResponse(await api.POST(request({ ...payload, date }), context()), 400, invalid);
      assert.equal(JSON.stringify(api.state), before);
    }
    const missing = { ...payload }; delete missing.date;
    await expectResponse(await api.POST(request(missing), context()), 400, invalid);
  }
  assert.equal(JSON.stringify(api.state), before);
});

test("all sections preserve exact string limits, plain text, leap centuries and four-digit date boundaries", async () => {
  const api = setup();
  for (const original of [learning, accompaniment, intervention, instrument]) {
    const payload = { ...original };
    for (const key of Object.keys(payload)) {
      if (!["section", "kind", "date"].includes(key)) payload[key] = ["title", "name"].includes(key) ? "x".repeat(160) : "<b>" + "x".repeat(9993) + "</b>";
    }
    for (const date of ["0001-01-01", "0099-12-31", "2000-02-29", "2028-02-29", "9999-12-31"]) {
      await expectResponse(await api.POST(request(original.section === "learning" ? payload : { ...payload, date }), context()), 201, { ok: true });
    }
  }
  const profile = await read(api);
  assert.equal(profile.learningStyleAndTemperament.length, 10000);
  for (const key of ["accompaniments", "interventions", "instruments"]) {
    assert.equal(profile[key].length, 5);
    assert.equal(profile[key][0].entryDate, "9999-12-31T00:00:00.000Z");
    assert.equal(profile[key][4].entryDate, "0001-01-01T00:00:00.000Z");
    for (const [field, value] of Object.entries(profile[key][0])) {
      if (["id", "entryDate", "kind"].includes(field)) continue;
      assert.equal(value.length, ["title", "name"].includes(field) ? 160 : 10000);
      if (!["title", "name"].includes(field)) assert.ok(value.startsWith("<b>"));
    }
  }
});

test("database failures return safe non-cacheable errors without leaking persistence details", async () => {
  for (const code of ["P2021", "P2022", "OTHER"]) {
    const api = setup({ failure: { code, message: "private database detail" } });
    const before = JSON.stringify(api.state);
    await expectResponse(await api.GET(new Request("http://localhost"), context()), code === "OTHER" ? 500 : 503, {
      error: code === "OTHER" ? "No pudimos acceder al perfil psicopedagógico. Intentá nuevamente." : "El perfil psicopedagógico todavía no está habilitado. Falta actualizar la base de datos.",
    });
    assert.equal(JSON.stringify(api.state), before);
  }
});
