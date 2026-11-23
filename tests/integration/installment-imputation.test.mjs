import assert from "node:assert/strict";
import test from "node:test";
import { dueInstallmentIndexes, installmentImputationDate } from "../../src/modules/families/lib/eventual-installments.ts";
import { calculateFamilyBalance } from "../../src/modules/families/lib/family-account-policy.ts";
import { buildFamilyFinancialSummary } from "../../src/modules/families/lib/family-financial-summary.ts";
import { createDueEventualInstallmentCharges } from "../../src/modules/families/server/eventual-installments.core.ts";
import { validateConsecutiveAllocations } from "../../src/modules/families/lib/payment-allocation.ts";

const start = new Date("2026-11-01T00:00:00Z");
const now = new Date("2026-10-25T03:00:00Z");
const schedule = { startPeriod: start };
const charge = (id, number) => ({ id, type: "EVENTUAL_CHARGE", amount: "2000", description: id, occurredAt: new Date("2026-10-01T03:00:00Z"), installmentNumber: number, eventualChargeScheduleId: "schedule", eventualChargeSchedule: schedule, allocationsAsCredit: [] });
const credit = (overrides = {}) => ({ id: "pay", type: "PAYMENT", amount: "-6000", description: "Pago", occurredAt: new Date("2026-09-10T15:00:00Z"), payment: { status: "REGISTERED" }, allocationsAsCredit: [1, 2, 3].map(n => ({ chargeEntryId: `c${n}`, amount: "2000" })), ...overrides });

test("accrues on the prior month's 25th at Argentina midnight, including January", () => {
  assert.equal(installmentImputationDate(start, 0).toISOString(), "2026-10-25T03:00:00.000Z");
  assert.equal(installmentImputationDate(start, 2).toISOString(), "2026-12-25T03:00:00.000Z");
  assert.deepEqual(dueInstallmentIndexes(start, 3, new Date("2026-10-25T02:59:59.999Z"), new Set()), []);
  assert.deepEqual(dueInstallmentIndexes(start, 3, now, new Set()), [0]);
  assert.deepEqual(dueInstallmentIndexes(start, 3, new Date("2026-12-25T03:00:00Z"), new Set([1])), [1, 2]);
});

test("6000 pays November, December and January without a future credit offsetting other debt", () => {
  const entries = [charge("c1", 1), charge("c2", 2), charge("c3", 3), credit()];
  assert.equal(calculateFamilyBalance(entries, new Date("2026-10-24T15:00:00Z")), 0);
  assert.equal(calculateFamilyBalance(entries, now), 0);
  assert.equal(calculateFamilyBalance(entries, new Date("2027-01-01T15:00:00Z")), 0);
  const unrelated = { id: "extra", type: "EVENTUAL_CHARGE", amount: "500", occurredAt: new Date("2026-09-01T03:00:00Z") };
  assert.equal(calculateFamilyBalance([...entries, unrelated], now), 500);
  assert.equal(calculateFamilyBalance(entries.slice(0, 3), now), 2000);
  // Voiding keeps historical allocations but restores only the accrued debt.
  assert.equal(calculateFamilyBalance([...entries.slice(0, 3), credit({ payment: { status: "VOIDED" } }), { amount: "6000", type: "PAYMENT_REVERSAL" }], now), 2000);
});

test("requires consecutive installments and complete preceding installments, per assignment", () => {
  const pending = [1, 2, 3].map(n => ({ id: `c${n}`, eventualChargeScheduleId: "schedule", installmentNumber: n, outstandingAmount: "2000" }));
  const row = (id, cents = 200000) => ({ chargeEntryId: id, cents });
  assert.doesNotThrow(() => validateConsecutiveAllocations([row("c1"), row("c2"), row("c3")], pending));
  assert.doesNotThrow(() => validateConsecutiveAllocations([row("c3"), row("c1"), row("c2")], pending));
  assert.throws(() => validateConsecutiveAllocations([row("c1"), row("c3")], pending), /correlativas/);
  assert.throws(() => validateConsecutiveAllocations([row("c2")], pending), /correlativas/);
  assert.throws(() => validateConsecutiveAllocations([row("c1", 100000), row("c2")], pending), /correlativas/);
  assert.doesNotThrow(() => validateConsecutiveAllocations([row("c2"), row("c3", 100000)], pending.slice(1)));
  assert.doesNotThrow(() => validateConsecutiveAllocations([row("free", 100)], [{ id: "free", outstandingAmount: "1" }]));
});


const scheduled = () => ({ id: "schedule", familyId: "family", itemName: "Cuota", totalAmount: "6000", grossAmount: null, installmentCount: 3, startPeriod: start, effectiveFrom: null, cancelledFrom: null, isBase: false, student: null, accountEntries: [], createdById: "admin", eventualChargeItemId: null });

test("all three installments are pending on assignment, but balance accrues even without a generator run", () => {
  const schedules = [scheduled()];
  const before = JSON.stringify(schedules);
  const early = buildFamilyFinancialSummary([], schedules, new Date("2026-10-24T15:00:00Z"));
  assert.equal(early.balance, "0.00");
  assert.equal(early.pendingCharges.length, 3);
  assert.equal(early.futureCharges.length, 3);
  assert.equal(buildFamilyFinancialSummary([], schedules, now).balance, "2000.00");
  assert.equal(buildFamilyFinancialSummary([], schedules, new Date("2026-11-25T03:00:00Z")).balance, "4000.00");
  assert.equal(buildFamilyFinancialSummary([], schedules, new Date("2026-12-25T03:00:00Z")).balance, "6000.00");
  assert.equal(JSON.stringify(schedules), before);
});

test("periodic generator discovers next month's installment on the 25th, catches up, and never duplicates", async () => {
  const schedule = scheduled();
  const stored = [];
  const db = {
    eventualChargeSchedule: { findMany: async ({ where }) => schedule.startPeriod <= where.startPeriod.lte ? [{ ...schedule, accountEntries: stored.map(entry => ({ installmentNumber: entry.installmentNumber })) }] : [] },
    familyAccountEntry: { createMany: async ({ data }) => { stored.push(...data); return { count: data.length }; } },
  };
  const period = new Date("2026-10-01T00:00:00Z");
  assert.deepEqual(await createDueEventualInstallmentCharges(db, new Date("2026-10-25T02:59:59.999Z"), period), { due: 0, created: 0 });
  assert.equal(stored.length, 0);
  assert.deepEqual(await createDueEventualInstallmentCharges(db, now, period), { due: 1, created: 1 });
  assert.equal(stored[0].occurredAt.toISOString(), "2026-10-25T03:00:00.000Z");
  assert.deepEqual(await createDueEventualInstallmentCharges(db, now, period), { due: 0, created: 0 });
  assert.deepEqual(await createDueEventualInstallmentCharges(db, new Date("2027-02-10T15:00:00Z"), new Date("2027-02-01T00:00:00Z")), { due: 2, created: 2 });
  assert.deepEqual(stored.map(entry => entry.installmentNumber), [1, 2, 3]);
  assert.equal(stored[2].occurredAt.toISOString(), "2026-12-25T03:00:00.000Z");
});
