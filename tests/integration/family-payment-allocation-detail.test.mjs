import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import { z } from "zod";
import { buildFamilyFinancialSummary } from "../../src/modules/families/lib/family-financial-summary.ts";

function load(relativePath, dependencies) {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const js = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } }).outputText;
  const exports = {};
  runInNewContext(js, { exports, require: (id) => {
    assert.ok(id in dependencies, `Unexpected dependency ${id}`);
    return dependencies[id];
  } });
  return exports;
}

test("manage-family detail queries allocations and exposes the same pending debt and legacy credit as the full page", async () => {
  const date = new Date("2026-10-19T15:00:00Z");
  const family = { id: "family", name: "Test family", eventualChargeSchedules: [], accountEntries: [
    { id: "charge", type: "MONTHLY_CHARGE", amount: "100.00", description: "Monthly", occurredAt: date, allocationsAsCredit: [], payment: null },
    { id: "credit", type: "PAYMENT", amount: "-40.00", description: "Legacy payment", occurredAt: date, allocationsAsCredit: [{ chargeEntryId: "charge", amount: "30.00" }], payment: { id: "payment", status: "REGISTERED", method: "CASH", reference: null, receipt: null } },
  ] };
  const reads = [];
  const permissions = [];
  const prisma = { family: { findUnique: async (query) => { reads.push(query); return family; } }, billingRubric: { findMany: async () => [] } };
  const repository = load("../../src/modules/families/server/families.repository.ts", {
    "@/modules/families/lib/family-financial-summary": { buildFamilyFinancialSummary },
    "server-only": {}, "@prisma/client": { UserRole: { PARENT: "PARENT" } }, "@/lib/prisma": { prisma },
  });
  const actions = load("../../src/modules/families/server/families.actions.ts", {
    "@prisma/client": { FamilyStatus: { ACTIVE: "ACTIVE", INACTIVE: "INACTIVE", SUSPENDED: "SUSPENDED" }, UserRole: {}, InvitationDeliveryJobStatus: {} },
    "next/cache": {}, "next/navigation": {}, zod: { z }, "@/lib/prisma": { prisma },
    "@/modules/auth/server/auth-guards": { requirePermission: async (permission) => { permissions.push(permission); return { permissionKeys: ["families.payments"] }; } },
    "@/modules/families/server/student-billing.core": {},
    "@/modules/families/lib/monthly-billing": {},
    "@/modules/families/server/families.repository": repository,
    "@/modules/families/lib/eventual-installments": { MAX_EVENTUAL_INSTALLMENTS: 12 },
    "@/modules/families/lib/plan-discounts": {},
    "@/modules/families/lib/family-financial-summary": { buildFamilyFinancialSummary },
    "@/modules/mailing/server/invitation-delivery-worker.service": {},
    "@/modules/users/lib/user-invitation-feedback": {},
    "@/modules/users/server/users.repository": {},
  });
  const before = structuredClone(family);
  const detail = await actions.getFamilyDetailAction("family");
  assert.equal(reads.length, 1);
  assert.equal(reads[0].include.accountEntries.include.allocationsAsCredit, true);
  assert.equal(detail.balance, "60.00");
  assert.equal(detail.canManagePayments, true);
  assert.equal(detail.pendingCharges[0].outstandingAmount, "70.00");
  assert.equal(detail.unallocatedCredits[0].unallocatedAmount, "10.00");
  assert.deepEqual(detail.pendingCharges, buildFamilyFinancialSummary(family.accountEntries, []).pendingCharges);
  assert.deepEqual(permissions, ["families.manage"]);
  assert.deepEqual(family, before, "detail reads cannot rewrite historical balances");
});
