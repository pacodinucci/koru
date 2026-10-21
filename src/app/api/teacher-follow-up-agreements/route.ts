import { saveTeacherAgreement, teacherAgreementResponse } from "@/modules/follow-up-agreements/server/teacher-follow-up-agreements.service";

export async function POST(request: Request) {
  return teacherAgreementResponse(() => saveTeacherAgreement(request), "No pudimos guardar el acuerdo. Intentá nuevamente.");
}
