"use server";

import { AccountEntryType, PaymentMethod, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/modules/auth/server/auth-guards";
import { createReceiptForPayment } from "@/modules/families/server/receipt.service";
import { calculateFamilyBalance, canWaiveFamilyBalance } from "@/modules/families/lib/family-account-policy";
import { getBillingPeriod } from "@/modules/families/lib/monthly-billing";
import { eventualInstallmentDescription, splitInstallmentAmounts } from "@/modules/families/lib/eventual-installments";
import { calculatePlanDiscount } from "@/modules/families/lib/plan-discounts";

const paymentSchema = z.object({ familyId: z.string().min(1), amount: z.coerce.number().positive(), method: z.nativeEnum(PaymentMethod), reference: z.string().trim().max(160).optional() });
const eventualChargeSchema = z.object({ familyId: z.string().min(1), eventualChargeItemId: z.string().min(1).optional(), description: z.string().trim().min(2).max(300), amount: z.coerce.number().nonnegative() });
const voidPaymentSchema = z.object({ paymentId: z.string().min(1), reason: z.string().trim().min(2).max(300) });
const waiverSchema = z.object({ familyId: z.string().min(1), amount: z.coerce.number().positive(), reason: z.string().trim().min(2).max(300) });

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function registerFamilyPaymentAction(formData: FormData) {
  const admin = await requirePermission("families.payments");
  const parsed = paymentSchema.safeParse({ familyId: field(formData, "familyId"), amount: field(formData, "amount"), method: field(formData, "method"), reference: field(formData, "reference") || undefined });
  if (!parsed.success) return { ok: false, message: "Revisá los datos del pago." };

  const payment = await prisma.$transaction(async (tx) => {
    const payment = await tx.familyPayment.create({ data: { ...parsed.data, createdById: admin.id } });
    await tx.familyAccountEntry.create({ data: { familyId: payment.familyId, type: AccountEntryType.PAYMENT, amount: -payment.amount, description: "Pago registrado", paymentId: payment.id, createdById: admin.id } });
    return payment;
  });

  try {
    await createReceiptForPayment(payment.id);
  } catch {
    // El pago queda registrado aunque el comprobante deba regenerarse después.
  }

  revalidatePath("/dashboard/families");
  return { ok: true, message: "Pago registrado." };
}


export async function registerFamilyEventualChargeAction(formData: FormData) {
  const admin = await requirePermission("families.payments");
  const parsed = eventualChargeSchema.safeParse({ familyId: field(formData, "familyId"), eventualChargeItemId: field(formData, "eventualChargeItemId") || undefined, description: field(formData, "description"), amount: field(formData, "amount") });
  if (!parsed.success) return { ok: false, message: "Revisá el concepto y el importe del cargo." };

  const family = await prisma.family.findUnique({ where: { id: parsed.data.familyId }, select: { students: { select: { planId: true } } } });
  if (!family) return { ok: false, message: "No encontramos la familia." };

  if (parsed.data.eventualChargeItemId) {
    const planIds = family.students.flatMap((student) => student.planId ? [student.planId] : []);
    if (!planIds.length) return { ok: false, message: "Los alumnos de la familia no tienen planes asignados." };
    const item = await prisma.planEventualChargeItem.findFirst({ where: { id: parsed.data.eventualChargeItemId, planId: { in: planIds }, isActive: true } });
    if (!item) return { ok: false, message: "El rubro seleccionado no está disponible para los planes de esta familia." };
    const discounted = calculatePlanDiscount(item.suggestedAmount.toString(), item.discountPercent.toString());
    let amounts: string[];
    try { amounts = splitInstallmentAmounts(discounted.netAmount, item.installmentCount); }
    catch { return { ok: false, message: "El importe con descuento no alcanza para la cantidad de cuotas." }; }
    const grossAmounts = splitInstallmentAmounts(discounted.grossAmount, item.installmentCount);
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      const schedule = await tx.eventualChargeSchedule.create({ data: {
        familyId: parsed.data.familyId,
        eventualChargeItemId: item.id,
        itemName: item.name,
        totalAmount: discounted.netAmount,
        grossAmount: discounted.grossAmount,
        discountAmount: discounted.discountAmount,
        discountPercent: item.discountPercent,
        installmentCount: item.installmentCount,
        startPeriod: getBillingPeriod(now),
        createdById: admin.id,
      } });
      await tx.familyAccountEntry.create({ data: {
        familyId: parsed.data.familyId,
        type: AccountEntryType.EVENTUAL_CHARGE,
        amount: amounts[0],
        grossAmount: grossAmounts[0],
        discountAmount: new Prisma.Decimal(grossAmounts[0]).minus(amounts[0]),
        description: eventualInstallmentDescription(item.name, 1, item.installmentCount),
        eventualChargeItemId: item.id,
        eventualChargeScheduleId: schedule.id,
        installmentNumber: 1,
        occurredAt: now,
        createdById: admin.id,
      } });
    });
  } else {
    if (parsed.data.amount <= 0) return { ok: false, message: "Ingresá un importe mayor a cero para el cargo libre." };
    await prisma.familyAccountEntry.create({ data: {
      familyId: parsed.data.familyId,
      type: AccountEntryType.EVENTUAL_CHARGE,
      amount: parsed.data.amount,
      description: `Cargo eventual · ${parsed.data.description}`,
      createdById: admin.id,
    } });
  }
  revalidatePath("/dashboard/families");
  revalidatePath(`/dashboard/families/${parsed.data.familyId}`);
  return { ok: true, message: parsed.data.eventualChargeItemId ? "Primera cuota registrada; las restantes se cobrarán mensualmente." : "Cargo eventual registrado." };
}
export async function voidFamilyPaymentAction(formData: FormData) {
  const admin = await requirePermission("families.payments");
  const parsed = voidPaymentSchema.safeParse({ paymentId: field(formData, "paymentId"), reason: field(formData, "reason") });
  if (!parsed.success) return { ok: false, message: "Indicá el motivo de la anulación." };

  await prisma.$transaction(async (tx) => {
    const payment = await tx.familyPayment.findUniqueOrThrow({ where: { id: parsed.data.paymentId } });
    if (payment.status === "VOIDED") return;
    await tx.familyPayment.update({ where: { id: payment.id }, data: { status: "VOIDED", voidedAt: new Date(), voidReason: parsed.data.reason } });
    await tx.paymentReceipt.updateMany({ where: { paymentId: payment.id }, data: { status: "VOIDED" } });
    await tx.familyAccountEntry.create({ data: { familyId: payment.familyId, type: AccountEntryType.PAYMENT_REVERSAL, amount: payment.amount, description: `Anulación de pago: ${parsed.data.reason}`, createdById: admin.id } });
  });

  revalidatePath("/dashboard/families");
  return { ok: true, message: "Pago anulado y saldo revertido." };
}

export async function waiveFamilyBalanceAction(formData: FormData) {
  const admin = await requirePermission("families.waive-balance");

  const parsed = waiverSchema.safeParse({ familyId: field(formData, "familyId"), amount: field(formData, "amount"), reason: field(formData, "reason") });
  if (!parsed.success) return { ok: false, message: "Revisá el importe y el motivo de la condonación." };

  const balance = await prisma.familyAccountEntry.aggregate({ where: { familyId: parsed.data.familyId }, _sum: { amount: true } });
  const outstanding = calculateFamilyBalance([{ amount: balance._sum.amount ?? 0 }]);
  if (!canWaiveFamilyBalance({ outstanding, amount: parsed.data.amount })) return { ok: false, message: "La condonación no puede superar el saldo pendiente." };

  await prisma.familyAccountEntry.create({ data: { familyId: parsed.data.familyId, type: AccountEntryType.BALANCE_WAIVER, amount: -parsed.data.amount, description: `Condonación: ${parsed.data.reason}`, createdById: admin.id } });
  revalidatePath("/dashboard/families");
  return { ok: true, message: "Saldo condonado." };
}
