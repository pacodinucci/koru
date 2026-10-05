"use server";

import { FamilyStatus, InvitationDeliveryJobStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requirePermission } from "@/modules/auth/server/auth-guards";
import { prisma } from "@/lib/prisma";
import { getFamilyDetailForAdmin } from "@/modules/families/server/families.repository";
import { MAX_EVENTUAL_INSTALLMENTS, splitInstallmentAmounts } from "@/modules/families/lib/eventual-installments";
import { calculatePlanDiscount } from "@/modules/families/lib/plan-discounts";
import { runInvitationDeliveryWorker } from "@/modules/mailing/server/invitation-delivery-worker.service";

const familySchema = z.object({
  name: z.string().trim().min(2).max(120),
  primaryEmail: z.email(),
  secondaryEmail: z.email().optional(),
});
export type CreateFamilyState = { status: "idle" | "success" | "warning" | "error"; message: string | null };
const discountPercentSchema = z.coerce.number().min(0).max(100).refine((value) => /^\d+(?:\.\d{1,2})?$/.test(value.toString()));
const eventualItemDraftSchema = z.object({ name: z.string().trim().min(2).max(120), suggestedAmount: z.coerce.number().positive(), discountPercent: discountPercentSchema, installmentCount: z.coerce.number().int().min(1).max(MAX_EVENTUAL_INSTALLMENTS) });
const planSchema = z.object({ name: z.string().trim().min(2).max(120), basicMonthlyFee: z.coerce.number().positive(), discountPercent: discountPercentSchema, eventualItems: z.array(eventualItemDraftSchema).max(30) }).superRefine((plan, context) => {
  const names = new Set<string>();
  plan.eventualItems.forEach((item, index) => {
    const key = item.name.toLocaleLowerCase("es-AR");
    if (names.has(key)) context.addIssue({ code: "custom", message: "Los rubros deben tener nombres distintos.", path: ["eventualItems", index, "name"] });
    names.add(key);
  });
});
const updatePlanSchema = z.object({ planId: z.string().min(1), name: z.string().trim().min(2).max(120), basicMonthlyFee: z.coerce.number().positive(), discountPercent: discountPercentSchema });
const eventualChargeItemSchema = z.object({ planId: z.string().min(1), name: z.string().trim().min(2).max(120), suggestedAmount: z.coerce.number().positive(), discountPercent: discountPercentSchema, installmentCount: z.coerce.number().int().min(1).max(MAX_EVENTUAL_INSTALLMENTS) });
const updateEventualChargeItemSchema = eventualChargeItemSchema.extend({ itemId: z.string().min(1) });
const planAssignmentSchema = z.object({ familyId: z.string().min(1), studentId: z.string().min(1), planId: z.string().min(1) });
const statusSchema = z.object({ familyId: z.string().min(1), status: z.nativeEnum(FamilyStatus) });
const membershipSchema = z.object({ familyId: z.string().min(1), memberId: z.string().min(1) });
const familyIdSchema = z.string().min(1);

function validInstallmentTerms(amount: number, count: number, discountPercent: number) {
  try { splitInstallmentAmounts(amount.toString(), count); splitInstallmentAmounts(calculatePlanDiscount(amount.toString(), discountPercent.toString()).netAmount, count); return true; }
  catch { return false; }
}
function validMonthlyFee(amount: number, discountPercent: number) {
  try { calculatePlanDiscount(amount.toString(), discountPercent.toString()); return true; }
  catch { return false; }
}
function value(formData: FormData, key: string) {
  const candidate = formData.get(key);
  return typeof candidate === "string" ? candidate : "";
}

export async function createFamilyAction(_previousState: CreateFamilyState, formData: FormData): Promise<CreateFamilyState> {
  const admin = await requirePermission("families.manage");
  const parsed = familySchema.safeParse({
    name: value(formData, "name"),
    primaryEmail: value(formData, "primaryEmail").trim().toLowerCase(),
    secondaryEmail: value(formData, "secondaryEmail").trim().toLowerCase() || undefined,
  });
  if (!parsed.success) return { status: "error", message: "Completá el nombre y un email principal válido. El segundo email, si lo ingresás, también debe ser válido." };
  if (parsed.data.primaryEmail === parsed.data.secondaryEmail) {
    return { status: "error", message: "Los dos emails deben ser distintos." };
  }

  let deliveryJobIds: string[];
  try {
    const { confirmFamilyImport } = await import("@/modules/families/server/family-import.service");
    const result = await confirmFamilyImport([{
      rowNumber: 1,
      familyName: parsed.data.name,
      motherEmail: parsed.data.primaryEmail,
      fatherEmail: parsed.data.secondaryEmail,
    }], admin.id, true);
    if (!result.ok) {
      return { status: "error", message: result.preview.issues[0]?.message ?? "Revisá los datos de la familia e intentá nuevamente." };
    }
    deliveryJobIds = result.deliveryJobIds;
  } catch (error) {
    console.error("family_creation_failed", error);
    const code = error instanceof Error ? error.message : "";
    const prismaCode = error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "invitation_token_encryption_key_missing" || code === "invitation_token_encryption_key_invalid") {
      return { status: "error", message: "No se pudieron preparar las invitaciones porque falta una configuración segura de envío. Contactá al administrador." };
    }
    if (code === "family_import_conflict" || prismaCode === "P2034") {
      return { status: "error", message: "La familia o alguno de los emails ya existe. Revisá los datos e intentá nuevamente." };
    }
    return { status: "error", message: "No pudimos crear la familia. Intentá nuevamente." };
  }

  revalidatePath("/dashboard/families");
  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/mailing");

  try {
    await runInvitationDeliveryWorker();
    const jobs = await prisma.invitationDeliveryJob.findMany({
      where: { id: { in: deliveryJobIds } },
      select: { status: true },
    });
    const sentCount = jobs.filter((job) => job.status === InvitationDeliveryJobStatus.SENT).length;
    if (sentCount === deliveryJobIds.length) {
      return { status: "success", message: `Familia creada. El proveedor aceptó ${sentCount} ${sentCount === 1 ? "invitación" : "invitaciones"} para enviar.` };
    }
    return { status: "warning", message: `Familia creada. ${sentCount} de ${deliveryJobIds.length} invitaciones aceptadas para envío; las restantes quedaron pendientes y podés revisarlas en Mailing.` };
  } catch (error) {
    console.error("family_creation_delivery_trigger_failed", error);
    return { status: "warning", message: "Familia creada. Las invitaciones quedaron preparadas, pero no pudimos confirmar su envío. Revisalas en Mailing." };
  }
}

export type CreatePlanState = { message: string | null };
export async function createPlanAction(_previousState: CreatePlanState, formData: FormData): Promise<CreatePlanState> {
  await requirePermission("families.manage");
  let eventualItems: unknown;
  try { eventualItems = JSON.parse(value(formData, "eventualItems") || "[]"); }
  catch { return { message: "Revisá los rubros eventuales e intentá de nuevo." }; }
  const parsed = planSchema.safeParse({ name: value(formData, "name"), basicMonthlyFee: value(formData, "basicMonthlyFee"), discountPercent: value(formData, "discountPercent"), eventualItems });
  if (!parsed.success) return { message: "Completá un nombre, una cuota válida y rubros con nombres distintos." };
  if (!validMonthlyFee(parsed.data.basicMonthlyFee, parsed.data.discountPercent)) return { message: "La cuota y el descuento deben tener hasta dos decimales." };
  if (parsed.data.eventualItems.some((item) => !validInstallmentTerms(item.suggestedAmount, item.installmentCount, item.discountPercent))) return { message: "Revisá los descuentos y cuotas: cada cuota debe ser de al menos $0,01, salvo bonificación completa." };
  let plan: { id: string };
  try {
    plan = await prisma.plan.create({ data: { name: parsed.data.name, basicMonthlyFee: parsed.data.basicMonthlyFee, discountPercent: parsed.data.discountPercent, eventualChargeItems: { create: parsed.data.eventualItems } } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { message: "Ya existe un plan con ese nombre. Elegí otro para el nuevo plan." };
    }
    throw error;
  }
  revalidatePath("/dashboard/families");
  revalidatePath("/dashboard/families/plans");
  redirect(`/dashboard/families/plans/${plan.id}`);
}
export async function updatePlanAction(formData: FormData) {
  await requirePermission("families.manage");
  const parsed = updatePlanSchema.safeParse({ planId: value(formData, "planId"), name: value(formData, "name"), basicMonthlyFee: value(formData, "basicMonthlyFee"), discountPercent: value(formData, "discountPercent") });
  if (!parsed.success) return;
  if (!validMonthlyFee(parsed.data.basicMonthlyFee, parsed.data.discountPercent)) return;
  await prisma.plan.update({ where: { id: parsed.data.planId }, data: { name: parsed.data.name, basicMonthlyFee: parsed.data.basicMonthlyFee, discountPercent: parsed.data.discountPercent } });
  revalidatePath("/dashboard/families");
  revalidatePath("/dashboard/families/plans");
  revalidatePath(`/dashboard/families/plans/${parsed.data.planId}`);
}

export async function createPlanEventualChargeItemAction(formData: FormData) {
  await requirePermission("families.manage");
  const parsed = eventualChargeItemSchema.safeParse({ planId: value(formData, "planId"), name: value(formData, "name"), suggestedAmount: value(formData, "suggestedAmount"), discountPercent: value(formData, "discountPercent"), installmentCount: value(formData, "installmentCount") });
  if (!parsed.success) return;
  if (!validInstallmentTerms(parsed.data.suggestedAmount, parsed.data.installmentCount, parsed.data.discountPercent)) return;
  await prisma.planEventualChargeItem.create({ data: parsed.data });
  revalidatePath("/dashboard/families/plans");
  revalidatePath(`/dashboard/families/plans/${parsed.data.planId}`);
}

export async function updatePlanEventualChargeItemAction(formData: FormData) {
  await requirePermission("families.manage");
  const parsed = updateEventualChargeItemSchema.safeParse({ itemId: value(formData, "itemId"), planId: value(formData, "planId"), name: value(formData, "name"), suggestedAmount: value(formData, "suggestedAmount"), discountPercent: value(formData, "discountPercent"), installmentCount: value(formData, "installmentCount") });
  if (!parsed.success) return;
  if (!validInstallmentTerms(parsed.data.suggestedAmount, parsed.data.installmentCount, parsed.data.discountPercent)) return;
  const item = await prisma.planEventualChargeItem.findUnique({ where: { id: parsed.data.itemId }, select: { planId: true } });
  if (!item || item.planId !== parsed.data.planId) return;
  await prisma.planEventualChargeItem.update({ where: { id: parsed.data.itemId }, data: { name: parsed.data.name, suggestedAmount: parsed.data.suggestedAmount, discountPercent: parsed.data.discountPercent, installmentCount: parsed.data.installmentCount } });
  revalidatePath("/dashboard/families/plans");
  revalidatePath(`/dashboard/families/plans/${parsed.data.planId}`);
}
export async function assignPlanToStudentAction(formData: FormData) {
  await requirePermission("families.manage");
  const parsed = planAssignmentSchema.safeParse({ familyId: value(formData, "familyId"), studentId: value(formData, "studentId"), planId: value(formData, "planId") });
  if (!parsed.success) return;
  const [student, plan] = await Promise.all([
    prisma.student.findUnique({ where: { id: parsed.data.studentId }, select: { familyId: true, planId: true } }),
    prisma.plan.findUnique({ where: { id: parsed.data.planId }, select: { isActive: true } }),
  ]);
  if (student?.familyId !== parsed.data.familyId || !plan || (!plan.isActive && student.planId !== parsed.data.planId)) return;
  await prisma.student.update({ where: { id: parsed.data.studentId }, data: { planId: parsed.data.planId } });
  revalidatePath("/dashboard/families");
  revalidatePath(`/dashboard/families/${parsed.data.familyId}`);
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
  const user = await requirePermission("families.manage");
  const parsed = familyIdSchema.safeParse(familyId);
  if (!parsed.success) return null;

  const family = await getFamilyDetailForAdmin(parsed.data);
  if (!family) return null;

  const balance = family.accountEntries.reduce(
    (total, entry) => total + Number(entry.amount),
    0,
  );
  const eventualChargeItems = await prisma.planEventualChargeItem.findMany({
    where: { plan: { students: { some: { familyId: family.id } } }, isActive: true },
    select: { id: true, name: true, suggestedAmount: true, discountPercent: true, installmentCount: true },
    orderBy: { name: "asc" },
  });
  return {
    id: family.id,
    name: family.name,
    balance: balance.toFixed(2),
    eventualChargeItems: eventualChargeItems.map((item) => ({
      id: item.id,
      name: item.name,
      suggestedAmount: item.suggestedAmount.toString(),
      discountPercent: item.discountPercent.toString(),
      installmentCount: item.installmentCount,
    })),
    canManagePayments: user.permissionKeys.includes("families.payments"),
    entries: family.accountEntries.map((entry) => ({
      id: entry.id,
      type: entry.type,
      amount: entry.amount.toString(),
      grossAmount: entry.grossAmount?.toString() ?? null,
      discountAmount: entry.discountAmount?.toString() ?? null,
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

    let deliveryError = false;
    try {
      await runInvitationDeliveryWorker();
    } catch (error) {
      deliveryError = true;
      console.error("family_import_delivery_trigger_failed", error);
    }

    revalidatePath("/dashboard/families");
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/mailing");
    return {
      status: "success" as const,
      message: deliveryError
          ? `Se crearon ${result.familiesCount} familias y se prepararon ${result.invitationsCount} invitaciones. El envío quedó pendiente y podés revisarlo en Mailing.`
          : `Se crearon ${result.familiesCount} familias y se prepararon ${result.invitationsCount} invitaciones para enviar.`,
    };
  } catch (error) {
    console.error("family_import_failed", error);
    const code = error instanceof Error ? error.message : "";
    if (code === "invitation_token_encryption_key_missing" || code === "invitation_token_encryption_key_invalid") {
      return { status: "error" as const, message: "No se pudieron preparar las invitaciones porque falta una configuración segura de envío. Contactá al administrador." };
    }
    if (code === "family_import_conflict") {
      return { status: "error" as const, message: "La información cambió desde la previsualización. Revisá los conflictos y volvé a confirmar." };
    }
    return { status: "error" as const, message: "No pudimos confirmar la importación. Revisá la planilla e intentá nuevamente." };
  }
}
