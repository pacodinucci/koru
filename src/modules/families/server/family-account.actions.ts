"use server";

import { AccountEntryType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/modules/auth/server/auth-guards";
import { createFamilyPaymentService } from "@/modules/families/server/payment-allocation.service";
import { createReceiptForPayment } from "@/modules/families/server/receipt.service";

const eventualChargeSchema = z.object({ familyId: z.string().min(1), eventualChargeItemId: z.string().min(1).optional(), description: z.string().trim().min(2).max(300), amount: z.coerce.number().nonnegative() });
const payments = createFamilyPaymentService(prisma);

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function revalidateFamily(familyId: string) {
  revalidatePath("/dashboard/families");
  revalidatePath(`/dashboard/families/${familyId}`);
}

export async function registerFamilyPaymentAction(formData: FormData) {
  const admin = await requirePermission("families.payments");
  const result = await payments.register({
    familyId: field(formData, "familyId"), amount: field(formData, "amount"), method: field(formData, "method"),
    reference: field(formData, "reference") || undefined, paidAt: field(formData, "paidAt"), allocations: field(formData, "allocations"),
  }, admin.id);
  if (!result.ok) return result;

  try {
    await createReceiptForPayment(result.paymentId!);
  } catch {
    // Payment remains registered even if its receipt must be regenerated later.
  }
  revalidateFamily(result.familyId);
  return { ok: true, message: result.message };
}

export async function reconcileFamilyCreditAction(formData: FormData) {
  const admin = await requirePermission("families.payments");
  const result = await payments.reconcile({
    familyId: field(formData, "familyId"), creditEntryId: field(formData, "creditEntryId"), allocations: field(formData, "allocations"),
  }, admin.id, () => requirePermission("families.waive-balance"));
  if (result.ok) revalidateFamily(result.familyId);
  return { ok: result.ok, message: result.message };
}

export async function registerFamilyEventualChargeAction(formData: FormData) {
  const admin = await requirePermission("families.payments");
  const parsed = eventualChargeSchema.safeParse({ familyId: field(formData, "familyId"), eventualChargeItemId: field(formData, "eventualChargeItemId") || undefined, description: field(formData, "description"), amount: field(formData, "amount") });
  if (!parsed.success) return { ok: false, message: "Revisá el concepto y el importe del cargo." };

  const family = await prisma.family.findUnique({ where: { id: parsed.data.familyId }, select: { students: { select: { planId: true } } } });
  if (!family) return { ok: false, message: "No encontramos la familia." };

  if (parsed.data.eventualChargeItemId) {
    return { ok: false, message: "Los rubros se cobran por alumno desde su plan. Revisá y confirmá los cargos en Cargos por alumno; no los apliques nuevamente como cargo familiar." };
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
  revalidateFamily(parsed.data.familyId);
  return { ok: true, message: "Cargo eventual registrado." };
}

export async function voidFamilyPaymentAction(formData: FormData) {
  const admin = await requirePermission("families.payments");
  const result = await payments.voidPayment({ paymentId: field(formData, "paymentId"), reason: field(formData, "reason") }, admin.id);
  if (result.ok) revalidateFamily(result.familyId);
  return { ok: result.ok, message: result.message };
}

export async function waiveFamilyBalanceAction(formData: FormData) {
  const admin = await requirePermission("families.waive-balance");
  const result = await payments.waive({ familyId: field(formData, "familyId"), amount: field(formData, "amount"), reason: field(formData, "reason") }, admin.id);
  if (result.ok) revalidateFamily(result.familyId);
  return { ok: result.ok, message: result.message };
}
