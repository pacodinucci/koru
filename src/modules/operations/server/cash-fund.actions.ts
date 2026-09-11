"use server";

import { CashExpenseReportStatus, CashFundEntryType, CashFundRenewalFrequency, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { IMAGE_UPLOAD_ACCEPTED_TYPES, IMAGE_UPLOAD_MAX_SIZE_BYTES } from "@/modules/media/config/image-upload";
import { destroyCloudinaryImages, uploadImageToCloudinary } from "@/modules/media/server/cloudinary-images";
import { requireOperationsOperator, requireOperationsSuperAdmin, requireOperationsTeacher } from "@/modules/operations/server/operations-access";
import { sendOperationDecisionEmail } from "@/modules/mailing/server/mailing.service";

const reportSchema = z.object({ groupId: z.string().min(1), categoryId: z.string().min(1), amount: z.coerce.number().positive(), concept: z.string().trim().min(2).max(160), justification: z.string().trim().min(2).max(1000), expenseDate: z.coerce.date() });
const decisionSchema = z.object({ reportId: z.string().min(1), approvedAmount: z.coerce.number().nonnegative(), reason: z.string().trim().max(500).optional() });
const groupAmountSchema = z.object({ groupId: z.string().min(1), amount: z.coerce.number().positive(), description: z.string().trim().min(2).max(300) });
const groupBudgetSchema = z.object({ groupId: z.string().min(1), amountPerPeriod: z.coerce.number().positive() });
const debitSchema = z.object({ groupId: z.string().min(1), amount: z.coerce.number().positive(), description: z.string().trim().max(300) });
const renewalSchema = z.object({ renewalFrequency: z.nativeEnum(CashFundRenewalFrequency) });
const value = (formData: FormData, name: string) => formData.get(name) ?? "";

async function requireTeacherGroup(teacherId: string, groupId: string) {
  const responsibility = await prisma.studentGroupTeacher.findUnique({ where: { groupId_teacherId: { groupId, teacherId } }, select: { groupId: true } });
  if (!responsibility) throw new Error("No tenés acceso a este grupo.");
}

async function getGroupBalance(tx: Prisma.TransactionClient, groupId: string) {
  const balance = await tx.cashFundEntry.aggregate({ where: { groupId }, _sum: { amount: true } });
  return Number(balance._sum.amount?.toString() ?? 0);
}

export async function submitCashExpenseReportAction(formData: FormData) {
  const { teacher } = await requireOperationsTeacher("cash-fund.view");
  const parsed = reportSchema.safeParse({ groupId: value(formData, "groupId"), categoryId: value(formData, "categoryId"), amount: value(formData, "amount"), concept: value(formData, "concept"), justification: value(formData, "justification"), expenseDate: value(formData, "expenseDate") });
  if (!parsed.success) return { ok: false, message: "Revisá los datos de la rendición." };
  await requireTeacherGroup(teacher.id, parsed.data.groupId);
  await prisma.cashExpenseReport.create({ data: { teacherId: teacher.id, groupId: parsed.data.groupId, categoryId: parsed.data.categoryId, requestedAmount: parsed.data.amount, concept: parsed.data.concept, justification: parsed.data.justification, expenseDate: parsed.data.expenseDate } });
  revalidatePath("/dashboard/caja-chica");
  return { ok: true, message: "Rendición enviada." };
}

export async function decideCashExpenseReportAction(formData: FormData) {
  const operator = await requireOperationsOperator("cash-fund.operate");
  const parsed = decisionSchema.safeParse({ reportId: value(formData, "reportId"), approvedAmount: value(formData, "approvedAmount"), reason: value(formData, "reason") || undefined });
  if (!parsed.success) return { ok: false, message: "Revisá la decisión." };
  const result = await prisma.$transaction(async (tx) => {
    const report = await tx.cashExpenseReport.findUnique({ where: { id: parsed.data.reportId } });
    if (!report || report.status !== CashExpenseReportStatus.PENDING) return null;
    if (!report.groupId) throw new Error("La rendición pertenece al historial anterior y no puede resolverse en la caja por grupo.");
    if (parsed.data.approvedAmount > Number(report.requestedAmount)) throw new Error("El monto aprobado no puede superar lo solicitado.");
    const status = parsed.data.approvedAmount === 0 ? CashExpenseReportStatus.REJECTED : parsed.data.approvedAmount === Number(report.requestedAmount) ? CashExpenseReportStatus.APPROVED : CashExpenseReportStatus.PARTIALLY_APPROVED;
    if (status !== CashExpenseReportStatus.APPROVED && !parsed.data.reason) throw new Error("Indicá el motivo de la diferencia.");
    if (parsed.data.approvedAmount > await getGroupBalance(tx, report.groupId)) throw new Error("El saldo disponible del grupo no alcanza para aprobar esta rendición.");
    await tx.cashExpenseReport.update({ where: { id: report.id }, data: { status, approvedAmount: parsed.data.approvedAmount, decisionReason: parsed.data.reason, rejectionReason: status === CashExpenseReportStatus.REJECTED ? parsed.data.reason : null, decidedAt: new Date(), decidedById: operator.id } });
    if (parsed.data.approvedAmount > 0) await tx.cashFundEntry.create({ data: { groupId: report.groupId, type: CashFundEntryType.EXPENSE_APPROVAL, amount: -parsed.data.approvedAmount, description: `Rendición aprobada: ${report.concept}`, reportId: report.id, createdById: operator.id } });
    return status;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  if (!result) return { ok: false, message: "La rendición ya fue resuelta." };
  const notification = await prisma.cashExpenseReport.findUnique({ where: { id: parsed.data.reportId }, include: { teacher: { include: { user: { select: { email: true, name: true } } } } } });
  if (notification?.teacher.user) await sendOperationDecisionEmail({ email: notification.teacher.user.email, recipientName: notification.teacher.user.name, title: "rendición", status: result, detail: `${notification.concept} · solicitado $${Number(notification.requestedAmount).toFixed(2)} · aprobado $${parsed.data.approvedAmount.toFixed(2)}`, reason: parsed.data.reason, idempotencyKey: `cash-expense-decision-${notification.id}-${result}` });
  revalidatePath("/dashboard/caja-chica");
  return { ok: true, message: "Rendición resuelta." };
}

export async function createExtraCashFundAllocationAction(formData: FormData) {
  const admin = await requireOperationsOperator("cash-fund.operate");
  const parsed = groupAmountSchema.safeParse({ groupId: value(formData, "groupId"), amount: value(formData, "amount"), description: value(formData, "description") });
  if (!parsed.success) return { ok: false, message: "Revisá la acreditación." };
  await prisma.cashFundEntry.create({ data: { groupId: parsed.data.groupId, type: CashFundEntryType.EXTRA_ALLOCATION, amount: parsed.data.amount, description: parsed.data.description, createdById: admin.id } });
  revalidatePath("/dashboard/caja-chica");
  return { ok: true, message: "Acreditación extraordinaria registrada." };
}

export async function createCashFundAdminDebitAction(formData: FormData) {
  const admin = await requireOperationsOperator("cash-fund.operate");
  const parsed = debitSchema.safeParse({ groupId: value(formData, "groupId"), amount: value(formData, "amount"), description: value(formData, "description") });
  if (!parsed.success) return { ok: false, message: "Revisá el débito." };
  const file = formData.get("receiptImage");
  const receiptImage = file instanceof File && file.size > 0 ? file : null;
  if (!parsed.data.description && !receiptImage) return { ok: false, message: "Ingresá una descripción o adjuntá una imagen como comprobante." };
  if (receiptImage && (receiptImage.size > IMAGE_UPLOAD_MAX_SIZE_BYTES || !IMAGE_UPLOAD_ACCEPTED_TYPES.includes(receiptImage.type as never))) return { ok: false, message: "Adjuntá una imagen JPG, PNG, WebP o AVIF de hasta 10 MB." };
  let uploaded: { url: string; publicId: string } | null = null;
  try { if (receiptImage) uploaded = await uploadImageToCloudinary(Buffer.from(await receiptImage.arrayBuffer()), "CASH_FUND"); } catch { return { ok: false, message: "No pudimos subir la imagen del comprobante." }; }
  const created = await prisma.$transaction(async (tx) => {
    if (parsed.data.amount > await getGroupBalance(tx, parsed.data.groupId)) return false;
    await tx.cashFundEntry.create({ data: { groupId: parsed.data.groupId, type: CashFundEntryType.ADMIN_DEBIT, amount: -parsed.data.amount, description: parsed.data.description || `Comprobante adjunto: ${receiptImage?.name ?? "imagen"}`, receiptImageUrl: uploaded?.url, receiptImagePublicId: uploaded?.publicId, createdById: admin.id } });
    return true;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  if (!created) { if (uploaded) await destroyCloudinaryImages([uploaded.publicId]); return { ok: false, message: "El débito supera el saldo disponible del grupo." }; }
  revalidatePath("/dashboard/caja-chica");
  return { ok: true, message: "Débito administrativo registrado." };
}

export async function reverseCashFundEntryAction(entryId: string) {
  const admin = await requireOperationsOperator("cash-fund.operate");
  const entry = await prisma.cashFundEntry.findUnique({ where: { id: entryId } });
  if (!entry?.groupId) return { ok: false, message: "Solo se pueden revertir movimientos de la caja por grupo." };
  const reversed = await prisma.cashFundEntry.findUnique({ where: { reversesId: entryId } });
  if (reversed) return { ok: false, message: "El movimiento ya fue revertido." };
  await prisma.cashFundEntry.create({ data: { groupId: entry.groupId, type: CashFundEntryType.REVERSAL, amount: -Number(entry.amount), description: `Reversión de ${entry.id}`, createdById: admin.id, reversesId: entry.id } });
  revalidatePath("/dashboard/caja-chica");
  return { ok: true, message: "Movimiento revertido." };
}

export async function setCashFundGroupBudgetAction(formData: FormData) {
  await requireOperationsSuperAdmin("cash-fund.configure");
  const parsed = groupBudgetSchema.safeParse({ groupId: value(formData, "groupId"), amountPerPeriod: value(formData, "amountPerPeriod") });
  if (!parsed.success) return { ok: false, message: "Revisá el presupuesto del grupo." };
  await prisma.cashFundGroupBudget.upsert({ where: { groupId: parsed.data.groupId }, create: { groupId: parsed.data.groupId, amountPerPeriod: parsed.data.amountPerPeriod, effectiveFrom: new Date() }, update: { amountPerPeriod: parsed.data.amountPerPeriod, effectiveFrom: new Date() } });
  revalidatePath("/dashboard/caja-chica");
  return { ok: true, message: "Presupuesto del grupo actualizado." };
}

export async function setCashFundRenewalFrequencyAction(formData: FormData) {
  await requireOperationsSuperAdmin("cash-fund.configure");
  const parsed = renewalSchema.safeParse({ renewalFrequency: value(formData, "renewalFrequency") });
  if (!parsed.success) return { ok: false, message: "Indicá una frecuencia válida." };
  await prisma.cashFundSettings.upsert({ where: { id: "default" }, create: { id: "default", defaultMonthlyAmount: 0, renewalFrequency: parsed.data.renewalFrequency }, update: { renewalFrequency: parsed.data.renewalFrequency } });
  revalidatePath("/dashboard/caja-chica");
  return { ok: true, message: "Frecuencia de renovación actualizada." };
}

export async function cancelCashExpenseReportAction(reportId: string) {
  const { teacher } = await requireOperationsTeacher("cash-fund.view");
  const result = await prisma.cashExpenseReport.updateMany({ where: { id: reportId, teacherId: teacher.id, status: CashExpenseReportStatus.PENDING, groupId: { not: null } }, data: { status: CashExpenseReportStatus.CANCELED, canceledAt: new Date() } });
  if (result.count === 0) return { ok: false, message: "La rendición no puede cancelarse." };
  revalidatePath("/dashboard/caja-chica");
  return { ok: true, message: "Rendición cancelada." };
}


