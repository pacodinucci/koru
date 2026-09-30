"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { canAccessFamilyStudent } from "@/modules/families/lib/family-student-access-policy";
import { requireFamilyDashboardAccess } from "@/modules/family-dashboard/server/family-dashboard-access";
import { admissionQuestionnaireKeys } from "@/modules/family-dashboard/lib/admission-questionnaire";

const answersSchema = z.record(z.string(), z.string().max(5000));
const allowedKeys = new Set<string>(admissionQuestionnaireKeys);

export async function saveAdmissionQuestionnaireAction(input: {
  studentId: string;
  answers: Record<string, string>;
  submit: boolean;
}) {
  const { familyUser } = await requireFamilyDashboardAccess("/family-dashboard?error=forbidden");
  const parsed = z.object({ studentId: z.string().min(1), answers: answersSchema, submit: z.boolean() }).safeParse(input);
  if (!parsed.success || Object.keys(parsed.data.answers).some((key) => !allowedKeys.has(key))) {
    return { ok: false as const, error: "invalid_input" };
  }
  const student = await prisma.student.findUnique({ where: { id: parsed.data.studentId }, select: { familyId: true } });
  if (!student || !canAccessFamilyStudent({ studentFamilyId: student.familyId, userFamilyId: familyUser.familyId })) {
    return { ok: false as const, error: "student_not_found" };
  }
  const answers = Object.fromEntries(Object.entries(parsed.data.answers).map(([key, value]) => [key, value.trim()]));
  if (parsed.data.submit && !Object.values(answers).some(Boolean)) {
    return { ok: false as const, error: "empty_questionnaire" };
  }
  await prisma.studentAdmissionQuestionnaire.upsert({
    where: { studentId: parsed.data.studentId },
    create: { studentId: parsed.data.studentId, answers, submittedAt: parsed.data.submit ? new Date() : null },
    update: { answers, submittedAt: parsed.data.submit ? new Date() : null },
  });
  revalidatePath("/family-dashboard/cuestionario-ingreso");
  revalidatePath(`/family-dashboard/cuestionario-ingreso/${parsed.data.studentId}`);
  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/students/${parsed.data.studentId}`);
  return { ok: true as const };
}
