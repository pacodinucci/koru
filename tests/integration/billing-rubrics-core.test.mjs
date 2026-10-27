import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { Prisma } from "@prisma/client";

const require = createRequire(import.meta.url);
const source = path => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
function load(path, mocks, globals = {}) {
  const compiled = ts.transpileModule(source(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, Date, process, ...globals, require: name => name in mocks ? mocks[name] : require(name) });
  return exports;
}
const now = new Date("2026-10-07T12:00:00Z");
const validators = require("../../src/modules/families/lib/billing-rubrics.ts");
const period = { getBillingPeriod: () => new Date("2026-10-01T00:00:00Z") };
const installments = require("../../src/modules/families/server/eventual-installments.core.ts");
async function setup({ inactive = false, foreign = false, failCharges = false, transactionMethodVisible = false } = {}) {
  const rubrics = [{ id: "rubric", name: "Materiales", amount: new Prisma.Decimal("120000"), isActive: !inactive }];
  const schedules = [], entries = [], events = [];
  let next = 0;
  let generationFailure = failCharges, conflict = null, afterScan = null;
  const copy = value => structuredClone(value);
  const snapshot = () => JSON.stringify({ rubrics, schedules, entries, next });
  const db = {
    billingRubric: {
      create: async ({ data }) => { events.push("catalog-create"); const row = { id: `rubric${++next}`, isActive: true, ...data, amount: new Prisma.Decimal(data.amount) }; rubrics.push(row); return row; },
      update: async ({ where, data }) => { events.push("catalog-update"); const row = rubrics.find(r => r.id === where.id); if (!row) throw new Error("not_found"); Object.assign(row, data, { amount: new Prisma.Decimal(data.amount) }); return row; },
      findUnique: async ({ where }) => rubrics.find(r => r.id === where.id) ?? null,
      findMany: async ({ orderBy }) => { assert.equal(orderBy.name, "asc"); return [...rubrics].sort((a, b) => a.name.localeCompare(b.name)); },
    },
    student: { findUnique: async () => ({ familyId: foreign ? "other-family" : "family" }) },
    eventualChargeSchedule: {
      create: async ({ data }) => { events.push("schedule-create"); const row = { id: `schedule${++next}`, eventualChargeItemId: null, grossAmount: null, discountAmount: null, discountPercent: null, cancelledFrom: null, effectiveFrom: null, sourceKey: null, ...data, totalAmount: new Prisma.Decimal(data.totalAmount) }; schedules.push(row); return row; },
      findUnique: async ({ where }) => schedules.find(s => s.id === where.id) ?? null,
      update: async ({ where, data }) => { const row = schedules.find(s => s.id === where.id); Object.assign(row, data); return row; },
      delete: async ({ where }) => { const index = schedules.findIndex(s => s.id === where.id); return schedules.splice(index, 1)[0]; },
      findMany: async ({ where }) => {
        const rows = schedules.filter(s => (!where.familyId || s.familyId === where.familyId) && (!where.rubricId || s.rubricId !== null) && (!where.id || s.id === where.id) && (!where.startPeriod || s.startPeriod <= where.startPeriod.lte)).map(s => ({ ...s, student: { firstName: "Ana", lastName: "Familia", familyId: "family" }, accountEntries: entries.filter(e => e.eventualChargeScheduleId === s.id).map(e => ({ installmentNumber: e.installmentNumber })) }));
        if (afterScan) { const hook = afterScan; afterScan = null; await hook(); }
        return rows;
      },
    },
    familyAccountEntry: {
      findMany: async ({ where }) => entries.filter(e => (!where.eventualChargeScheduleId || e.eventualChargeScheduleId === where.eventualChargeScheduleId) && (!where.familyId || e.familyId === where.familyId)).map(e => ({ allocationsAsCharge: [], allocationsAsCredit: [], ...e })),
      deleteMany: async ({ where }) => { let count = 0; for (let i = entries.length - 1; i >= 0; i--) if (where.id.in.includes(entries[i].id)) { entries.splice(i, 1); count++; } return { count }; },
      createMany: async ({ data, skipDuplicates }) => {
        assert.equal(skipDuplicates, true);
        if (generationFailure) throw new Error("charge_failure");
        let count = 0;
        for (const e of data) if (!entries.some(x => x.eventualChargeScheduleId === e.eventualChargeScheduleId && x.installmentNumber === e.installmentNumber)) { entries.push({ id: `entry${++next}`, paymentId: null, billingPeriod: null, ...e }); count++; }
        return { count };
      },
    },
    $queryRaw: async (strings, ...values) => { assert.match(strings.join("?"), /^SELECT 1 FROM pg_advisory_xact_lock\(hashtext\(\?\)\)/); assert.deepEqual(values, ["family"]); events.push("lock"); },
    $transaction: async (callback, options) => {
      assert.equal(options.timeout, 30000);
      assert.equal(options.isolationLevel, "Serializable");
      const before = { schedules: schedules.map(s => ({ ...s })), entries: entries.map(e => ({ ...e })), next };
      const tx = { ...db }; delete tx.$transaction;
      if (transactionMethodVisible) {
        // Reproduce the runtime shape from the recursive P2028 failure without
        // letting a regression open nested transactions until the test times out.
        tx.$transaction = async () => { throw new Error("unexpected_nested_transaction"); };
      }
      try { const result = await callback(tx); if (conflict) throw Object.assign(new Error("conflict"), { code: conflict }); return result; }
      catch (e) { schedules.splice(0, schedules.length, ...before.schedules); entries.splice(0, entries.length, ...before.entries); next = before.next; throw e; }
    },
  };
  const service = load("src/modules/families/server/rubrics.service.ts", {
    "server-only": {}, "@/lib/prisma": { prisma: db },
    "@/modules/families/lib/billing-rubrics": validators,
    "@/modules/families/lib/eventual-installments": require("../../src/modules/families/lib/eventual-installments.ts"),
    "@/modules/families/lib/plan-discounts": require("../../src/modules/families/lib/plan-discounts.ts"),
    "@/modules/families/lib/monthly-billing": period,
    "@/modules/families/server/eventual-installments.core": installments,
  });
  const repository = load("src/modules/families/server/rubrics.repository.ts", { "server-only": {}, "@/lib/prisma": { prisma: db } });
  const input = { familyId: "family", studentId: "student", rubricId: "rubric", installmentCount: 3, startMonth: 3 };
  return { service, repository, input, events, db, generate: installments.createDueEventualInstallmentCharges, entries, snapshot,
    failGeneration: () => { generationFailure = true; }, conflict: code => { conflict = code; },
    afterScan: hook => { afterScan = hook; },
    seedEntry: data => entries.push({ id: `seed${++next}`, familyId: "family", paymentId: null, billingPeriod: null, ...copy(data) }),
    amendEntry: (id, data) => Object.assign(entries.find(e => e.id === id), copy(data)),
    amendSchedule: (id, data) => Object.assign(schedules.find(s => s.id === id), data),
  };
}

test("assignment and edit reuse the open transaction even when it exposes $transaction", async () => {
  const f = await setup({ transactionMethodVisible: true });
  const first = await f.service.assignRubricToStudent({ ...f.input, installmentCount: 1, startMonth: 1 }, "admin");
  const originalEntries = f.entries.map(entry => ({ ...entry }));
  const rubric = await f.service.createBillingRubric({ name: "Seguro", amount: "600" });
  const second = await f.service.assignRubricToStudent({ ...f.input, rubricId: rubric.id, installmentCount: 1, startMonth: 1 }, "admin");
  assert.deepEqual(f.entries.slice(0, originalEntries.length), originalEntries);
  assert.deepEqual(f.entries.map(entry => [entry.eventualChargeScheduleId, entry.amount]), [[first.id, "120000.00"], [second.id, "600.00"]]);
  await f.service.updateStudentRubricAssignment({ ...f.input, rubricId: rubric.id, assignmentId: second.id, installmentCount: 1, startMonth: 1, discountPercent: "10" }, "admin");
  assert.deepEqual(f.entries.slice(0, originalEntries.length), originalEntries);
  assert.equal(f.entries.at(-1).amount, "540.00");
  assert.equal((await f.repository.listStudentRubricAssignments("family")).length, 2);
  assert.equal(f.events.filter(event => event === "lock").length, 3);
  f.failGeneration();
  const before = f.snapshot();
  await assert.rejects(f.service.assignRubricToStudent({ ...f.input, startMonth: 1 }, "admin"), /charge_failure/);
  assert.equal(f.snapshot(), before, "a failed charge rolls back its assignment and counters");
});

test("periodic generation never rediscovers work recursively inside its transaction", async () => {
  const f = await setup({ transactionMethodVisible: true });
  const schedule = await f.service.assignRubricToStudent({ ...f.input, installmentCount: 1, startMonth: 12 }, "admin");
  const december = new Date("2026-12-01T00:00:00Z");
  assert.deepEqual(await f.generate(f.db, december, december, schedule.id), { due: 1, created: 1 });
  assert.deepEqual(await f.generate(f.db, december, december, schedule.id), { due: 0, created: 0 });
  assert.deepEqual(f.entries.map(entry => [entry.eventualChargeScheduleId, entry.amount]), [[schedule.id, "120000.00"]]);
  assert.equal(f.events.filter(event => event === "lock").length, 3);
});

test("S2 catalog public services create/update ordered rubrics without legacy plans", async () => {
  const f = await setup();
  const created = await f.service.createBillingRubric({ name: "  Aporte  ", amount: "10.25" });
  await f.service.updateBillingRubric({ rubricId: created.id, name: "Aporte anual", amount: "20.50", isActive: false });
  const list = await f.repository.listBillingRubricsForAdmin();
  assert.deepEqual(Array.from(list, r => [r.name, r.amount.toString(), r.isActive]), [["Aporte anual", "20.5", false], ["Materiales", "120000", true]]);
  assert.deepEqual(f.events, ["catalog-create", "catalog-update"]);
});

test("S3 assigns multiple additive student rubrics, preserves snapshots and legacy FK", async () => {
  const f = await setup();
  await f.service.assignRubricToStudent(f.input, "admin");
  await f.service.updateBillingRubric({ rubricId: "rubric", name: "Nuevo", amount: "300" });
  await f.service.assignRubricToStudent(f.input, "admin");
  const list = await f.repository.listStudentRubricAssignments("family");
  assert.deepEqual(Array.from(list, s => [s.studentId, s.rubricId, s.itemName, s.totalAmount.toString(), s.eventualChargeItemId]), [["student", "rubric", "Materiales", "120000", null], ["student", "rubric", "Nuevo", "300", null]]);
  assert.deepEqual(Array.from(await f.repository.listStudentRubricAssignments("other")), []);
  assert.equal(f.events.filter(e => e === "lock").length, 2);
});

test("S4 selected month begins in billing year; no early debt; rollover is idempotent", async () => {
  const f = await setup();
  await f.service.assignRubricToStudent({ ...f.input, startMonth: 12 }, "admin");
  const [assignment] = await f.repository.listStudentRubricAssignments("family");
  assert.equal(assignment.startPeriod.toISOString(), "2026-12-01T00:00:00.000Z");
  assert.equal(f.entries.length, 0);
  const january = new Date("2027-01-01T00:00:00Z");
  assert.equal((await f.generate(f.db, january, january, assignment.id)).created, 2);
  assert.equal((await f.generate(f.db, january, january, assignment.id)).created, 0);
  assert.deepEqual(f.entries.map(e => [e.amount, e.installmentNumber, e.type]), [["40000.00", 1, "EVENTUAL_CHARGE"], ["40000.00", 2, "EVENTUAL_CHARGE"]]);
  assert.match(f.entries[1].description, /enero de 2027/);
});

test("S5 120000 / 3 emits three 40000 charges and preserves cents", async () => {
  const f = await setup();
  await f.service.assignRubricToStudent({ ...f.input, startMonth: 1 }, "admin");
  assert.deepEqual(f.entries.map(e => e.amount), ["40000.00", "40000.00", "40000.00"]);
  await f.service.updateBillingRubric({ rubricId: "rubric", name: "Centavos", amount: "100.00" });
  await f.service.assignRubricToStudent({ ...f.input, startMonth: 1 }, "admin");
  assert.deepEqual(f.entries.slice(3).map(e => e.amount), ["33.33", "33.33", "33.34"]);
});

test("S6 invalid input, membership or inactive rubric rejects without writes or counters", async () => {
  for (const options of [{}, { foreign: true }, { inactive: true }]) {
    const f = await setup(options);
    const before = JSON.stringify(await f.repository.listBillingRubricsForAdmin());
    for (const input of [{ ...f.input, installmentCount: 0 }, { ...f.input, installmentCount: 121 }, { ...f.input, installmentCount: 1.5 }, { ...f.input, startMonth: 0 }, { ...f.input, startMonth: 13 }, { ...f.input, startMonth: 1.5 }, { ...f.input, familyId: " " }, ...(options.foreign || options.inactive ? [f.input] : [])]) {
      await assert.rejects(f.service.assignRubricToStudent(input, "admin"));
    }
    for (const amount of ["0", "-1", "1.001", "10000000000", "1e3", "NaN"]) {
      await assert.rejects(f.service.createBillingRubric({ name: "Inválido", amount }));
      await assert.rejects(f.service.updateBillingRubric({ rubricId: "rubric", name: "Inválido", amount }));
    }
    await assert.rejects(f.service.createBillingRubric({ name: " ", amount: "1" }));
    await assert.rejects(f.service.updateBillingRubric({ rubricId: "rubric", name: "Materiales", amount: "1", isActive: "false" }));
    await assert.rejects(f.service.assignRubricToStudent(f.input, " "));
    await assert.rejects(f.service.assignRubricToStudent({ ...f.input, rubricId: "missing" }, "admin"));
    assert.equal(JSON.stringify(await f.repository.listBillingRubricsForAdmin()), before);
    assert.equal((await f.repository.listStudentRubricAssignments("family")).length, 0);
    assert.deepEqual(f.entries, []);
    assert.deepEqual(f.events.filter(e => e !== "lock"), []);
  }
});

test("S6 failed charge generation rolls assignment back atomically", async () => {
  const f = await setup({ failCharges: true });
  await assert.rejects(f.service.assignRubricToStudent({ ...f.input, startMonth: 1 }, "admin"), /charge_failure/);
  assert.equal((await f.repository.listStudentRubricAssignments("family")).length, 0);
  assert.deepEqual(f.entries, []);
});

test("S1/S6 migration guards all accounting and assignments, deletes only old catalog", () => {
  const sql = source("prisma/migrations/20261021120000_student_billing_rubrics/migration.sql");
  assert.match(sql, /BEGIN;/); assert.match(sql, /COMMIT;/);
  for (const table of ["FamilyAccountEntry", "FamilyPaymentAllocation", "FamilyPayment", "PaymentReceipt", "ReceiptDelivery", "EventualChargeSchedule", "Family", "Student"]) {
    assert.match(sql, new RegExp(`EXISTS \\(SELECT 1 FROM "${table}"`));
  }
  assert.match(sql, /RAISE EXCEPTION/); assert.match(sql, /LOCK TABLE/); assert.match(sql, /pg_constraint/);
  assert.deepEqual([...sql.matchAll(/DELETE FROM "([^"]+)"/g)].map(m => m[1]), ["PlanEventualChargeItem", "Plan"]);
  assert.doesNotMatch(sql, /TRUNCATE|DROP TABLE|^DELETE FROM[^;]*CASCADE|UPDATE "(?:Family|Student)"/m);
  assert.ok(sql.indexOf("RAISE EXCEPTION") < sql.indexOf('DELETE FROM "Plan"'));
  const schema = source("prisma/schema.prisma");
  assert.match(schema, /model BillingRubric\s*\{/); assert.match(schema, /rubricId\s+String\?/); assert.match(schema, /@@index\(\[rubricId\]\)/);
});

test("S1 active cron and old actions cannot create legacy plans or assignments", () => {
  const cron = source("src/modules/families/server/monthly-family-charge.service.ts");
  assert.doesNotMatch(cron, /synchronizeStudentBilling|createMonthlyFamilyCharges/); assert.match(cron, /createDueEventualInstallmentCharges/);
  const actions = source("src/modules/families/server/families.actions.ts");
  assert.doesNotMatch(actions, /prisma\.plan\.(?:create|update)|prisma\.planEventualChargeItem\.(?:create|update)|synchronizeStudentBilling|planId: parsed/);
  assert.match(actions, /prisma\.billingRubric\.findMany/);
  assert.doesNotMatch(source("src/modules/families/server/student-billing.actions.ts"), /synchronizeStudentBilling|previewStudentBilling/);
});

const permission = { requirePermission: async p => { assert.equal(p, "families.manage"); return { id: "admin" }; } };
test("S2-S4 action facade enforces permission, parses forms, reports success and revalidates", async () => {
  const calls = [], paths = [];
  const actions = load("src/modules/families/server/rubrics.actions.ts", {
    "@/modules/auth/server/auth-guards": permission,
    "@/modules/families/lib/billing-rubrics": validators,
    "@/modules/families/server/rubrics.service": {
      createBillingRubric: async input => { calls.push(input); }, updateBillingRubric: async input => { calls.push(input); },
      assignRubricToStudent: async (input, actor) => { calls.push({ ...input, actor }); },
    },
    "next/cache": { revalidatePath: p => paths.push(p) },
  });
  const form = new FormData();
  for (const [k, v] of Object.entries({ name: "Materiales", amount: "120000", rubricId: "rubric", familyId: "family", studentId: "student", installmentCount: "3", startMonth: "3", isActive: "false" })) form.set(k, v);
  assert.equal((await actions.createBillingRubricAction({ message: null }, form)).message, "Rubro creado.");
  assert.equal((await actions.updateBillingRubricAction({ message: null }, form)).message, "Rubro actualizado. Las asignaciones existentes conservan su importe y nombre.");
  assert.equal((await actions.assignRubricToStudentAction({ message: null }, form)).message, "Rubro asignado. Los cargos vencidos se registraron y las cuotas futuras quedaron programadas.");
  assert.equal(calls[2].installmentCount, 3); assert.equal(calls[2].startMonth, 3); assert.equal(calls[2].actor, "admin"); assert.equal(calls[1].isActive, false);
  assert.deepEqual(paths, ["/dashboard/families", "/dashboard/families/rubrics", "/dashboard/families", "/dashboard/families/rubrics", "/dashboard/families", "/dashboard/families/rubrics", "/dashboard/families/family"]);
});

test("action failures preserve data, show bounded errors and never revalidate", async () => {
  const f = await setup();
  const actions = load("src/modules/families/server/rubrics.actions.ts", {
    "@/modules/auth/server/auth-guards": permission, "@/modules/families/lib/billing-rubrics": validators,
    "@/modules/families/server/rubrics.service": f.service,
    "next/cache": { revalidatePath: () => assert.fail("revalidated rejected input") },
  });
  const form = new FormData(); form.set("name", "Materiales"); form.set("amount", "0");
  assert.equal((await actions.createBillingRubricAction({ message: null }, form)).message, "Ingresá un importe positivo de hasta 10 enteros y 2 decimales.");
  form.set("familyId", "family"); form.set("studentId", "student"); form.set("rubricId", "rubric"); form.set("installmentCount", "3e0"); form.set("startMonth", "1");
  assert.equal((await actions.assignRubricToStudentAction({ message: null }, form)).message, "Seleccioná entre 1 y 120 cuotas enteras.");
  assert.deepEqual(f.events, []); assert.deepEqual(f.entries, []);
  const denied = load("src/modules/families/server/rubrics.actions.ts", {
    "@/modules/auth/server/auth-guards": { requirePermission: async () => { throw new Error("forbidden"); } },
    "@/modules/families/lib/billing-rubrics": validators, "@/modules/families/server/rubrics.service": f.service, "next/cache": {},
  });
  for (const action of [denied.assignRubricToStudentAction, denied.updateStudentRubricAssignmentAction, denied.deleteStudentRubricAssignmentAction]) await assert.rejects(action({ message: null }, form), /forbidden/);
  assert.deepEqual(f.events, []);
});

test("PRESERVE manual free charges and payment actions retain their public semantics", async () => {
  const entries = [], calls = [], paths = [];
  const payments = Object.fromEntries(["register", "reconcile", "voidPayment", "waive"].map(name => [name, async input => { calls.push({ name, input }); return { ok: true, message: "ok", familyId: "family", paymentId: "payment" }; }]));
  const actions = load("src/modules/families/server/family-account.actions.ts", {
    "@/lib/prisma": { prisma: { family: { findUnique: async () => ({ id: "family" }) }, familyAccountEntry: { create: async ({ data }) => { entries.push(data); } } } },
    "@/modules/auth/server/auth-guards": { requirePermission: async () => ({ id: "admin" }) },
    "@/modules/families/server/payment-allocation.service": { createFamilyPaymentService: () => payments },
    "@/modules/families/server/receipt.service": { createReceiptForPayment: async id => { assert.equal(id, "payment"); } },
    "next/cache": { revalidatePath: path => paths.push(path) },
  });
  const form = new FormData(); form.set("familyId", "family"); form.set("description", "Salida libre"); form.set("amount", "125.50");
  assert.equal((await actions.registerFamilyEventualChargeAction(form)).message, "Cargo eventual registrado.");
  assert.deepEqual(entries.map(e => ({ ...e })), [{ familyId: "family", type: "EVENTUAL_CHARGE", amount: 125.5, description: "Cargo eventual · Salida libre", createdById: "admin" }]);
  form.set("eventualChargeItemId", "rubric");
  assert.equal((await actions.registerFamilyEventualChargeAction(form)).ok, false);
  assert.equal(entries.length, 1); assert.equal(entries[0].eventualChargeItemId, undefined);
  for (const action of [actions.registerFamilyPaymentAction, actions.reconcileFamilyCreditAction, actions.voidFamilyPaymentAction, actions.waiveFamilyBalanceAction]) assert.equal((await action(form)).ok, true);
  assert.deepEqual(calls.map(c => c.name), ["register", "reconcile", "voidPayment", "waive"]);
  assert.equal(paths.filter(p => p === "/dashboard/families/family").length, 5);
});

test("PRESERVE cron emits explicit due schedules idempotently without consulting plans", async () => {
  const f = await setup();
  await f.service.assignRubricToStudent({ ...f.input, startMonth: 12 }, "admin");
  const cron = load("src/modules/families/server/monthly-family-charge.service.ts", {
    "server-only": {}, "@/lib/prisma": { prisma: f.db }, "@/modules/families/lib/monthly-billing": require("../../src/modules/families/lib/monthly-billing.ts"),
    "@/modules/families/server/eventual-installments.core": installments,
  });
  const january = new Date("2027-01-07T12:00:00Z");
  assert.equal((await cron.generateMonthlyFamilyCharges(january)).installments.created, 2);
  assert.equal((await cron.generateMonthlyFamilyCharges(january)).installments.created, 0);
  assert.equal(f.entries.length, 2);
});

const discountError = "Ingresá un descuento entre 0 y 100 con hasta 2 decimales.";
const protectedError = "No podés modificar ni eliminar un rubro con pagos asignados o movimientos que no sean cargos generados impagos.";
const assignmentError = "No encontramos una asignación de rubro vigente para este alumno y familia.";
const conflictError = "La cuenta cambió mientras guardabas. Actualizá la ficha, revisá los pendientes y volvé a intentar.";
async function assigned(f, overrides = {}) {
  return f.service.assignRubricToStudent({ ...f.input, startMonth: 1, ...overrides }, "admin");
}
function editing(f, assignment, overrides = {}) {
  return { ...f.input, assignmentId: assignment.id, startMonth: 1, discountPercent: "0", ...overrides };
}
async function unchanged(f, invoke, message) {
  const before = f.snapshot();
  await assert.rejects(invoke, error => { assert.equal(error.message, message); return true; });
  assert.equal(f.snapshot(), before, "all stored rows and identifier counters remain identical");
}

test("S1/S6 discounts snapshot gross, percentage, discount and exact net including zero/full discounts", async () => {
  const f = await setup();
  await f.service.updateBillingRubric({ rubricId: "rubric", name: "Centavos", amount: "100.01" });
  for (const [percent, net, discount] of [["0", "100.01", "0.00"], ["12.34", "87.67", "12.34"], ["100", "0.00", "100.01"]]) {
    const a = await assigned(f, { discountPercent: percent });
    assert.equal(Number(a.grossAmount).toFixed(2), "100.01");
    assert.equal(Number(a.discountAmount).toFixed(2), discount);
    assert.equal(Number(a.discountPercent), Number(percent));
    assert.equal(Number(a.totalAmount).toFixed(2), net);
    const rows = await f.db.familyAccountEntry.findMany({ where: { eventualChargeScheduleId: a.id } });
    assert.equal(rows.reduce((s, e) => s + Math.round(Number(e.amount) * 100), 0), Math.round(Number(net) * 100));
    assert.equal(rows.reduce((s, e) => s + Math.round(Number(e.grossAmount) * 100), 0), 10001);
    assert.equal(rows.reduce((s, e) => s + Math.round(Number(e.discountAmount) * 100), 0), Math.round(Number(discount) * 100));
  }
  assert.equal((await f.repository.listStudentRubricAssignments("family")).length, 3, "discounted assignments remain additive");
});

test("S1/S6 invalid discount and unsplittable gross/net reject with no record/counter changes", async () => {
  const f = await setup();
  for (const discountPercent of ["-1", "100.01", "1.001", "1e1", "NaN", "", " 10", "01", 10, null]) {
    await unchanged(f, () => assigned(f, { discountPercent }), discountError);
  }
  await f.service.updateBillingRubric({ rubricId: "rubric", name: "Pequeño", amount: "0.03" });
  await unchanged(f, () => assigned(f, { discountPercent: "50" }), "Cada cuota debe ser de al menos $0,01.");
  await f.service.updateBillingRubric({ rubricId: "rubric", name: "Pequeño", amount: "0.01" });
  await unchanged(f, () => assigned(f, { discountPercent: "100" }), "Cada cuota debe ser de al menos $0,01.");
});

test("S5/S7 editing preserves historical gross/name/year, rebuilds only own unpaid charges and schedules future terms", async () => {
  const f = await setup();
  const a = await assigned(f);
  const other = await assigned(f);
  f.seedEntry({ type: "PAYMENT", amount: "-10", paymentId: "payment", description: "unrelated credit" });
  const unrelated = JSON.stringify((await f.db.familyAccountEntry.findMany({ where: {} })).filter(e => e.eventualChargeScheduleId !== a.id));
  f.amendSchedule(a.id, { startPeriod: new Date("2025-01-01T00:00:00Z"), grossAmount: null, discountAmount: null, discountPercent: null });
  for (const row of await f.db.familyAccountEntry.findMany({ where: { eventualChargeScheduleId: a.id } })) f.amendEntry(row.id, { grossAmount: null, discountAmount: null });
  await f.service.updateBillingRubric({ rubricId: "rubric", name: "Changed catalog", amount: "900", isActive: false });
  const updated = await f.service.updateStudentRubricAssignment(editing(f, a, { startMonth: 12, installmentCount: 24, discountPercent: "25" }), "admin");
  assert.equal(updated.id, a.id);
  assert.equal(updated.itemName, "Materiales");
  assert.equal(Number(updated.grossAmount), 120000);
  assert.equal(Number(updated.totalAmount), 90000);
  assert.equal(updated.startPeriod.toISOString(), "2025-12-01T00:00:00.000Z");
  const rows = await f.db.familyAccountEntry.findMany({ where: { eventualChargeScheduleId: a.id } });
  assert.equal(rows.length, 12, "December 2025 through November 2026 accrues by October 25");
  assert.deepEqual(rows.map(e => e.installmentNumber), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.ok(rows.every(e => e.amount === "3750.00"));
  assert.equal(JSON.stringify((await f.db.familyAccountEntry.findMany({ where: {} })).filter(e => e.eventualChargeScheduleId !== a.id)), unrelated);
  assert.equal((await f.generate(f.db, now, period.getBillingPeriod(), a.id)).created, 0);
  assert.equal((await f.repository.listStudentRubricAssignments("family")).find(s => s.id === other.id).totalAmount.toString(), "120000");
});

test("S5 switching rubric uses the active current catalog and delete removes only its schedule/charges", async () => {
  const f = await setup();
  const a = await assigned(f);
  const other = await assigned(f);
  const rubric = await f.service.createBillingRubric({ name: "Matrícula", amount: "100.01" });
  await f.service.updateStudentRubricAssignment(editing(f, a, { rubricId: rubric.id, discountPercent: "10", startMonth: 12 }), "admin");
  const [updated] = (await f.repository.listStudentRubricAssignments("family")).filter(s => s.id === a.id);
  assert.equal(updated.itemName, "Matrícula"); assert.equal(Number(updated.grossAmount), 100.01); assert.equal(Number(updated.totalAmount), 90.01);
  assert.equal((await f.db.familyAccountEntry.findMany({ where: { eventualChargeScheduleId: a.id } })).length, 0);
  // Also delete a schedule that already has positive unpaid charges, not only future terms.
  await f.service.updateStudentRubricAssignment(editing(f, a, { rubricId: rubric.id, discountPercent: "10", startMonth: 1 }), "admin");
  assert.equal((await f.db.familyAccountEntry.findMany({ where: { eventualChargeScheduleId: a.id } })).length, 3);
  const retained = JSON.stringify(await f.db.familyAccountEntry.findMany({ where: { eventualChargeScheduleId: other.id } }));
  await f.service.deleteStudentRubricAssignment({ familyId: "family", studentId: "student", assignmentId: a.id }, "admin");
  assert.deepEqual(Array.from(await f.repository.listStudentRubricAssignments("family"), s => s.id), [other.id]);
  assert.equal(JSON.stringify(await f.db.familyAccountEntry.findMany({ where: {} })), retained);
  assert.equal((await f.repository.listBillingRubricsForAdmin()).length, 2, "delete never touches the catalog");
  assert.equal((await f.generate(f.db, new Date("2027-03-01"), new Date("2027-03-01"), a.id)).created, 0);
});

test("S5/S7 ownership, cancelled and non-rubric schedules reject edit/delete atomically", async () => {
  for (const patch of [{ familyId: "other" }, { studentId: "other" }, { rubricId: null }, { cancelledFrom: new Date("2027-01-01") }, { isBase: true }, { eventualChargeItemId: "legacy" }]) {
    const f = await setup(); const a = await assigned(f); f.amendSchedule(a.id, patch);
    await unchanged(f, () => f.service.updateStudentRubricAssignment(editing(f, a), "admin"), assignmentError);
    await unchanged(f, () => f.service.deleteStudentRubricAssignment({ familyId: "family", studentId: "student", assignmentId: a.id }, "admin"), assignmentError);
  }
  const f = await setup(); const a = await assigned(f);
  await unchanged(f, () => f.service.updateStudentRubricAssignment(editing(f, a, { assignmentId: "missing" }), "admin"), assignmentError);
  await unchanged(f, () => f.service.updateStudentRubricAssignment(editing(f, a, { discountPercent: "101" }), "admin"), discountError);
  await unchanged(f, () => f.service.updateStudentRubricAssignment(editing(f, a, { rubricId: "missing" }), "admin"), "Seleccioná un rubro activo.");
});

test("paid and partially paid installments stay unchanged while unpaid installments receive the discount", async () => {
  for (const [amount, status] of [["40000", "REGISTERED"], ["1", "REGISTERED"], ["1", "VOIDED"]]) {
    const f = await setup(); const a = await assigned(f);
    f.amendEntry(f.entries[0].id, { allocationsAsCharge: [{ amount, creditEntry: { payment: { status } } }] });
    const protectedRow = JSON.stringify(f.entries[0]);
    const updated = await f.service.updateStudentRubricAssignment(editing(f, a, { discountPercent: "10" }), "admin");
    assert.equal(JSON.stringify(f.entries[0]), protectedRow);
    assert.deepEqual(f.entries.map(e => e.amount), ["40000.00", "36000.00", "36000.00"]);
    assert.equal(Number(updated.totalAmount), 112000);
    assert.equal(Number(updated.discountAmount), 8000);
    await f.service.updateStudentRubricAssignment(editing(f, a, { discountPercent: "20" }), "admin");
    assert.equal(JSON.stringify(f.entries[0]), protectedRow);
    assert.deepEqual(f.entries.map(e => e.amount), ["40000.00", "32000.00", "32000.00"]);
    assert.equal(Number(updated.totalAmount), 104000);
    await unchanged(f, () => f.service.deleteStudentRubricAssignment({ familyId: "family", studentId: "student", assignmentId: a.id }, "admin"), protectedError);
  }
});

test("editing with payments freezes future unpaid terms and periodic generation stays idempotent", async () => {
  const f = await setup(); const a = await assigned(f, { startMonth: 10 });
  assert.equal(f.entries.length, 2);
  f.amendEntry(f.entries[0].id, { allocationsAsCharge: [{ amount: "1" }] });
  const protectedRow = JSON.stringify(f.entries[0]);
  await f.service.updateStudentRubricAssignment(editing(f, a, { startMonth: 10, discountPercent: "10" }), "admin");
  assert.equal(JSON.stringify(f.entries[0]), protectedRow);
  assert.deepEqual(f.entries.map(e => e.amount), ["40000.00", "36000.00", "36000.00"]);
  assert.equal((await f.generate(f.db, new Date("2027-01-01"), new Date("2027-01-01"), a.id)).created, 0);
});

test("a full discount preserves a paid cent and leaves zero future installments without redistributing the mixed total", async () => {
  const f = await setup();
  await f.service.updateBillingRubric({ rubricId: "rubric", name: "Centavos", amount: "0.03" });
  const a = await assigned(f, { startMonth: 10 });
  f.amendEntry(f.entries[0].id, { allocationsAsCharge: [{ amount: "0.01" }] });
  const protectedRow = JSON.stringify(f.entries[0]);
  const updated = await f.service.updateStudentRubricAssignment(editing(f, a, { startMonth: 10, discountPercent: "100" }), "admin");
  assert.equal(JSON.stringify(f.entries[0]), protectedRow);
  assert.deepEqual(f.entries.map(e => e.amount), ["0.01", "0.00", "0.00"]);
  assert.equal(Number(updated.totalAmount), 0.01);
  assert.equal(Number(updated.discountAmount), 0.02);
  const future = new Date("2027-01-01");
  assert.deepEqual(await f.generate(f.db, future, future, a.id), { due: 0, created: 0 });
  const { projectFutureFamilyCharges } = require("../../src/modules/families/lib/family-charge-projections.ts");
  const schedules = await f.db.eventualChargeSchedule.findMany({ where: { id: a.id } });
  assert.deepEqual(projectFutureFamilyCharges(schedules, now, true), []);
  const preview = require("../../src/modules/families/server/student-billing.core.ts").previewStudentBilling;
  const db = { ...f.db, family: { findUniqueOrThrow: async () => ({ status: "ACTIVE", students: [{ id: "student", familyId: "family", firstName: "Ana", lastName: "Familia", plan: null }] }) }, familyAccountEntry: { ...f.db.familyAccountEntry, count: async () => 0 } };
  assert.deepEqual((await preview(db, "family", now)).charges, []);
});

test("paid installment dates, numbering and rubric cannot be changed; failed edits roll back", async () => {
  const f = await setup(); const a = await assigned(f);
  f.amendEntry(f.entries[0].id, { allocationsAsCharge: [{ amount: "1" }] });
  for (const patch of [{ startMonth: 2 }, { installmentCount: 2 }, { rubricId: "other" }]) {
    await unchanged(f, () => f.service.updateStudentRubricAssignment(editing(f, a, patch), "admin"), "Con pagos imputados solo podés cambiar el descuento. Se conservan el rubro, las cuotas y el mes de inicio.");
  }
  f.failGeneration();
  await unchanged(f, () => f.service.updateStudentRubricAssignment(editing(f, a, { discountPercent: "10" }), "admin"), "charge_failure");
});

test("S5/S7 credit allocation or non-generated entry blocks both operations", async () => {
  for (const patch of [
    { allocationsAsCredit: [{ amount: "1" }] }, { type: "PAYMENT" }, { type: "PAYMENT_REVERSAL" },
    { type: "BALANCE_WAIVER" }, { type: "MONTHLY_CHARGE" }, { amount: "-1" },
    { paymentId: "payment" }, { installmentNumber: null }, { installmentNumber: 4 }, { billingPeriod: new Date("2026-01-01") }, { familyId: "other" },
    { amount: "0", grossAmount: null, discountAmount: null }, { amount: "39999" },
  ]) {
    const f = await setup(); const a = await assigned(f);
    // Protect even the last installment, not just the first outstanding charge.
    f.amendEntry(f.entries.at(-1).id, patch);
    await unchanged(f, () => f.service.updateStudentRubricAssignment(editing(f, a), "admin"), protectedError);
    await unchanged(f, () => f.service.deleteStudentRubricAssignment({ familyId: "family", studentId: "student", assignmentId: a.id }, "admin"), protectedError);
  }
});

test("S5 full-discount zero charges remain editable/deletable and legacy zero-discount rows stay compatible", async () => {
  const f = await setup(); const a = await assigned(f, { discountPercent: "100" });
  await f.service.updateStudentRubricAssignment(editing(f, a), "admin");
  assert.equal((await f.db.familyAccountEntry.findMany({ where: { eventualChargeScheduleId: a.id } })).length, 3);
  f.amendSchedule(a.id, { grossAmount: null, discountAmount: null, discountPercent: null });
  for (const row of f.entries) f.amendEntry(row.id, { grossAmount: null, discountAmount: null });
  await f.service.updateStudentRubricAssignment(editing(f, a, { discountPercent: "100" }), "admin");
  await f.service.deleteStudentRubricAssignment({ familyId: "family", studentId: "student", assignmentId: a.id }, "admin");
  assert.equal((await f.repository.listStudentRubricAssignments("family")).length, 0);
  assert.deepEqual(await f.db.familyAccountEntry.findMany({ where: {} }), []);
});

test("S5 regeneration failure and serializable/FK conflicts roll back deletions, edits, charges and counters without retries", async () => {
  for (const failure of ["generation", "P2034", "P2003"]) {
    const f = await setup(); const a = await assigned(f);
    if (failure === "generation") f.failGeneration(); else f.conflict(failure);
    const locks = f.events.filter(e => e === "lock").length;
    await unchanged(f, () => f.service.updateStudentRubricAssignment(editing(f, a, { discountPercent: "25" }), "admin"), failure === "generation" ? "charge_failure" : conflictError);
    assert.equal(f.events.filter(e => e === "lock").length - locks, 1, "no automatic retry");
    if (failure !== "generation") await unchanged(f, () => f.service.deleteStudentRubricAssignment({ familyId: "family", studentId: "student", assignmentId: a.id }, "admin"), conflictError);
  }
});

test("S5 generator re-reads schedules after family locking, never appending stale edit/deleted terms", async () => {
  for (const operation of ["edit", "delete"]) {
    const f = await setup(); const a = await assigned(f, { startMonth: 12 });
    f.afterScan(async () => {
      // A completed concurrent transaction between discovery and lock acquisition.
      if (operation === "edit") await f.db.eventualChargeSchedule.update({ where: { id: a.id }, data: { totalAmount: "60000", grossAmount: "120000", discountAmount: "60000", discountPercent: "50" } });
      else await f.db.eventualChargeSchedule.delete({ where: { id: a.id } });
    });
    const january = new Date("2027-01-01");
    const result = await f.generate(f.db, january, january, a.id);
    const rows = await f.db.familyAccountEntry.findMany({ where: { eventualChargeScheduleId: a.id } });
    assert.equal(result.created, operation === "edit" ? 2 : 0);
    assert.deepEqual(rows.map(e => e.amount), operation === "edit" ? ["20000.00", "20000.00"] : []);
  }
});

test("S1/S5 actions expose discounted add/edit/delete, exact feedback and bounded conflict errors", async () => {
  const f = await setup(); const paths = [], permissions = [];
  const actions = load("src/modules/families/server/rubrics.actions.ts", {
    "@/modules/auth/server/auth-guards": { requirePermission: async p => { permissions.push(p); return { id: "admin" }; } },
    "@/modules/families/lib/billing-rubrics": validators, "@/modules/families/server/rubrics.service": f.service,
    "next/cache": { revalidatePath: path => paths.push(path) },
  });
  const form = new FormData();
  for (const [k, v] of Object.entries({ ...f.input, startMonth: 1, discountPercent: "10" })) form.set(k, String(v));
  assert.equal((await actions.assignRubricToStudentAction({ message: null }, form)).message, "Rubro asignado. Los cargos vencidos se registraron y las cuotas futuras quedaron programadas.");
  const [a] = await f.repository.listStudentRubricAssignments("family");
  assert.equal(Number(a.discountPercent), 10);
  form.set("assignmentId", a.id); form.set("discountPercent", "25");
  assert.equal((await actions.updateStudentRubricAssignmentAction({ message: null }, form)).message, "Rubro actualizado. Se recalcularon solo las cuotas sin pagos; las pagadas o parcialmente pagadas quedaron intactas.");
  const before = f.snapshot(); const pathCount = paths.length;
  for (const [key, value, message] of [["installmentCount", "3e0", "Seleccioná entre 1 y 120 cuotas enteras."], ["startMonth", "1.2", "Seleccioná un mes entre 1 y 12."], ["discountPercent", "101", discountError]]) {
    const original = form.get(key); form.set(key, value);
    assert.equal((await actions.updateStudentRubricAssignmentAction({ message: null }, form)).message, message);
    form.set(key, original);
    assert.equal(f.snapshot(), before); assert.equal(paths.length, pathCount);
  }
  assert.equal((await actions.deleteStudentRubricAssignmentAction({ message: null }, form)).message, "Rubro eliminado. Se quitaron únicamente sus cargos impagos.");
  assert.deepEqual(paths, Array.from({ length: 3 }, () => ["/dashboard/families", "/dashboard/families/rubrics", "/dashboard/families/family"]).flat());
  assert.ok(permissions.every(p => p === "families.manage")); assert.equal(permissions.length, 6);
  assert.equal((await f.repository.listStudentRubricAssignments("family")).length, 0);
  const protectedAssignment = await assigned(f);
  form.set("assignmentId", protectedAssignment.id);
  f.amendEntry(f.entries.at(-1).id, { allocationsAsCharge: [{ amount: "1" }] });
  const paidRow = JSON.stringify(f.entries.at(-1));
  assert.equal((await actions.updateStudentRubricAssignmentAction({ message: null }, form)).message, "Rubro actualizado. Se recalcularon solo las cuotas sin pagos; las pagadas o parcialmente pagadas quedaron intactas.");
  assert.equal(JSON.stringify(f.entries.find(e => e.allocationsAsCharge?.length)), paidRow);
  const protectedBefore = f.snapshot(), protectedPaths = paths.length;
  assert.equal((await actions.deleteStudentRubricAssignmentAction({ message: null }, form)).message, protectedError);
  assert.equal(f.snapshot(), protectedBefore); assert.equal(paths.length, protectedPaths);
  for (const code of ["P2034", "P2003"]) {
    const errors = load("src/modules/families/server/rubrics.actions.ts", {
      "@/modules/auth/server/auth-guards": permission, "@/modules/families/lib/billing-rubrics": validators,
      "@/modules/families/server/rubrics.service": { updateStudentRubricAssignment: async () => { throw { code }; }, deleteStudentRubricAssignment: async () => { throw { code }; } },
      "next/cache": { revalidatePath: () => assert.fail("revalidation on failure") },
    });
    for (const action of [errors.updateStudentRubricAssignmentAction, errors.deleteStudentRubricAssignmentAction]) assert.equal((await action({ message: null }, form)).message, conflictError);
  }
});


test("assignment failures retain server diagnostics without exposing internals to the client", async () => {
  const internal = Object.assign(new Error("database diagnostic with private context"), { code: "P2028" });
  for (const environment of ["development", "production", "test"]) {
    const logs = [], paths = [];
    let failure = internal;
    const actions = load("src/modules/families/server/rubrics.actions.ts", {
      "@/modules/auth/server/auth-guards": permission,
      "@/modules/families/lib/billing-rubrics": validators,
      "@/modules/families/server/rubrics.service": { assignRubricToStudent: async () => { throw failure; } },
      "next/cache": { revalidatePath: path => paths.push(path) },
    }, { console: { error: (...args) => logs.push(args) }, process: { env: { NODE_ENV: environment } } });
    const form = new FormData();
    const response = await actions.assignRubricToStudentAction({ message: null }, form);
    assert.equal(response.message, "No pudimos guardar el rubro. Intentá nuevamente.");
    assert.deepEqual(paths, []);
    assert.equal(logs.length, 1);
    assert.equal(logs[0][0], "[families.assignRubricToStudent] Assignment failed.");
    if (environment === "development") assert.equal(logs[0][1], internal);
    else assert.deepEqual(JSON.parse(JSON.stringify(logs[0][1])), { code: "P2028" });
    assert.doesNotMatch(JSON.stringify(response), /private context|P2028/);
    failure = new validators.BillingRubricInputError("El alumno no pertenece a esta familia.");
    assert.equal((await actions.assignRubricToStudentAction({ message: null }, form)).message, failure.message);
    assert.equal(logs.length, 1, "expected validation failures must not log personal input");
    failure = { code: "private-non-Prisma-code", message: "private context" };
    await actions.assignRubricToStudentAction({ message: null }, form);
    if (environment !== "development") assert.deepEqual(JSON.parse(JSON.stringify(logs[1][1])), { code: "UNKNOWN" });
    assert.deepEqual(paths, []);
  }
});

test("two distinct rubrics remain assigned to one student with independent due charges", async () => {
  const f = await setup();
  const first = await f.service.assignRubricToStudent({ ...f.input, installmentCount: 1, startMonth: 1 }, "admin");
  const before = f.entries.map(entry => ({ ...entry }));
  const secondRubric = await f.service.createBillingRubric({ name: "Seguro", amount: "600" });
  const second = await f.service.assignRubricToStudent({ ...f.input, rubricId: secondRubric.id, installmentCount: 1, startMonth: 1 }, "admin");
  const assignments = await f.repository.listStudentRubricAssignments("family");
  assert.deepEqual(Array.from(assignments, row => [row.id, row.studentId, row.rubricId, row.totalAmount.toString()]), [
    [first.id, "student", "rubric", "120000"], [second.id, "student", secondRubric.id, "600"],
  ]);
  assert.deepEqual(f.entries.slice(0, before.length), before);
  assert.deepEqual(f.entries.map(row => [row.eventualChargeScheduleId, row.amount, row.installmentNumber]), [
    [first.id, "120000.00", 1], [second.id, "600.00", 1],
  ]);
});
