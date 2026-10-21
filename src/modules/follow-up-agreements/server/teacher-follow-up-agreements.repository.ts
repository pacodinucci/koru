import "server-only";

import { prisma } from "@/lib/prisma";
import { getActualAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { AgreementError, teacherAgreementId } from "@/modules/follow-up-agreements/lib/teacher-agreement-validation";

export async function requireTeacherAgreementActor(adminOnly = false) {
  // Development preview and permission grants must never impersonate a consent actor.
  const user = await getActualAuthenticatedUser();
  if (!user) throw new AgreementError("No autorizado.", 401);
  if (adminOnly ? user.role !== "SUPERADMIN" : !["SUPERADMIN", "TEACHER", "ADMIN_TEACHER"].includes(user.role)) {
    throw new AgreementError("No autorizado.", 403);
  }
  return user;
}

export function ownTeacherAgreementScope(userId: string) {
  return { status: "PUBLISHED" as const, teacher: { userId } };
}

const rowSelect = {
  id: true, teacherId: true, title: true, body: true, status: true,
  createdAt: true, publishedAt: true, acceptedAt: true,
  acceptedBy: { select: { name: true } }, author: { select: { name: true } },
  attachmentFileName: true,
} as const;

type AgreementRow = {
  id: string; teacherId: string; title: string; body: string; status: "DRAFT" | "PUBLISHED";
  createdAt: Date; publishedAt: Date | null; acceptedAt: Date | null;
  acceptedBy: { name: string } | null; author: { name: string }; attachmentFileName: string | null;
};

function serialize(row: AgreementRow) {
  return {
    id: row.id, teacherId: row.teacherId, title: row.title, body: row.body, status: row.status,
    createdAt: row.createdAt.toISOString(), publishedAt: row.publishedAt?.toISOString() ?? null,
    acceptedAt: row.acceptedAt?.toISOString() ?? null, acceptedByName: row.acceptedBy?.name ?? null,
    authorName: row.author.name, attachmentName: row.attachmentFileName,
    hasAttachment: row.attachmentFileName !== null,
  };
}

export async function listTeacherFollowUpAgreements(teacherId: string) {
  await requireTeacherAgreementActor(true);
  const rows = await prisma.teacherFollowUpAgreement.findMany({
    where: { teacherId: teacherAgreementId(teacherId) }, select: rowSelect, orderBy: { createdAt: "desc" },
  });
  return rows.map(serialize);
}

export async function listOwnTeacherFollowUpAgreements() {
  const user = await requireTeacherAgreementActor();
  if (user.role === "SUPERADMIN") throw new AgreementError("No autorizado.", 403);
  const rows = await prisma.teacherFollowUpAgreement.findMany({
    where: ownTeacherAgreementScope(user.id), select: rowSelect, orderBy: { createdAt: "desc" },
  });
  return rows.map(serialize);
}
