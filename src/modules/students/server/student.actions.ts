"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/modules/auth/server/auth-guards";
import { studentFormSchema, type StudentFormInput } from "@/modules/students/schemas/student.schema";
import {
  listStudentGroups,
  listStudentsForViewer,
  updateStudentRecordStatus,
} from "@/modules/students/server/students.repository";

export async function listStudentsForAdminAction() {
  const user = await requirePermission("students.manage");
  return listStudentsForViewer(user);
}

export async function listStudentGroupsAction() {
  const user = await requirePermission("students.manage");
  return listStudentGroups(user);
}

export async function saveStudentAction(input: StudentFormInput) {
  await requirePermission("students.manage");
  const parsed = studentFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  return { ok: false, error: "student_admin_flow_disabled" };
}

export async function updateStudentRecordStatusAction(formData: FormData) {
  const user = await requirePermission("students.manage");
  const studentId = formData.get("studentId");
  const recordStatus = formData.get("recordStatus");
  if (typeof studentId !== "string" || (recordStatus !== "SUBMITTED" && recordStatus !== "REVIEWED" && recordStatus !== "NEEDS_CHANGES")) return;
  const result = await updateStudentRecordStatus(studentId, recordStatus, user);
  if (result.count === 0) return;
  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/students/${studentId}`);
}
