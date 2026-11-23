import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { projectFutureFamilyCharges } from "../../src/modules/families/lib/family-charge-projections.ts";
import { buildFamilyFinancialSummary } from "../../src/modules/families/lib/family-financial-summary.ts";

const require = createRequire(import.meta.url);
function load(file, dependencies) {
  const module = { exports: {} };
  const source = readFileSync(new URL(`../../src/modules/families/server/${file}.ts`, import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, {
    module, exports: module.exports,
    require(id) {
      if (Object.hasOwn(dependencies, id)) return dependencies[id];
      if (["@prisma/client", "zod"].includes(id)) return require(id);
      return {};
    },
  });
  return module.exports;
}
const schedules = [{
  id: "schedule", familyId: "family", itemName: "Materiales", isBase: false,
  totalAmount: "120.00", grossAmount: null, installmentCount: 3,
  startPeriod: new Date("2026-10-01T00:00:00Z"), effectiveFrom: null, cancelledFrom: null,
  student: null, accountEntries: [{ installmentNumber: 1 }],
}];

test("both family repositories load schedule terms, emitted numbers and current student ownership", async () => {
  const queries = [];
  const read = async (args) => { queries.push(args); return { id: "family" }; };
  const prisma = { family: { findUnique: read, findUniqueOrThrow: read } };
  const deps = { "@/lib/prisma": { prisma } };
  await load("families.repository", deps).getFamilyDetailForAdmin("family");
  await load("family-financial.repository", deps).getFamilyFinancialRecord("family");
  for (const query of queries) {
    assert.equal(query.where.id, "family");
    const include = query.include.eventualChargeSchedules.include;
    assert.equal(include.accountEntries.select.installmentNumber, true);
    assert.equal(include.student.select.familyId, true);
    assert.ok(query.include.accountEntries.include.allocationsAsCredit);
  }
});

test("detail action returns future projections separately without changing balance, ledger or allocations", async () => {
  let reads = 0;
  const record = {
    id: "family", name: "Familia", eventualChargeSchedules: schedules,
    accountEntries: [{ id: "charge", type: "EVENTUAL_CHARGE", amount: "40.00", description: "Octubre", occurredAt: new Date("2026-10-15T12:00:00Z"), allocationsAsCredit: [], payment: null }],
  };
  const before = JSON.stringify(record);
  const deps = {
    "@/modules/auth/server/auth-guards": { requirePermission: async (key) => { assert.equal(key, "families.manage"); return { permissionKeys: ["families.payments"] }; } },
    "@/modules/families/server/families.repository": { getFamilyDetailForAdmin: async (id) => { assert.equal(id, "family"); reads++; return record; } },
    "@/lib/prisma": { prisma: { billingRubric: { findMany: async () => [] } } },
    "@/modules/families/lib/family-financial-summary": { buildFamilyFinancialSummary: (entries, schedules) => buildFamilyFinancialSummary(entries, schedules, new Date("2026-10-01T12:00:00Z")) },
    "@/modules/families/lib/family-charge-projections": { projectFutureFamilyCharges },
    "@/modules/families/lib/monthly-billing": { getBillingPeriod: () => new Date("2026-10-01T00:00:00Z") },
  };
  const result = await load("families.actions", deps).getFamilyDetailAction("family");
  assert.equal(reads, 1);
  assert.equal(result.balance, "40.00");
  assert.deepEqual(result.futureCharges.map((r) => r.amount), ["40.00", "40.00"]);
  assert.equal(result.entries.length, 1);
  assert.equal(result.pendingCharges.length, 3);
  assert.equal(result.pendingCharges[0].outstandingAmount, "40.00");
  assert.equal(result.unallocatedCredits.length, 0);
  assert.equal(result.entries[0].id, "charge");
  assert.equal(JSON.stringify(record), before);
});
