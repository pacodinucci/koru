"use server";

import { FamilyStatus, InvitationDeliveryJobStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/modules/auth/server/auth-guards";
import { prisma } from "@/lib/prisma";
import { getFamilyDetailForAdmin } from "@/modules/families/server/families.repository";
import { buildAllocationSummary } from "@/modules/families/lib/payment-allocation";
import { projectFutureFamilyCharges } from "@/modules/families/lib/family-charge-projections";
import { getBillingPeriod } from "@/modules/families/lib/monthly-billing";
import { runInvitationDeliveryWorker } from "@/modules/mailing/server/invitation-delivery-worker.service";
import { invitationErrorState, type UserInvitationActionState } from "@/modules/users/lib/user-invitation-feedback";
import { createUserInvitation } from "@/modules/users/server/users.repository";

const familySchema = z.object({
  name: z.string().trim().min(2).max(120),
  primaryEmail: z.email(),
  secondaryEmail: z.email().optional(),
});
export type CreateFamilyState = { status: "idle" | "success" | "warning" | "error"; message: string | null };
const statusSchema = z.object({ familyId: z.string().min(1), status: z.nativeEnum(FamilyStatus) });
const membershipSchema = z.object({ familyId: z.string().min(1), memberId: z.string().min(1) });
const familyIdSchema = z.string().min(1);

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

export async function inviteFamilyUserAction(_previousState: UserInvitationActionState, formData: FormData): Promise<UserInvitationActionState> {
  const admin = await requirePermission("families.manage");
  const parsed = z.object({ familyId: z.string().min(1), email: z.email() }).safeParse({
    familyId: value(formData, "familyId"),
    email: value(formData, "email").trim().toLowerCase(),
  });
  if (!parsed.success) return { status: "error", message: "Ingresá un email válido." };

  const familyRole = await prisma.role.findFirst({
    where: { key: "PARENT", baseRole: UserRole.PARENT, isActive: true },
    select: { id: true },
  });
  if (!familyRole) return { status: "error", message: "El rol de familia no está disponible. Contactá al administrador." };

  try {
    await createUserInvitation({
      email: parsed.data.email,
      familyId: parsed.data.familyId,
      accessRoleId: familyRole.id,
      invitedById: admin.id,
    });
  } catch (error) {
    return invitationErrorState(error instanceof Error ? error.message : "");
  }

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/mailing");
  try {
    await runInvitationDeliveryWorker();
    return { status: "success", message: "Invitación creada y encolada para su envío." };
  } catch (error) {
    console.error("family_user_invitation_delivery_trigger_failed", error);
    return { status: "warning", message: "Invitación creada. No pudimos confirmar el envío; revisala en Mailing." };
  }
}

const retiredPlanMessage = "Los planes fueron reemplazados por rubros. Administrá y asigná rubros por alumno.";

// Keep old action exports safe for stale clients; they must never recreate the retired catalog.
export type CreatePlanState = { message: string | null };
export async function createPlanAction(_previousState: CreatePlanState, _formData: FormData): Promise<CreatePlanState> {
  await requirePermission("families.manage");
  return { message: retiredPlanMessage };
}

export async function updatePlanAction(_formData: FormData): Promise<void> {
  await requirePermission("families.manage");
  throw new Error(retiredPlanMessage);
}

export async function createPlanEventualChargeItemAction(_formData: FormData): Promise<void> {
  await requirePermission("families.manage");
  throw new Error(retiredPlanMessage);
}

export async function updatePlanEventualChargeItemAction(_formData: FormData): Promise<void> {
  await requirePermission("families.manage");
  throw new Error(retiredPlanMessage);
}

export async function assignPlanToStudentAction(_formData: FormData): Promise<void> {
  await requirePermission("families.manage");
  throw new Error(retiredPlanMessage);
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
  const eventualChargeItems = await prisma.billingRubric.findMany({
    where: { isActive: true },
    select: { id: true, name: true, amount: true },
    orderBy: { name: "asc" },
  });
  return {
    id: family.id,
    name: family.name,
    balance: balance.toFixed(2),
    ...buildAllocationSummary(family.accountEntries),
    futureCharges: projectFutureFamilyCharges(family.eventualChargeSchedules, getBillingPeriod()),
    eventualChargeItems: eventualChargeItems.map((item) => ({
      id: item.id,
      name: item.name,
      suggestedAmount: item.amount.toString(),
      discountPercent: "0",
      installmentCount: 1,
      startMonth: 1,
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
