"use server";

import { revalidatePath } from "next/cache";

import { requireFamilyDashboardAccess } from "@/modules/family-dashboard/server/family-dashboard-access";
import {
  familyStudentAddressSchema,
  familyStudentCompletionSchema,
  familyStudentIdentitySchema,
  familyStudentMedicalSchema,
  familyStudentResponsibleSchema,
  familyResponsibleUpdateSchema,
  type FamilyStudentAddressInput,
  type FamilyStudentCompletionInput,
  type FamilyStudentIdentityInput,
  type FamilyStudentMedicalInput,
  type FamilyStudentResponsibleInput,
  type FamilyResponsibleUpdateInput,
} from "@/modules/family-dashboard/schemas/family-student-record.schema";
import {
  completeFamilyStudentRecord,
  createFamilyStudentResponsible,
  updateFamilyResponsible,
  saveFamilyStudentAddress,
  saveFamilyStudentIdentity,
  saveFamilyStudentMedical,
} from "@/modules/family-dashboard/server/family-student-record.repository";

function failure(error: unknown) {
  return { ok: false as const, error: error instanceof Error ? error.message : "unknown_error" };
}

export async function saveFamilyStudentIdentityAction(input: FamilyStudentIdentityInput) {
  const user = (await requireFamilyDashboardAccess("/family-dashboard?error=forbidden")).familyUser;
  const parsed = familyStudentIdentitySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid_input" };
  try {
    const student = await saveFamilyStudentIdentity(parsed.data, user);
    revalidatePath("/family-dashboard");
    return { ok: true as const, studentId: student.id };
  } catch (error) {
    return failure(error);
  }
}

export async function saveFamilyStudentAddressAction(input: FamilyStudentAddressInput) {
  const user = (await requireFamilyDashboardAccess("/family-dashboard?error=forbidden")).familyUser;
  const parsed = familyStudentAddressSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid_input" };
  try {
    await saveFamilyStudentAddress(parsed.data, user);
    return { ok: true as const };
  } catch (error) {
    return failure(error);
  }
}

export async function saveFamilyStudentMedicalAction(input: FamilyStudentMedicalInput) {
  const user = (await requireFamilyDashboardAccess("/family-dashboard?error=forbidden")).familyUser;
  const parsed = familyStudentMedicalSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid_input" };
  try {
    await saveFamilyStudentMedical(parsed.data, user);
    return { ok: true as const };
  } catch (error) {
    return failure(error);
  }
}

export async function completeFamilyStudentRecordAction(input: FamilyStudentCompletionInput) {
  const user = (await requireFamilyDashboardAccess("/family-dashboard?error=forbidden")).familyUser;
  const parsed = familyStudentCompletionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid_input" };
  try {
    await completeFamilyStudentRecord(parsed.data, user);
    revalidatePath("/family-dashboard");
    revalidatePath("/family-dashboard/expediente");
    revalidatePath("/dashboard/students");
    return { ok: true as const };
  } catch (error) {
    return failure(error);
  }
}
export async function createFamilyStudentResponsibleAction(input: FamilyStudentResponsibleInput) {
  const user = (await requireFamilyDashboardAccess("/family-dashboard?error=forbidden")).familyUser;
  const parsed = familyStudentResponsibleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid_input" };
  try {
    await createFamilyStudentResponsible(parsed.data, user);
    revalidatePath("/family-dashboard");
    revalidatePath("/family-dashboard/expediente");
    return { ok: true as const };
  } catch (error) {
    return failure(error);
  }
}

export async function updateFamilyResponsibleAction(input: FamilyResponsibleUpdateInput) {
  const user = (await requireFamilyDashboardAccess("/family-dashboard?error=forbidden")).familyUser;
  const parsed = familyResponsibleUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid_input" };
  try {
    await updateFamilyResponsible(parsed.data, user);
    revalidatePath("/family-dashboard");
    revalidatePath("/family-dashboard/expediente");
    return { ok: true as const };
  } catch (error) {
    return failure(error);
  }
}
