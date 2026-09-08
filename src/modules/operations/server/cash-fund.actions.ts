"use server";

import { CashExpenseReportStatus, CashFundEntryType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireOperationsOperator, requireOperationsSuperAdmin, requireOperationsTeacher } from "@/modules/operations/server/operations-access";
import { sendOperationDecisionEmail } from "@/modules/mailing/server/mailing.service";

const reportSchema = z.object({ categoryId: z.string().min(1), amount: z.coerce.number().positive(), concept: z.string().trim().min(2).max(160), justification: z.string().trim().min(2).max(1000), expenseDate: z.coerce.date() });
const decisionSchema = z.object({ reportId: z.string().min(1), approvedAmount: z.coerce.number().nonnegative(), reason: z.string().trim().max(500).optional() });

const value = (formData: FormData, name: string) => formData.get(name) ?? "";

export async function submitCashExpenseReportAction(formData: FormData) {
  const { teacher } = await requireOperationsTeacher();
  const parsed = reportSchema.safeParse({ categoryId: value(formData, "categoryId"), amount: value(formData, "amount"), concept: value(formData, "concept"), justification: value(formData, "justification"), expenseDate: value(formData, "expenseDate") });
  if (!parsed.success) return { ok: false, message: "Revisá los datos de la rendición." };

  await prisma.cashExpenseReport.create({ data: { teacherId: teacher.id, categoryId: parsed.data.categoryId, requestedAmount: parsed.data.amount, concept: parsed.data.concept, justification: parsed.data.justification, expenseDate: parsed.data.expenseDate } });
  revalidatePath("/dashboard");
  return { ok: true, message: "Rendición enviada." };
}

export async function decideCashExpenseReportAction(formData: FormData) {
  const operator = await requireOperationsOperator();
  const parsed = decisionSchema.safeParse({ reportId: value(formData, "reportId"), approvedAmount: value(formData, "approvedAmount"), reason: value(formData, "reason") || undefined });
  if (!parsed.success) return { ok: false, message: "Revisá la decisión." };

  const result = await prisma.$transaction(async (tx) => {
    const report = await tx.cashExpenseReport.findUnique({ where: { id: parsed.data.reportId } });
    if (!report || report.status !== CashExpenseReportStatus.PENDING) return null;
    if (parsed.data.approvedAmount > Number(report.requestedAmount)) throw new Error("El monto aprobado no puede superar lo solicitado.");
    const status = parsed.data.approvedAmount === 0 ? CashExpenseReportStatus.REJECTED : parsed.data.approvedAmount === Number(report.requestedAmount) ? CashExpenseReportStatus.APPROVED : CashExpenseReportStatus.PARTIALLY_APPROVED;
    if (status !== CashExpenseReportStatus.APPROVED && !parsed.data.reason) throw new Error("Indicá el motivo de la diferencia.");
    await tx.cashExpenseReport.update({ where: { id: report.id }, data: { status, approvedAmount: parsed.data.approvedAmount, decisionReason: parsed.data.reason, rejectionReason: status === CashExpenseReportStatus.REJECTED ? parsed.data.reason : null, decidedAt: new Date(), decidedById: operator.id } });
    if (parsed.data.approvedAmount > 0) await tx.cashFundEntry.create({ data: { teacherId: report.teacherId, type: CashFundEntryType.EXPENSE_APPROVAL, amount: -parsed.data.approvedAmount, description: `Rendición aprobada: ${report.concept}`, reportId: report.id, createdById: operator.id } });
    return status;
  });
  if (!result) return { ok: false, message: "La rendición ya fue resuelta." };
  const notification = await prisma.cashExpenseReport.findUnique({ where: { id: parsed.data.reportId }, include: { teacher: { include: { user: { select: { email: true, name: true } } } } } });
  if (notification?.teacher.user) await sendOperationDecisionEmail({ email: notification.teacher.user.email, recipientName: notification.teacher.user.name, title: "rendición", status: result, detail: `${notification.concept} · solicitado $${Number(notification.requestedAmount).toFixed(2)} · aprobado $${parsed.data.approvedAmount.toFixed(2)}`, reason: parsed.data.reason, idempotencyKey: `cash-expense-decision-${notification.id}-${result}` });
  revalidatePath("/dashboard");
  return { ok: true, message: "Rendición resuelta." };
}

const categorySchema = z.object({ name: z.string().trim().min(2).max(80) });

export async function createCashFundCategoryAction(formData: FormData) {
  await requireOperationsSuperAdmin();
  const parsed = categorySchema.safeParse({ name: value(formData, "name") });
  if (!parsed.success) return { ok: false, message: "Indicá una categoría válida." };
  try { await prisma.cashFundCategory.create({ data: parsed.data }); } catch { return { ok: false, message: "La categoría ya existe." }; }
  revalidatePath("/dashboard");
  return { ok: true, message: "Categoría creada." };
}

const monthlyAmountSchema = z.object({ amount: z.coerce.number().positive() });

export async function setDefaultCashFundMonthlyAmountAction(formData: FormData) {
  await requireOperationsSuperAdmin();
  const parsed = monthlyAmountSchema.safeParse({ amount: value(formData, "amount") });
  if (!parsed.success) return { ok: false, message: "Indicá un monto mensual válido." };
  await prisma.cashFundSettings.upsert({ where: { id: "default" }, create: { id: "default", defaultMonthlyAmount: parsed.data.amount }, update: { defaultMonthlyAmount: parsed.data.amount } });
  revalidatePath("/dashboard");
  return { ok: true, message: "Monto mensual actualizado para futuras acreditaciones." };
}

const allocationSchema = z.object({ teacherId: z.string().min(1), amount: z.coerce.number().positive(), description: z.string().trim().min(2).max(300) });

export async function createExtraCashFundAllocationAction(formData: FormData) {
  const admin = await requireOperationsSuperAdmin();
  const parsed = allocationSchema.safeParse({ teacherId: value(formData, "teacherId"), amount: value(formData, "amount"), description: value(formData, "description") });
  if (!parsed.success) return { ok: false, message: "Revisá la asignación." };
  await prisma.cashFundEntry.create({ data: { teacherId: parsed.data.teacherId, type: CashFundEntryType.EXTRA_ALLOCATION, amount: parsed.data.amount, description: parsed.data.description, createdById: admin.id } });
  revalidatePath("/dashboard");
  return { ok: true, message: "Asignación extraordinaria registrada." };
}

export async function reverseCashFundEntryAction(entryId: string) {
  const admin = await requireOperationsOperator();
  const entry = await prisma.cashFundEntry.findUnique({ where: { id: entryId } });
  if (!entry) return { ok: false, message: "Movimiento inexistente." };
  const reversed = await prisma.cashFundEntry.findUnique({ where: { reversesId: entryId } });
  if (reversed) return { ok: false, message: "El movimiento ya fue revertido." };
  await prisma.cashFundEntry.create({ data: { teacherId: entry.teacherId, type: CashFundEntryType.REVERSAL, amount: -Number(entry.amount), description: `Reversión de ${entry.id}`, createdById: admin.id, reversesId: entry.id } });
  revalidatePath("/dashboard");
  return { ok: true, message: "Movimiento revertido." };
}

export async function createCashFundAdminDebitAction(formData: FormData) {
  const admin = await requireOperationsSuperAdmin();
  const parsed = allocationSchema.safeParse({ teacherId: value(formData, "teacherId"), amount: value(formData, "amount"), description: value(formData, "description") });
  if (!parsed.success) return { ok: false, message: "Revisá el débito." };
  await prisma.cashFundEntry.create({ data: { teacherId: parsed.data.teacherId, type: CashFundEntryType.ADMIN_DEBIT, amount: -parsed.data.amount, description: parsed.data.description, createdById: admin.id } });
  revalidatePath("/dashboard");
  return { ok: true, message: "Débito administrativo registrado." };
}

const teacherBudgetSchema = z.object({ teacherId: z.string().min(1), monthlyAmount: z.coerce.number().positive() });

export async function setTeacherCashFundBudgetAction(formData: FormData) {
  await requireOperationsSuperAdmin();
  const parsed = teacherBudgetSchema.safeParse({ teacherId: value(formData, "teacherId"), monthlyAmount: value(formData, "monthlyAmount") });
  if (!parsed.success) return { ok: false, message: "Revisá el presupuesto docente." };
  await prisma.cashFundBudget.upsert({
    where: { teacherId: parsed.data.teacherId },
    create: { teacherId: parsed.data.teacherId, monthlyAmount: parsed.data.monthlyAmount, effectiveFrom: new Date() },
    update: { monthlyAmount: parsed.data.monthlyAmount, effectiveFrom: new Date() },
  });
  revalidatePath("/dashboard/operaciones");
  return { ok: true, message: "Presupuesto mensual actualizado." };
}

export async function cancelCashExpenseReportAction(reportId: string) {
  const { teacher } = await requireOperationsTeacher();
  const result = await prisma.cashExpenseReport.updateMany({ where: { id: reportId, teacherId: teacher.id, status: CashExpenseReportStatus.PENDING }, data: { status: CashExpenseReportStatus.CANCELED, canceledAt: new Date() } });
  if (result.count === 0) return { ok: false, message: "La rendición no puede cancelarse." };
  revalidatePath("/dashboard/operaciones");
  return { ok: true, message: "Rendición cancelada." };
}
