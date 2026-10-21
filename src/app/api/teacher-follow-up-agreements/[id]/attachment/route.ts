import { teacherAgreementAttachment, teacherAgreementResponse } from "@/modules/follow-up-agreements/server/teacher-follow-up-agreements.service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return teacherAgreementResponse(async () => teacherAgreementAttachment((await params).id), "No pudimos abrir el adjunto.");
}
