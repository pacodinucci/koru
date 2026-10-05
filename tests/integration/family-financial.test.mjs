import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { createMonthlyFamilyCharges } from "../../src/modules/families/server/monthly-family-charge.core.ts";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const suffix = randomUUID();
let familyId;
let planId;

async function cleanup() {
  if (familyId) {
    await prisma.paymentReceipt.deleteMany({ where: { payment: { familyId } } });
    await prisma.familyAccountEntry.deleteMany({ where: { familyId } });
    await prisma.familyPayment.deleteMany({ where: { familyId } });
    await prisma.family.delete({ where: { id: familyId } });
  }
  if (planId) await prisma.plan.delete({ where: { id: planId } });
}

test.after(async () => { await cleanup(); await prisma.$disconnect(); await pool.end(); });

test("la cuenta familiar persiste pagos, reversas y recibos anulados", async () => {
  const plan = await prisma.plan.create({ data: { name: `Test plan ${suffix}`, basicMonthlyFee: 100 } });
  planId = plan.id;
  const family = await prisma.family.create({ data: { name: `Test family ${suffix}` } });
  familyId = family.id;

  await prisma.familyAccountEntry.create({ data: { familyId, type: "MONTHLY_CHARGE", amount: 100, description: "Cargo de prueba" } });
  const payment = await prisma.familyPayment.create({ data: { familyId, amount: 40, method: "BANK_TRANSFER", createdById: `test-${suffix}` } });
  await prisma.familyAccountEntry.create({ data: { familyId, type: "PAYMENT", amount: -40, description: "Pago de prueba", paymentId: payment.id } });
  const receipt = await prisma.paymentReceipt.create({ data: { paymentId: payment.id, number: Math.floor(Math.random() * 900000) + 100000 } });

  await prisma.$transaction([
    prisma.familyPayment.update({ where: { id: payment.id }, data: { status: "VOIDED", voidedAt: new Date(), voidReason: "Prueba" } }),
    prisma.paymentReceipt.update({ where: { id: receipt.id }, data: { status: "VOIDED" } }),
    prisma.familyAccountEntry.create({ data: { familyId, type: "PAYMENT_REVERSAL", amount: 40, description: "Reversa de prueba" } }),
  ]);

  const entries = await prisma.familyAccountEntry.findMany({ where: { familyId }, select: { amount: true } });
  const persistedReceipt = await prisma.paymentReceipt.findUniqueOrThrow({ where: { id: receipt.id } });
  assert.equal(entries.reduce((total, entry) => total + Number(entry.amount), 0), 100);
  assert.equal(persistedReceipt.status, "VOIDED");
});

test("la cuota familiar suma los planes activos de sus alumnos en un único cargo", async () => {
  const token = randomUUID();
  const plans = await Promise.all([
    prisma.plan.create({ data: { name: `Plan A ${token}`, basicMonthlyFee: "100.10" } }),
    prisma.plan.create({ data: { name: `Plan B ${token}`, basicMonthlyFee: "200.20" } }),
    prisma.plan.create({ data: { name: `Plan inactivo ${token}`, basicMonthlyFee: "999.00", isActive: false } }),
  ]);
  const group = await prisma.studentGroup.create({ data: { name: `Grupo ${token}`, slug: `grupo-${token}`, ageRange: "Prueba" } });
  const family = await prisma.family.create({ data: { name: `Familia cuotas ${token}` } });

  try {
    await prisma.student.createMany({ data: plans.map((plan, index) => ({
      firstName: `Alumno ${index + 1}`,
      lastName: "Prueba",
      birthDate: new Date("2020-01-01T00:00:00.000Z"),
      groupId: group.id,
      familyId: family.id,
      planId: plan.id,
    })) });

    const now = new Date("2026-10-05T12:00:00.000Z");
    const period = new Date("2026-10-01T00:00:00.000Z");
    await createMonthlyFamilyCharges(prisma, now, period, "octubre de 2026");
    await createMonthlyFamilyCharges(prisma, now, period, "octubre de 2026");
    const entries = await prisma.familyAccountEntry.findMany({ where: { familyId: family.id, billingPeriod: period, type: "MONTHLY_CHARGE" } });

    assert.equal(entries.length, 1);
    assert.equal(entries[0].amount.toString(), "300.3");
    assert.match(entries[0].description, /Plan A/);
    assert.match(entries[0].description, /Plan B/);
    assert.doesNotMatch(entries[0].description, /Plan inactivo/);
  } finally {
    await prisma.familyAccountEntry.deleteMany({ where: { familyId: family.id } });
    await prisma.student.deleteMany({ where: { familyId: family.id } });
    await prisma.family.delete({ where: { id: family.id } });
    await prisma.studentGroup.delete({ where: { id: group.id } });
    await prisma.plan.deleteMany({ where: { id: { in: plans.map((plan) => plan.id) } } });
  }
});
