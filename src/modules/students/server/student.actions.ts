"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { studentFormSchema, type StudentFormInput } from "@/modules/students/schemas/student.schema";
import {
  listStudentGroups,
  listStudentsForAdmin,
  saveStudentForAdmin,
} from "@/modules/students/server/students.repository";

export async function listStudentsForAdminAction() {
  await requireAdmin();
  return listStudentsForAdmin();
}

export async function listStudentGroupsAction() {
  await requireAdmin();
  return listStudentGroups();
}

export async function saveStudentAction(input: StudentFormInput) {
  const admin = await requireAdmin();
  const parsed = studentFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  try {
    await saveStudentForAdmin(parsed.data, admin.id);
    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/users");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
}

