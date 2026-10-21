import { publishTeacherAgreement, teacherAgreementResponse } from "@/modules/follow-up-agreements/server/teacher-follow-up-agreements.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return teacherAgreementResponse(async () => publishTeacherAgreement((await params).id), "No pudimos publicar el acuerdo. Intentá nuevamente.");
}
