import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

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
  const plan = await prisma.plan.create({ data: { name: `Test plan ${suffix}`, monthlyFee: 100 } });
  planId = plan.id;
  const family = await prisma.family.create({ data: { name: `Test family ${suffix}`, planId } });
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