"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/modules/auth/server/auth-guards";
import {
  familyStudentAddressSchema,
  familyStudentContactsSchema,
  familyStudentIdentitySchema,
  familyStudentMedicalSchema,
  familyStudentResponsibleSchema,
  type FamilyStudentAddressInput,
  type FamilyStudentContactsInput,
  type FamilyStudentIdentityInput,
  type FamilyStudentMedicalInput,
  type FamilyStudentResponsibleInput,
} from "@/modules/family-dashboard/schemas/family-student-record.schema";
import {
  completeFamilyStudentRecord,
  createFamilyStudentResponsible,
  saveFamilyStudentAddress,
  saveFamilyStudentIdentity,
  saveFamilyStudentMedical,
} from "@/modules/family-dashboard/server/family-student-record.repository";

function failure(error: unknown) {
  return { ok: false as const, error: error instanceof Error ? error.message : "unknown_error" };
}

export async function saveFamilyStudentIdentityAction(input: FamilyStudentIdentityInput) {
  const user = await requireRole(["PARENT"], "/family-dashboard?error=forbidden");
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
  const user = await requireRole(["PARENT"], "/family-dashboard?error=forbidden");
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
  const user = await requireRole(["PARENT"], "/family-dashboard?error=forbidden");
  const parsed = familyStudentMedicalSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid_input" };
  try {
    await saveFamilyStudentMedical(parsed.data, user);
    return { ok: true as const };
  } catch (error) {
    return failure(error);
  }
}

export async function completeFamilyStudentRecordAction(input: FamilyStudentContactsInput) {
  const user = await requireRole(["PARENT"], "/family-dashboard?error=forbidden");
  const parsed = familyStudentContactsSchema.safeParse(input);
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
  const user = await requireRole(["PARENT"], "/family-dashboard?error=forbidden");
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
