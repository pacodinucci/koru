import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";
import { eventualStartPeriod } from "../../src/modules/families/lib/eventual-installments.ts";
import { createDueEventualInstallmentCharges } from "../../src/modules/families/server/eventual-installments.core.ts";
const current = new Date("2026-10-01T00:00:00Z");
function fixture(month, count = 2) {
 return { id: "new-schedule", familyId: "family", eventualChargeItemId: "item", itemName: "Materiales", totalAmount: new Prisma.Decimal("250"), grossAmount: new Prisma.Decimal("300"), installmentCount: count, startPeriod: eventualStartPeriod(current, month), createdById: "admin", accountEntries: [] };
}
function fake(schedule) {
 const emitted = new Set(); const batches = []; const queries = [];
 return { batches, queries, prisma: {
 eventualChargeSchedule: { findMany: async args => { queries.push(args); return schedule.startPeriod <= args.where.startPeriod.lte ? [{ ...schedule, accountEntries: [...emitted].map(installmentNumber => ({ installmentNumber })) }] : []; } },
 familyAccountEntry: { createMany: async args => { batches.push(args.data); args.data.forEach(e => emitted.add(e.installmentNumber)); return { count: args.data.length }; } }
 } };
}
test("mes pasado conserva año actual y valida límites", () => {
 assert.equal(eventualStartPeriod(current, 3).toISOString(), "2026-03-01T00:00:00.000Z");
 assert.throws(() => eventualStartPeriod(current, 0)); assert.throws(() => eventualStartPeriod(current, 13));
});
test("emite marzo y abril, conserva importes y no duplica", async () => {
 const f = fake(fixture(3));
 assert.equal((await createDueEventualInstallmentCharges(f.prisma, current, current, "new-schedule")).created, 2);
 assert.equal(f.queries[0].where.id, "new-schedule");
 assert.deepEqual(f.batches[0].map(e => e.amount), ["125.00", "125.00"]);
 assert.match(f.batches[0][0].description, /marzo de 2026/); assert.match(f.batches[0][1].description, /abril de 2026/);
 assert.equal((await createDueEventualInstallmentCharges(f.prisma, current, current, "new-schedule")).created, 0);
});
test("inicio futuro no genera deuda anticipada", async () => {
 const f = fake(fixture(11));
 assert.equal((await createDueEventualInstallmentCharges(f.prisma, current, current, "new-schedule")).created, 0);
 assert.equal(f.batches.length, 0);
});
test("emite mes actual y mantiene próxima cuota para año siguiente", async () => {
 const f = fake(fixture(12)); const december = new Date("2026-12-01T00:00:00Z");
 assert.equal((await createDueEventualInstallmentCharges(f.prisma, december, december, "new-schedule")).created, 1);
 const january = new Date("2027-01-01T00:00:00Z");
 assert.equal((await createDueEventualInstallmentCharges(f.prisma, january, january, "new-schedule")).created, 1);
 assert.match(f.batches[1][0].description, /enero de 2027/);
});
