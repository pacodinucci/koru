"use server";

import { AccountEntryType, PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { createReceiptForPayment } from "@/modules/families/server/receipt.service";
import { calculateFamilyBalance, canWaiveFamilyBalance } from "@/modules/families/lib/family-account-policy";

const paymentSchema = z.object({ familyId: z.string().min(1), amount: z.coerce.number().positive(), method: z.nativeEnum(PaymentMethod), reference: z.string().trim().max(160).optional() });
const voidPaymentSchema = z.object({ paymentId: z.string().min(1), reason: z.string().trim().min(2).max(300) });
const waiverSchema = z.object({ familyId: z.string().min(1), amount: z.coerce.number().positive(), reason: z.string().trim().min(2).max(300) });

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function registerFamilyPaymentAction(formData: FormData) {
  const admin = await requireAdmin();
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


export async function voidFamilyPaymentAction(formData: FormData) {
  const admin = await requireAdmin();
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
  const admin = await requireAdmin();
  if (admin.role !== "SUPERADMIN") return { ok: false, message: "No tenés permisos para condonar saldo." };

  const parsed = waiverSchema.safeParse({ familyId: field(formData, "familyId"), amount: field(formData, "amount"), reason: field(formData, "reason") });
  if (!parsed.success) return { ok: false, message: "Revisá el importe y el motivo de la condonación." };

  const balance = await prisma.familyAccountEntry.aggregate({ where: { familyId: parsed.data.familyId }, _sum: { amount: true } });
  const outstanding = calculateFamilyBalance([{ amount: balance._sum.amount ?? 0 }]);
  if (!canWaiveFamilyBalance({ role: admin.role, outstanding, amount: parsed.data.amount })) return { ok: false, message: "La condonación no puede superar el saldo pendiente." };

  await prisma.familyAccountEntry.create({ data: { familyId: parsed.data.familyId, type: AccountEntryType.BALANCE_WAIVER, amount: -parsed.data.amount, description: `Condonación: ${parsed.data.reason}`, createdById: admin.id } });
  revalidatePath("/dashboard/families");
  return { ok: true, message: "Saldo condonado." };
}