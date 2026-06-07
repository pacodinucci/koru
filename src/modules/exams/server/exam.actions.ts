"use server";

import { revalidatePath } from "next/cache";

import { requireDashboardUser } from "@/modules/auth/server/auth-guards";
import { examFormSchema, type ExamFormInput } from "@/modules/exams/schemas/exam.schema";
import { saveExamForDashboard } from "@/modules/exams/server/exams.repository";

export async function saveExamAction(input: ExamFormInput) {
  const user = await requireDashboardUser();
  const parsed = examFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  try {
    await saveExamForDashboard(user, parsed.data);
    revalidatePath("/dashboard/exams");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
}