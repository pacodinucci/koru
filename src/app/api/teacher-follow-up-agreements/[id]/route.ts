import { deleteTeacherAgreement, saveTeacherAgreement, teacherAgreementResponse } from "@/modules/follow-up-agreements/server/teacher-follow-up-agreements.service";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  return teacherAgreementResponse(async () => saveTeacherAgreement(request, (await params).id), "No pudimos guardar el acuerdo. Intentá nuevamente.");
}

export async function DELETE(_request: Request, { params }: Context) {
  return teacherAgreementResponse(async () => deleteTeacherAgreement((await params).id), "No pudimos eliminar el acuerdo. Intentá nuevamente.");
}
