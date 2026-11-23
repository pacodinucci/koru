"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/server/auth-guards";
import { BillingRubricInputError } from "@/modules/families/lib/billing-rubrics";
import { createBillingRubric, updateBillingRubric, assignRubricToStudent, updateStudentRubricAssignment, deleteStudentRubricAssignment } from "@/modules/families/server/rubrics.service";

type RubricActionState = { message: string | null; success?: boolean };

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function integerField(formData: FormData, name: string) {
  const value = field(formData, name);
  return /^\d+$/.test(value) ? Number(value) : NaN;
}

function errorMessage(error: unknown) {
  if (error instanceof BillingRubricInputError) return error.message;
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "P2034" || error.code === "P2003") return "La cuenta cambió mientras guardabas. Actualizá la ficha, revisá los pendientes y volvé a intentar.";
    if (error.code === "P2002") return "Ya existe un rubro con ese nombre. Elegí otro nombre.";
    if (error.code === "P2025") return "No encontramos el rubro. Actualizá la página e intentá nuevamente.";
  }
  return "No pudimos guardar el rubro. Intentá nuevamente.";
}

function revalidateRubrics(familyId?: string) {
  revalidatePath("/dashboard/families");
  revalidatePath("/dashboard/families/rubrics");
  if (familyId) revalidatePath(`/dashboard/families/${familyId}`);
}

export async function createBillingRubricAction(_previousState: RubricActionState, formData: FormData): Promise<RubricActionState> {
  await requirePermission("families.manage");
  try {
    await createBillingRubric({ name: field(formData, "name"), amount: field(formData, "amount") });
    revalidateRubrics();
    return { message: "Rubro creado." };
  } catch (error) { return { message: errorMessage(error) }; }
}

export async function updateBillingRubricAction(_previousState: RubricActionState, formData: FormData): Promise<RubricActionState> {
  await requirePermission("families.manage");
  try {
    const active = formData.get("isActive");
    if (active !== null && active !== "true" && active !== "false" && active !== "on") {
      throw new BillingRubricInputError("El estado del rubro no es válido.");
    }
    await updateBillingRubric({ rubricId: field(formData, "rubricId"), name: field(formData, "name"), amount: field(formData, "amount"), ...(active === null ? {} : { isActive: active !== "false" }) });
    revalidateRubrics();
    return { message: "Rubro actualizado. Las asignaciones existentes conservan su importe y nombre." };
  } catch (error) { return { message: errorMessage(error) }; }
}

export async function assignRubricToStudentAction(_previousState: RubricActionState, formData: FormData): Promise<RubricActionState> {
  const admin = await requirePermission("families.manage");
  try {
    const familyId = field(formData, "familyId");
    await assignRubricToStudent({ familyId, studentId: field(formData, "studentId"), rubricId: field(formData, "rubricId"), installmentCount: integerField(formData, "installmentCount"), startMonth: integerField(formData, "startMonth"), discountPercent: formData.has("discountPercent") ? field(formData, "discountPercent") : "0" }, admin.id);
    revalidateRubrics(familyId);
    return { message: "Rubro asignado. Los cargos vencidos se registraron y las cuotas futuras quedaron programadas.", success: true };
  } catch (error) {
    if (!(error instanceof BillingRubricInputError)) {
      const code = error && typeof error === "object" && "code" in error
        && typeof error.code === "string" && /^P\d{4}$/.test(error.code) ? error.code : "UNKNOWN";
      // Prisma errors can contain queries and values. Keep full diagnostics local
      // to development; never return them to the browser or log them in production.
      console.error("[families.assignRubricToStudent] Assignment failed.",
        process.env.NODE_ENV === "development" ? error : { code });
    }
    return { message: errorMessage(error), success: false };
  }
}

export async function updateStudentRubricAssignmentAction(_previousState: RubricActionState, formData: FormData): Promise<RubricActionState> {
  const admin = await requirePermission("families.manage");
  try {
    const familyId = field(formData, "familyId");
    await updateStudentRubricAssignment({
      familyId, studentId: field(formData, "studentId"), assignmentId: field(formData, "assignmentId"),
      rubricId: field(formData, "rubricId"), installmentCount: integerField(formData, "installmentCount"),
      startMonth: integerField(formData, "startMonth"), discountPercent: formData.has("discountPercent") ? field(formData, "discountPercent") : "0",
    }, admin.id);
    revalidateRubrics(familyId);
    return { message: "Rubro actualizado. Se recalcularon solo las cuotas sin pagos; las pagadas o parcialmente pagadas quedaron intactas." };
  } catch (error) { return { message: errorMessage(error) }; }
}

export async function deleteStudentRubricAssignmentAction(_previousState: RubricActionState, formData: FormData): Promise<RubricActionState> {
  const admin = await requirePermission("families.manage");
  try {
    const familyId = field(formData, "familyId");
    await deleteStudentRubricAssignment({ familyId, studentId: field(formData, "studentId"), assignmentId: field(formData, "assignmentId") }, admin.id);
    revalidateRubrics(familyId);
    return { message: "Rubro eliminado. Se quitaron únicamente sus cargos impagos." };
  } catch (error) { return { message: errorMessage(error) }; }
}
