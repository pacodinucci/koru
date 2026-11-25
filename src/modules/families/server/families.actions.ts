"use server";

import { FamilyStatus, InvitationDeliveryJobStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/modules/auth/server/auth-guards";
import { prisma } from "@/lib/prisma";
import { getFamilyDetailForAdmin } from "@/modules/families/server/families.repository";
import { buildFamilyFinancialSummary } from "@/modules/families/lib/family-financial-summary";
import {
  candidateConversionOutcome,
  requiredPermissionsForFamilyCreation,
  resolveFamilyCreationDraft,
  type AdmissionOrigin,
} from "@/modules/families/lib/candidate-family";
import { loadAdmissionOrigin } from "@/modules/families/server/candidate-family.service";


import { runInvitationDeliveryWorker } from "@/modules/mailing/server/invitation-delivery-worker.service";
import { invitationErrorState, type UserInvitationActionState } from "@/modules/users/lib/user-invitation-feedback";
import { createUserInvitation } from "@/modules/users/server/users.repository";

export type CreateFamilyState = { status: "idle" | "success" | "warning" | "error"; message: string | null };
const statusSchema = z.object({ familyId: z.string().min(1), status: z.nativeEnum(FamilyStatus) });
const membershipSchema = z.object({ familyId: z.string().min(1), memberId: z.string().min(1) });
const familyIdSchema = z.string().min(1);
const conversionSchema = z.object({ familyId: z.string().min(1) });

function value(formData: FormData, key: string) {
  const candidate = formData.get(key);
  return typeof candidate === "string" ? candidate : "";
}

export async function createFamilyAction(_previousState: CreateFamilyState, formData: FormData): Promise<CreateFamilyState> {
  const admissionInquiryId = value(formData, "admissionInquiryId").trim();
  // Creating from an admission reads the contacts module, so both capabilities are required.
  const requiredPermissions = requiredPermissionsForFamilyCreation(admissionInquiryId);
  const admin = await requirePermission(requiredPermissions[0]);
  for (const permission of requiredPermissions.slice(1)) {
    await requirePermission(permission);
  }

  let admissionOrigin: AdmissionOrigin | null = null;
  if (admissionInquiryId) {
    const lookup = await loadAdmissionOrigin(admissionInquiryId);
    if (lookup.status === "missing") {
      return { status: "error", message: "No encontramos el contacto de admisión de origen. Actualizá la página e intentá nuevamente." };
    }
    if (lookup.status === "already-linked") {
      return { status: "error", message: "Ese contacto de admisión ya tiene una familia creada." };
    }
    admissionOrigin = lookup.origin;
  }

  const resolved = resolveFamilyCreationDraft({
    kind: value(formData, "kind"),
    name: value(formData, "name"),
    primaryEmail: value(formData, "primaryEmail"),
    secondaryEmail: value(formData, "secondaryEmail").trim().toLowerCase(),
    admissionOrigin,
  });
  if (!resolved.ok) return { status: "error", message: resolved.message };
  const { draft } = resolved;

  let deliveryJobIds: string[];
  try {
    const { confirmFamilyImport } = await import("@/modules/families/server/family-import.service");
    const result = await confirmFamilyImport([{
      rowNumber: 1,
      familyName: draft.name,
      motherEmail: draft.primaryEmail,
      fatherEmail: draft.secondaryEmail,
      kind: draft.kind,
      admissionInquiryId: draft.admissionInquiryId,
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
    if (code === "family_admission_origin_conflict") {
      return { status: "error", message: "Ese contacto de admisión ya tiene una familia creada." };
    }
    if (code === "family_import_conflict" || prismaCode === "P2034") {
      return { status: "error", message: "La familia o alguno de los emails ya existe. Revisá los datos e intentá nuevamente." };
    }
    return { status: "error", message: "No pudimos crear la familia. Intentá nuevamente." };
  }

  revalidatePath("/dashboard/families");
  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/mailing");
  if (admissionInquiryId) revalidatePath("/dashboard/contactos");

  try {
    await runInvitationDeliveryWorker();
    const jobs = await prisma.invitationDeliveryJob.findMany({
      where: { id: { in: deliveryJobIds } },
      select: { status: true },
    });
    const sentCount = jobs.filter((job) => job.status === InvitationDeliveryJobStatus.SENT).length;
    const createdLabel = draft.kind === "CANDIDATE" ? "Familia candidata creada" : "Familia creada";
    if (sentCount === deliveryJobIds.length) {
      return { status: "success", message: `${createdLabel}. El proveedor aceptó ${sentCount} ${sentCount === 1 ? "invitación" : "invitaciones"} para enviar.` };
    }
    return { status: "warning", message: `${createdLabel}. ${sentCount} de ${deliveryJobIds.length} invitaciones aceptadas para envío; las restantes quedaron pendientes y podés revisarlas en Mailing.` };
  } catch (error) {
    console.error("family_creation_delivery_trigger_failed", error);
    return { status: "warning", message: `${draft.kind === "CANDIDATE" ? "Familia candidata creada" : "Familia creada"}. Las invitaciones quedaron preparadas, pero no pudimos confirmar su envío. Revisalas en Mailing.` };
  }
}

/** Idempotent and identity-preserving: only the kind column changes. */
export async function convertCandidateFamilyAction(previousState: CreateFamilyState, formData: FormData): Promise<CreateFamilyState> {
  await requirePermission("families.manage");
  const parsed = conversionSchema.safeParse({ familyId: value(formData, "familyId") });
  if (!parsed.success) return { status: "error", message: "No pudimos identificar la familia que querés convertir. Actualizá la página e intentá nuevamente." };

  try {
    const family = await prisma.family.findUnique({
      where: { id: parsed.data.familyId },
      select: { id: true, name: true, kind: true },
    });
    if (!family) {
      return { status: "error", message: "La familia ya no existe. Actualizá la página e intentá nuevamente." };
    }
    if (candidateConversionOutcome(family.kind) === "already-family") {
      return { status: "success", message: `${family.name} ya es una familia.` };
    }

    // Guarded update: a concurrent conversion or a manual kind change wins, never overwrites.
    await prisma.family.updateMany({ where: { id: family.id, kind: "CANDIDATE" }, data: { kind: "FAMILY" } });
    revalidatePath("/dashboard/families");
    revalidatePath(`/dashboard/families/${family.id}`);
    return { status: "success", message: `${family.name} ahora es una familia.` };
  } catch (error) {
    console.error("candidate_family_conversion_failed", error);
    return { status: "error", message: "No pudimos convertir la familia candidata. Intentá nuevamente." };
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

  const summary = buildFamilyFinancialSummary(family.accountEntries, family.eventualChargeSchedules);
  const normalizedById = new Map(summary.entries.map(entry => [entry.id, entry]));
  const eventualChargeItems = await prisma.billingRubric.findMany({
    where: { isActive: true },
    select: { id: true, name: true, amount: true },
    orderBy: { name: "asc" },
  });
  return {
    id: family.id,
    name: family.name,
    balance: summary.balance,
    pendingCharges: summary.pendingCharges,
    unallocatedCredits: summary.unallocatedCredits,
    futureCharges: summary.projectedCharges,
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
      isFuture: normalizedById.get(entry.id)!.isFuture,
      id: entry.id,
      type: entry.type,
      amount: entry.amount.toString(),
      grossAmount: entry.grossAmount?.toString() ?? null,
      discountAmount: entry.discountAmount?.toString() ?? null,
      description: entry.description,
      occurredAt: normalizedById.get(entry.id)!.occurredAt.toISOString(),
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

function optionalString(value: unknown) {
  return value === undefined || value === null || typeof value === "string";
}

function isFamilyImportRow(value: unknown): value is FamilyImportRowActionInput {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.rowNumber === "number"
    && typeof row.familyName === "string"
    && optionalString(row.motherEmail)
    && optionalString(row.fatherEmail)
    // Admission-linked creation must use createFamilyAction's contact guards and canonical lookup.
    && row.kind === undefined
    && row.admissionInquiryId === undefined;
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
