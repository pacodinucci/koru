import assert from "node:assert/strict";
import test from "node:test";
import { annualPlanInstallment, annualPlanInstallmentIndex } from "../../src/modules/families/lib/annual-plan.ts";
import { createMonthlyFamilyCharges } from "../../src/modules/families/server/monthly-family-charge.core.ts";
import { Prisma } from "@prisma/client";

test("divide el anual con descuento y conserva todos los centavos", () => {
 const parts = Array.from({ length: 12 }, (_, i) => annualPlanInstallment("100.00", "10", 12, i));
 assert.equal(parts.reduce((sum, p) => sum + Math.round(Number(p.grossAmount)*100), 0), 10000);
 assert.equal(parts.reduce((sum, p) => sum + Math.round(Number(p.netAmount)*100), 0), 9000);
 assert.equal(annualPlanInstallment("120000", "0", 12).netAmount, "10000.00");
});
test("respeta mes inicial, fin y cruce de año", () => {
 assert.equal(annualPlanInstallmentIndex(2, 3, 10), null);
 assert.equal(annualPlanInstallmentIndex(3, 3, 10), 0);
 assert.equal(annualPlanInstallmentIndex(12, 3, 10), 9);
 assert.equal(annualPlanInstallmentIndex(1, 3, 10), null);
 assert.equal(annualPlanInstallmentIndex(1, 11, 4), 2);
 assert.equal(annualPlanInstallmentIndex(3, 11, 4), null);
 assert.throws(() => annualPlanInstallment("100", "0", 13));
});
test("no emite cargos fuera de los meses del plan", async () => {
 let payload;
 const prisma = {
 family: { findMany: async () => [{ id: "family", students: [{ firstName: "Ana", lastName: "A", plan: { name: "Anual", annualFee: new Prisma.Decimal(1200), discountPercent: new Prisma.Decimal(0), installmentCount: 10, startMonth: 3 } }] }] },
 familyAccountEntry: { createMany: async args => { payload = args; return { count: args.data.length }; } }
 };
 await createMonthlyFamilyCharges(prisma, new Date(), new Date("2026-02-01T00:00:00Z"), "febrero");
 assert.deepEqual(payload.data, []);
 await createMonthlyFamilyCharges(prisma, new Date(), new Date("2026-03-01T00:00:00Z"), "marzo");
 assert.equal(payload.data[0].amount.toFixed(2), "120.00");
 assert.equal(payload.skipDuplicates, true);
});
