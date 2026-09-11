"use server";

import { FamilyStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/modules/auth/server/auth-guards";
import { prisma } from "@/lib/prisma";
import { getFamilyDetailForAdmin } from "@/modules/families/server/families.repository";

const familySchema = z.object({ name: z.string().trim().min(2).max(120) });
const eventualItemDraftSchema = z.object({ name: z.string().trim().min(2).max(120), suggestedAmount: z.coerce.number().positive() });
const planSchema = z.object({ name: z.string().trim().min(2).max(120), basicMonthlyFee: z.coerce.number().positive(), eventualItems: z.array(eventualItemDraftSchema).max(30) }).superRefine((plan, context) => {
  const names = new Set<string>();
  plan.eventualItems.forEach((item, index) => {
    const key = item.name.toLocaleLowerCase("es-AR");
    if (names.has(key)) context.addIssue({ code: "custom", message: "Los rubros deben tener nombres distintos.", path: ["eventualItems", index, "name"] });
    names.add(key);
  });
});
const updatePlanSchema = z.object({ planId: z.string().min(1), name: z.string().trim().min(2).max(120), basicMonthlyFee: z.coerce.number().positive(), isActive: z.enum(["true", "false"]) });
const eventualChargeItemSchema = z.object({ planId: z.string().min(1), name: z.string().trim().min(2).max(120), suggestedAmount: z.coerce.number().positive() });
const updateEventualChargeItemSchema = eventualChargeItemSchema.extend({ itemId: z.string().min(1), isActive: z.enum(["true", "false"]) });
const planAssignmentSchema = z.object({ familyId: z.string().min(1), planId: z.string().min(1) });
const statusSchema = z.object({ familyId: z.string().min(1), status: z.nativeEnum(FamilyStatus) });
const membershipSchema = z.object({ familyId: z.string().min(1), memberId: z.string().min(1) });
const familyIdSchema = z.string().min(1);

function value(formData: FormData, key: string) {
  const candidate = formData.get(key);
  return typeof candidate === "string" ? candidate : "";
}

export async function createFamilyAction(formData: FormData) {
  await requirePermission("families.manage");
  const parsed = familySchema.safeParse({ name: value(formData, "name") });
  if (!parsed.success) return;
  await prisma.family.create({ data: { name: parsed.data.name } });
  revalidatePath("/dashboard/families");
}

export async function createPlanAction(formData: FormData) {
  await requirePermission("families.manage");
  let eventualItems: unknown;
  try { eventualItems = JSON.parse(value(formData, "eventualItems") || "[]"); } catch { return; }
  const parsed = planSchema.safeParse({ name: value(formData, "name"), basicMonthlyFee: value(formData, "basicMonthlyFee"), eventualItems });
  if (!parsed.success) return;
  await prisma.plan.create({ data: { name: parsed.data.name, basicMonthlyFee: parsed.data.basicMonthlyFee, eventualChargeItems: { create: parsed.data.eventualItems } } });
  revalidatePath("/dashboard/families");
  revalidatePath("/dashboard/families/plans");
}
export async function updatePlanAction(formData: FormData) {
  await requirePermission("families.manage");
  const parsed = updatePlanSchema.safeParse({ planId: value(formData, "planId"), name: value(formData, "name"), basicMonthlyFee: value(formData, "basicMonthlyFee"), isActive: value(formData, "isActive") });
  if (!parsed.success) return;
  await prisma.plan.update({ where: { id: parsed.data.planId }, data: { name: parsed.data.name, basicMonthlyFee: parsed.data.basicMonthlyFee, isActive: parsed.data.isActive === "true" } });
  revalidatePath("/dashboard/families");
  revalidatePath("/dashboard/families/plans");
}

export async function createPlanEventualChargeItemAction(formData: FormData) {
  await requirePermission("families.manage");
  const parsed = eventualChargeItemSchema.safeParse({ planId: value(formData, "planId"), name: value(formData, "name"), suggestedAmount: value(formData, "suggestedAmount") });
  if (!parsed.success) return;
  await prisma.planEventualChargeItem.create({ data: parsed.data });
  revalidatePath("/dashboard/families/plans");
}

export async function updatePlanEventualChargeItemAction(formData: FormData) {
  await requirePermission("families.manage");
  const parsed = updateEventualChargeItemSchema.safeParse({ itemId: value(formData, "itemId"), planId: value(formData, "planId"), name: value(formData, "name"), suggestedAmount: value(formData, "suggestedAmount"), isActive: value(formData, "isActive") });
  if (!parsed.success) return;
  const item = await prisma.planEventualChargeItem.findUnique({ where: { id: parsed.data.itemId }, select: { planId: true } });
  if (!item || item.planId !== parsed.data.planId) return;
  await prisma.planEventualChargeItem.update({ where: { id: parsed.data.itemId }, data: { name: parsed.data.name, suggestedAmount: parsed.data.suggestedAmount, isActive: parsed.data.isActive === "true" } });
  revalidatePath("/dashboard/families/plans");
}
export async function assignPlanToFamilyAction(formData: FormData) {
  await requirePermission("families.manage");
  const parsed = planAssignmentSchema.safeParse({ familyId: value(formData, "familyId"), planId: value(formData, "planId") });
  if (!parsed.success) return;
  await prisma.family.update({ where: { id: parsed.data.familyId }, data: { planId: parsed.data.planId } });
  revalidatePath("/dashboard/families");
}

export async function changeFamilyStatusAction(formData: FormData) {
  await requirePermission("families.manage");
  const parsed = statusSchema.safeParse({ familyId: value(formData, "familyId"), status: value(formData, "status") });
  if (!parsed.success) return;
  await prisma.family.update({ where: { id: parsed.data.familyId }, data: { status: parsed.data.status } });
  revalidatePath("/dashboard/families");
}

export async function assignFamilyUserAction(formData: FormData) {
  await requirePermission("families.manage");
  const parsed = membershipSchema.safeParse({ familyId: value(formData, "familyId"), memberId: value(formData, "userId") });
  if (!parsed.success) return;
  await prisma.user.update({ where: { id: parsed.data.memberId }, data: { familyId: parsed.data.familyId } });
  revalidatePath("/dashboard/families");
}

export async function assignFamilyStudentAction(formData: FormData) {
  await requirePermission("families.manage");
  const parsed = membershipSchema.safeParse({ familyId: value(formData, "familyId"), memberId: value(formData, "studentId") });
  if (!parsed.success) return;
  await prisma.student.update({ where: { id: parsed.data.memberId }, data: { familyId: parsed.data.familyId } });
  revalidatePath("/dashboard/families");
}

export async function getFamilyDetailAction(familyId: string) {
  await requirePermission("families.manage");
  const parsed = familyIdSchema.safeParse(familyId);
  if (!parsed.success) return null;

  const family = await getFamilyDetailForAdmin(parsed.data);
  if (!family) return null;

  const balance = family.accountEntries.reduce(
    (total, entry) => total + Number(entry.amount),
    0,
  );

  return {
    id: family.id,
    name: family.name,
    balance: balance.toFixed(2),
    entries: family.accountEntries.map((entry) => ({
      id: entry.id,
      type: entry.type,
      amount: entry.amount.toString(),
      description: entry.description,
      occurredAt: entry.occurredAt.toISOString(),
      payment: entry.payment
        ? {
            id: entry.payment.id,
            method: entry.payment.method,
            reference: entry.payment.reference,
            status: entry.payment.status,
            receipt: entry.payment.receipt
              ? {
                  id: entry.payment.receipt.id,
                  status: entry.payment.receipt.status,
                  pdfUrl: entry.payment.receipt.pdfUrl,
                  number: entry.payment.receipt.number,
                }
              : null,
          }
        : null,
    })),
  };
}
type FamilyImportRowActionInput = {
  rowNumber: number;
  familyName: string;
  motherEmail?: string;
  fatherEmail?: string;
};

function isFamilyImportRow(value: unknown): value is FamilyImportRowActionInput {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.rowNumber === "number"
    && typeof row.familyName === "string"
    && (row.motherEmail === undefined || typeof row.motherEmail === "string")
    && (row.fatherEmail === undefined || typeof row.fatherEmail === "string");
}

export async function previewFamilyImportAction(rows: FamilyImportRowActionInput[]) {
  await requirePermission("families.manage");
  if (!Array.isArray(rows) || !rows.every(isFamilyImportRow)) {
    return { validRows: [], issues: [{ rowNumber: 0, message: "La planilla no tiene un formato válido." }], familiesCount: 0, invitationsCount: 0 };
  }
  const { previewFamilyImport } = await import("@/modules/families/server/family-import.service");
  return previewFamilyImport(rows);
}

export async function confirmFamilyImportAction(rows: FamilyImportRowActionInput[]) {
  const admin = await requirePermission("families.manage");
  if (!Array.isArray(rows) || !rows.every(isFamilyImportRow)) {
    return { status: "error" as const, message: "La planilla no tiene un formato válido." };
  }

  try {
    const { confirmFamilyImport } = await import("@/modules/families/server/family-import.service");
    const result = await confirmFamilyImport(rows, admin.id);
    if (!result.ok) {
      return { status: "error" as const, message: "La información cambió desde la previsualización. Revisá los conflictos y volvé a confirmar.", preview: result.preview };
    }

    const { sendUserInvitationEmail } = await import("@/modules/mailing/server/mailing.service");
    const deliveries = await Promise.allSettled(result.invitations.map((invitation) =>
      sendUserInvitationEmail({
        email: invitation.email,
        role: invitation.role,
        invitationId: invitation.invitationId,
        invitationToken: invitation.token,
        familyName: invitation.familyName,
      }),
    ));
    const failedDeliveries = deliveries.filter((delivery) => delivery.status === "rejected" || (delivery.status === "fulfilled" && delivery.value.status === "failed")).length;
    revalidatePath("/dashboard/families");
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/mailing");
    return {
      status: failedDeliveries ? "warning" as const : "success" as const,
      message: failedDeliveries
        ? `Se crearon ${result.familiesCount} familias. ${failedDeliveries} invitaciones no pudieron enviarse; podés reenviarlas desde Usuarios.`
        : `Se crearon ${result.familiesCount} familias y se enviaron ${result.invitations.length} invitaciones.`,
    };
  } catch {
    return { status: "error" as const, message: "No pudimos confirmar la importación. Revisá la planilla e intentá nuevamente." };
  }
}
