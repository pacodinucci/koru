"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { teacherFormSchema, type TeacherFormInput } from "@/modules/teachers/schemas/teacher.schema";
import {
  listTeacherProfilesForAdmin,
  updateTeacherProfileForAdmin,
} from "@/modules/teachers/server/teachers.repository";

export async function listTeacherProfilesForAdminAction() {
  await requireAdmin();
  return listTeacherProfilesForAdmin();
}

export async function updateTeacherProfileAction(input: TeacherFormInput) {
  await requireAdmin();
  const parsed = teacherFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  try {
    await updateTeacherProfileForAdmin(parsed.data);
    revalidatePath("/dashboard/teachers");
    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/exams");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
}
