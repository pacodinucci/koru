import "server-only";

import { prisma } from "@/lib/prisma";
import { AgreementError, parseAgreementForm, validateAgreementParticipants } from "@/modules/follow-up-agreements/lib/agreement-validation";
import { deleteAgreementFile, readAgreementFile, uploadAgreementFile } from "@/modules/follow-up-agreements/server/agreement-files";

export { AgreementError };

export async function getTeacherAgreementScope(userId: string) {
  const teacher = await prisma.teacherProfile.findFirst({ where: { userId, isActive: true }, select: { id: true } });
  if (!teacher) return null;
  const assigned = await prisma.student.findMany({
    where: { status: "ACTIVE", group: { isActive: true, teacherResponsibilities: { some: { teacherId: teacher.id } } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true, familyId: true, family: { select: { status: true } } },
  });
  const students = assigned.filter((student) => student.family?.status === "ACTIVE" && student.familyId);
  return {
    teacherId: teacher.id,
    students: students.map((student) => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      familyId: student.familyId,
    })),
  };
}

export async function listTeacherAgreements(teacherId: string) {
  return prisma.followUpAgreement.findMany({
    where: { teacherId }, orderBy: { createdAt: "desc" },
    include: {
      families: { include: { family: { select: { name: true } }, consentedBy: { select: { name: true } } } },
      students: { include: { student: { select: { firstName: true, lastName: true } } } },
    },
  });
}

export async function getTeacherDraftAgreement(teacherId: string, id: string) {
  return prisma.followUpAgreement.findFirst({
    where: { id, teacherId, status: "DRAFT" },
    select: {
      id: true,
      title: true,
      body: true,
      attachmentFileName: true,
      students: { select: { studentId: true } },
    },
  });
}

export async function saveAgreementDraft(userId: string, formData: FormData, id?: string) {
  const scope = await getTeacherAgreementScope(userId);
  if (!scope) throw new AgreementError("Docente no disponible.", 403);
  const input = parseAgreementForm(formData);
  validateAgreementParticipants(scope.students, input.studentIds);
  const previous = id ? await prisma.followUpAgreement.findFirst({ where: { id, teacherId: scope.teacherId, status: "DRAFT" } }) : null;
  if (id && !previous) throw new AgreementError("Borrador no disponible.", 404);

  const rawFile = formData.get("file");
  const hasFile = rawFile instanceof File && rawFile.name.length > 0;
  const file = hasFile ? await readAgreementFile(rawFile) : null;
  if (hasFile && !file) throw new AgreementError("Adjuntá un PDF, DOC, DOCX, JPG, PNG o WEBP válido de hasta 10 MB.");
  let newPublicId: string | null = null;
  try {
    if (file) newPublicId = await uploadAgreementFile(file);
    const currentScope = await getTeacherAgreementScope(userId);
    if (!currentScope || currentScope.teacherId !== scope.teacherId) throw new AgreementError("Tu asignación docente cambió. Volvé a intentarlo.", 403);
    const familyIds = validateAgreementParticipants(currentScope.students, input.studentIds);
    const attachment = file ? {
      attachmentPublicId: newPublicId,
      attachmentFileName: file.fileName,
      attachmentMimeType: file.mimeType,
    } : input.removeAttachment ? {
      attachmentPublicId: null,
      attachmentFileName: null,
      attachmentMimeType: null,
    } : {};
    const saved = await prisma.$transaction(async (tx) => {
      if (!id) return tx.followUpAgreement.create({
        data: {
          teacherId: scope.teacherId, title: input.title, body: input.body, ...attachment,
          families: { create: familyIds.map((familyId) => ({ familyId })) },
          students: { create: input.studentIds.map((studentId) => ({ studentId })) },
        },
      });
      const locked = await tx.followUpAgreement.updateMany({ where: { id, teacherId: scope.teacherId, status: "DRAFT" }, data: { title: input.title, body: input.body, ...attachment } });
      if (!locked.count) throw new AgreementError("El acuerdo ya fue publicado y no se puede modificar.", 409);
      await tx.followUpAgreementFamily.deleteMany({ where: { agreementId: id } });
      await tx.followUpAgreementStudent.deleteMany({ where: { agreementId: id } });
      await tx.followUpAgreementFamily.createMany({ data: familyIds.map((familyId) => ({ agreementId: id, familyId })) });
      await tx.followUpAgreementStudent.createMany({ data: input.studentIds.map((studentId) => ({ agreementId: id, studentId })) });
      return tx.followUpAgreement.findUniqueOrThrow({ where: { id } });
    });
    if (previous?.attachmentPublicId && (file || input.removeAttachment)) {
      try { await deleteAgreementFile(previous.attachmentPublicId); }
      catch (error) { console.error("[follow-up-agreements] No se pudo borrar el adjunto anterior", error); }
    }
    return saved;
  } catch (error) {
    if (newPublicId) {
      try { await deleteAgreementFile(newPublicId); }
      catch (cleanupError) { console.error("[follow-up-agreements] No se pudo limpiar el adjunto", cleanupError); }
    }
    throw error;
  }
}

export async function publishAgreement(userId: string, id: string) {
  const scope = await getTeacherAgreementScope(userId);
  if (!scope) throw new AgreementError("Docente no disponible.", 403);
  const agreement = await prisma.followUpAgreement.findFirst({
    where: { id, teacherId: scope.teacherId, status: "DRAFT" },
    include: { families: { select: { familyId: true } }, students: { select: { studentId: true } } },
  });
  if (!agreement) throw new AgreementError("Borrador no disponible.", 404);
  const familyIds = validateAgreementParticipants(scope.students, agreement.students.map((item) => item.studentId));
  if (familyIds.length !== agreement.families.length
    || familyIds.some((familyId) => !agreement.families.some((item) => item.familyId === familyId))) {
    throw new AgreementError("Editá y guardá este borrador para actualizar las familias de los alumnos seleccionados.", 409);
  }
  const result = await prisma.followUpAgreement.updateMany({
    where: { id, teacherId: scope.teacherId, status: "DRAFT" },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  if (!result.count) throw new AgreementError("El acuerdo ya fue publicado.", 409);
}
