import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ContactDetail, ContactQuery, ContactRow, ContactSource, ContactStatus } from "../contacts.domain";

type DatabaseRow = Omit<ContactRow, "receivedAt"> & { receivedAt: Date };
// Both branches are normalized BEFORE filters, ordering and pagination.
const union = Prisma.sql`SELECT 'contact'::text AS source, id, nombre AS name, email, telefono AS phone,
  status::text AS status, "createdAt" AS "receivedAt", nombre AS "searchName" FROM "ContactMessage"
  UNION ALL SELECT 'admission'::text, id, "guardianNames", email, phone, status::text,
  "submittedAt", "guardianNames" || ' ' || "childName" FROM "AdmissionInquiry"`;
export async function listContacts(query: ContactQuery) {
  const search = `%${query.q.replace(/[\\%_]/g, "\\$&")}%`;
  const where = Prisma.sql`WHERE (${query.source} = '' OR source = ${query.source})
    AND (${query.status} = '' OR status = ${query.status})
    AND (${query.q} = '' OR "searchName" ILIKE ${search} OR email ILIKE ${search})`;
  return prisma.$transaction(async (tx) => {
    const counts = await tx.$queryRaw<{ total: bigint }[]>(Prisma.sql`SELECT count(*) AS total FROM (${union}) AS all_contacts ${where}`);
    const rows = await tx.$queryRaw<DatabaseRow[]>(Prisma.sql`SELECT source, id, name, email, phone, status, "receivedAt"
      FROM (${union}) AS all_contacts ${where}
      ORDER BY "receivedAt" DESC, source ASC, id ASC LIMIT 20 OFFSET ${(query.page - 1) * 20}`);
    return { items: rows.map((row) => ({ ...row, receivedAt: row.receivedAt.toISOString() })), total: Number(counts[0].total), page: query.page, pageSize: 20 };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
export async function getContact(source: ContactSource, id: string): Promise<ContactDetail | null> {
  if (source === "contact") {
    const row = await prisma.contactMessage.findUnique({ where: { id } });
    return row ? { source, id: row.id, name: row.nombre, email: row.email, phone: row.telefono, status: row.status, receivedAt: row.createdAt.toISOString(), message: row.mensaje } : null;
  }
  const row = await prisma.admissionInquiry.findUnique({ where: { id } });
  return row ? { source, id: row.id, name: row.guardianNames, email: row.email, phone: row.phone, status: row.status, receivedAt: row.submittedAt.toISOString(), answers: row.answers as Record<string, string | number>, questionnaireVersion: row.questionnaireVersion } : null;
}
export async function setContactStatus(source: ContactSource, id: string, status: ContactStatus) {
  const result = source === "contact"
    ? await prisma.contactMessage.updateMany({ where: { id }, data: { status } })
    : await prisma.admissionInquiry.updateMany({ where: { id }, data: { status } });
  return result.count === 1;
}
