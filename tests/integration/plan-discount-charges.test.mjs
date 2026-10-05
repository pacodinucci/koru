import assert from "node:assert/strict";
import test from "node:test";

import { Prisma } from "@prisma/client";
import { createMonthlyFamilyCharges } from "../../src/modules/families/server/monthly-family-charge.core.ts";
import { createDueEventualInstallmentCharges } from "../../src/modules/families/server/eventual-installments.core.ts";

test("aplica descuento por alumno antes de sumar y congela bruto y descuento del mes", async () => {
  let payload;
  const prisma = {
    family: { findMany: async () => [{ id: "family", students: [
      { firstName: "Ana", lastName: "A", plan: { name: "Plan A", basicMonthlyFee: new Prisma.Decimal("100.10"), discountPercent: new Prisma.Decimal("10") } },
      { firstName: "Beto", lastName: "B", plan: { name: "Plan B", basicMonthlyFee: new Prisma.Decimal("200.20"), discountPercent: new Prisma.Decimal("0") } },
    ] }] },
    familyAccountEntry: { createMany: async (args) => { payload = args; return { count: 1 }; } },
  };
  const period = new Date("2026-10-01T00:00:00.000Z");
  await createMonthlyFamilyCharges(prisma, new Date("2026-10-05T12:00:00.000Z"), period, "octubre de 2026");
  assert.equal(payload.data[0].amount.toFixed(2), "290.29");
  assert.equal(payload.data[0].grossAmount.toFixed(2), "300.30");
  assert.equal(payload.data[0].discountAmount.toFixed(2), "10.01");
  assert.equal(payload.skipDuplicates, true);
});

test("las cuotas pendientes conservan el descuento congelado del cronograma", async () => {
  let payload;
  const prisma = {
    eventualChargeSchedule: { findMany: async () => [{
      id: "schedule", familyId: "family", eventualChargeItemId: "item", itemName: "Materiales",
      grossAmount: new Prisma.Decimal("400.00"), discountAmount: new Prisma.Decimal("100.00"),
      totalAmount: new Prisma.Decimal("300.00"), discountPercent: new Prisma.Decimal("25"),
      installmentCount: 3, startPeriod: new Date("2026-10-01T00:00:00.000Z"),
      createdById: "admin", accountEntries: [{ installmentNumber: 1 }],
    }] },
    familyAccountEntry: { createMany: async (args) => { payload = args; return { count: args.data.length }; } },
  };
  await createDueEventualInstallmentCharges(prisma, new Date("2026-12-05T12:00:00.000Z"), new Date("2026-12-01T00:00:00.000Z"));
  assert.deepEqual(payload.data.map((entry) => entry.amount), ["100.00", "100.00"]);
  assert.deepEqual(payload.data.map((entry) => entry.grossAmount), ["133.33", "133.34"]);
  assert.deepEqual(payload.data.map((entry) => entry.discountAmount.toFixed(2)), ["33.33", "33.34"]);
  assert.deepEqual(payload.data.map((entry) => entry.installmentNumber), [2, 3]);
  assert.equal(payload.skipDuplicates, true);
});
