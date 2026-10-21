import { consentTeacherAgreement, teacherAgreementResponse } from "@/modules/follow-up-agreements/server/teacher-follow-up-agreements.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return teacherAgreementResponse(async () => consentTeacherAgreement((await params).id), "No pudimos registrar la conformidad. Intentá nuevamente.");
}
