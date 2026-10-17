import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../../src/modules/families/server/families.actions.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

async function setup({ failBilling = false, samePlan = false } = {}) {
  const events = [];
  const state = { planId: samePlan ? "new-plan" : "old-plan", charges: 0 };
  const pool = new pg.Pool();
  // Simulate PostgreSQL field metadata, while using the real Prisma adapter.
  // Never connect this pool to a database.
  pool.query = async ({ text, values }) => {
    assert.match(text, /pg_advisory_xact_lock\(hashtext\(\$1\)\)/);
    assert.deepEqual(values, ["family"]);
    events.push("lock");
    const returnsInteger = /^SELECT 1(?: AS \w+)? FROM pg_advisory_xact_lock/.test(text);
    return { fields: [{ name: returnsInteger ? "locked" : "pg_advisory_xact_lock", dataTypeID: returnsInteger ? 23 : 2278 }], rows: [[returnsInteger ? 1 : ""]], rowCount: 1 };
  };
  const adapter = await new PrismaPg(pool).connect();
  const tx = {
    $queryRaw: async (strings, ...values) => adapter.queryRaw({
      sql: strings.reduce((sql, part, index) => sql + (index ? `$${index}` : "") + part, ""),
      args: values,
      argTypes: values.map(() => ({ scalarType: "string", dbType: "TEXT", arity: "scalar" })),
    }),
    student: {
      findUnique: async () => ({ familyId: "family", planId: state.planId }),
      update: async ({ data }) => { events.push("assign"); state.planId = data.planId; },
    },
    eventualChargeSchedule: { updateMany: async () => { events.push("schedules"); return { count: 0 }; } },
  };
  const prisma = {
    student: tx.student,
    plan: { findUnique: async () => ({ isActive: true }) },
    $transaction: async (callback, options) => {
      assert.equal(options.timeout, 30000);
      const before = { ...state };
      try { return await callback(tx); }
      catch (error) { Object.assign(state, before); throw error; }
    },
  };
  const mocks = {
    "@/lib/prisma": { prisma },
    "@/modules/auth/server/auth-guards": { requirePermission: async permission => {
      assert.equal(permission, "families.manage"); return { id: "admin" };
    } },
    "@/modules/families/lib/eventual-installments": { MAX_EVENTUAL_INSTALLMENTS: 120 },
    "@/modules/families/lib/monthly-billing": { getBillingPeriod: date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)) },
    "@/modules/families/server/student-billing.core": { synchronizeStudentBilling: async (client, familyId, adminId) => {
      assert.equal(client, tx); assert.equal(familyId, "family"); assert.equal(adminId, "admin");
      events.push("billing"); state.charges++;
      if (failBilling) throw new Error("billing failed");
      return { ok: true };
    } },
    "next/cache": { revalidatePath: path => events.push(path) },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: name => name in mocks ? mocks[name] : name.startsWith("@/") || name === "next/navigation" ? {} : require(name),
  });
  const form = new FormData();
  for (const [key, value] of Object.entries({ familyId: "family", studentId: "student", planId: "new-plan" })) form.set(key, value);
  return { run: () => exports.assignPlanToStudentAction(form), events, state, close: async () => { await adapter.dispose(); await pool.end(); } };
}

test("assigns the plan and synchronizes billing after an adapter-compatible family lock", async () => {
  const f = await setup();
  try {
    assert.equal(await f.run(), undefined);
    assert.deepEqual(f.state, { planId: "new-plan", charges: 1 });
    assert.deepEqual(f.events, ["lock", "schedules", "schedules", "assign", "billing", "/dashboard/families", "/dashboard/families/family"]);
  } finally { await f.close(); }
});

test("saving the current plan still synchronizes billing without cancelling schedules", async () => {
  const f = await setup({ samePlan: true });
  try {
    assert.equal(await f.run(), undefined);
    assert.deepEqual(f.state, { planId: "new-plan", charges: 1 });
    assert.deepEqual(f.events, ["lock", "assign", "billing", "/dashboard/families", "/dashboard/families/family"]);
  } finally { await f.close(); }
});

test("a billing failure rejects the assignment without committing data or revalidating pages", async () => {
  const f = await setup({ failBilling: true });
  try {
    await assert.rejects(f.run(), /billing failed/);
    assert.deepEqual(f.state, { planId: "old-plan", charges: 0 });
    assert.deepEqual(f.events, ["lock", "schedules", "schedules", "assign", "billing"]);
  } finally { await f.close(); }
});
