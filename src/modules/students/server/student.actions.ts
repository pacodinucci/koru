"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { studentFormSchema, type StudentFormInput } from "@/modules/students/schemas/student.schema";
import {
  listStudentGroups,
  listStudentsForAdmin,
  updateStudentRecordStatus,
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
  await requireAdmin();
  const parsed = studentFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  return { ok: false, error: "student_admin_flow_disabled" };
}

export async function updateStudentRecordStatusAction(formData: FormData) {
  await requireAdmin();
  const studentId = formData.get("studentId");
  const recordStatus = formData.get("recordStatus");
  if (typeof studentId !== "string" || (recordStatus !== "SUBMITTED" && recordStatus !== "REVIEWED" && recordStatus !== "NEEDS_CHANGES")) return;
  await updateStudentRecordStatus(studentId, recordStatus);
  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/students/${studentId}`);
}