import "server-only";

import { InvitationStatus, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  cancelStaleInvitationDeliveryJobs,
  createInvitationDeliveryJob,
} from "@/modules/mailing/server/invitation-delivery-job.repository";
import { encryptInvitationToken } from "@/modules/users/server/invitation-token-cipher";
import { createInvitationToken } from "@/modules/users/server/user-invitation-token";

export type FamilyImportRowInput = {
  rowNumber: number;
  familyName: string;
  motherEmail?: string;
  fatherEmail?: string;
};

export type FamilyImportIssue = { rowNumber: number; message: string };
export type FamilyImportPreview = {
  validRows: Array<{ rowNumber: number; familyName: string; emails: string[] }>;
  issues: FamilyImportIssue[];
  familiesCount: number;
  invitationsCount: number;
};

type NormalizedRow = { rowNumber: number; familyName: string; familyKey: string; emails: string[] };

const emailSchema = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeFamilyName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function familyKey(name: string) {
  return normalizeFamilyName(name).toLocaleLowerCase("es-AR");
}

function normalizeEmail(email: string | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function normalizeRows(rows: FamilyImportRowInput[]) {
  const issues: FamilyImportIssue[] = [];
  const normalized: NormalizedRow[] = [];

  if (!Array.isArray(rows) || rows.length === 0) {
    return { normalized, issues: [{ rowNumber: 0, message: "La planilla no tiene filas para importar." }] };
  }
  if (rows.length > 500) {
    return { normalized, issues: [{ rowNumber: 0, message: "Podés importar hasta 500 familias por vez." }] };
  }

  for (const row of rows) {
    const rowNumber = Number.isInteger(row.rowNumber) && row.rowNumber > 0 ? row.rowNumber : 0;
    const name = normalizeFamilyName(row.familyName ?? "");
    const emails = [normalizeEmail(row.motherEmail), normalizeEmail(row.fatherEmail)].filter(Boolean);

    if (!name || name.length < 2 || name.length > 120) {
      issues.push({ rowNumber, message: "El nombre de familia debe tener entre 2 y 120 caracteres." });
      continue;
    }
    if (!emails.length) {
      issues.push({ rowNumber, message: "Indicá al menos un mail." });
      continue;
    }
    if (emails.some((email) => !emailSchema.test(email))) {
      issues.push({ rowNumber, message: "Hay un mail con formato inválido." });
      continue;
    }
    if (new Set(emails).size !== emails.length) {
      issues.push({ rowNumber, message: "Los dos mails de la familia deben ser distintos." });
      continue;
    }
    normalized.push({ rowNumber, familyName: name, familyKey: familyKey(name), emails });
  }

  const seenFamilies = new Map<string, number>();
  const seenEmails = new Map<string, number>();
  for (const row of normalized) {
    const previousFamilyRow = seenFamilies.get(row.familyKey);
    if (previousFamilyRow) issues.push({ rowNumber: row.rowNumber, message: `La familia ya aparece en la fila ${previousFamilyRow}.` });
    else seenFamilies.set(row.familyKey, row.rowNumber);

    for (const email of row.emails) {
      const previousEmailRow = seenEmails.get(email);
      if (previousEmailRow) issues.push({ rowNumber: row.rowNumber, message: `El mail ${email} ya aparece en la fila ${previousEmailRow}.` });
      else seenEmails.set(email, row.rowNumber);
    }
  }

  const invalidRows = new Set(issues.map((issue) => issue.rowNumber));
  return { normalized: normalized.filter((row) => !invalidRows.has(row.rowNumber)), issues };
}

async function appendDatabaseIssues(rows: NormalizedRow[], issues: FamilyImportIssue[]) {
  if (!rows.length) return;
  const names = await prisma.family.findMany({ select: { name: true } });
  const existingFamilyKeys = new Set(names.map((family) => familyKey(family.name)));
  const emails = rows.flatMap((row) => row.emails);
  const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { email: true } });
  const existingUsers = new Set(users.map((user) => user.email.toLowerCase()));

  for (const row of rows) {
    if (existingFamilyKeys.has(row.familyKey)) issues.push({ rowNumber: row.rowNumber, message: "Ya existe una familia con ese nombre." });
    for (const email of row.emails) {
      if (existingUsers.has(email)) issues.push({ rowNumber: row.rowNumber, message: `El mail ${email} ya tiene un usuario creado.` });
    }
  }
}

export async function previewFamilyImport(rows: FamilyImportRowInput[]): Promise<FamilyImportPreview> {
  const result = normalizeRows(rows);
  await appendDatabaseIssues(result.normalized, result.issues);
  const invalidRows = new Set(result.issues.map((issue) => issue.rowNumber));
  const validRows = result.normalized.filter((row) => !invalidRows.has(row.rowNumber));
  return { validRows: validRows.map(({ rowNumber, familyName, emails }) => ({ rowNumber, familyName, emails })), issues: result.issues, familiesCount: validRows.length, invitationsCount: validRows.reduce((count, row) => count + row.emails.length, 0) };
}

export async function confirmFamilyImport(rows: FamilyImportRowInput[], invitedById: string) {
  // Revalidate immediately before writing: the preview is advisory and may be stale.
  const preview = await previewFamilyImport(rows);
  if (preview.issues.length) return { ok: false as const, preview };

  const invitationsCount = await prisma.$transaction(async (tx) => {
    let invitationsCount = 0;
    for (const row of preview.validRows) {
      // The schema has no normalized unique key. Checking again inside the transaction protects
      // the normal path; a future data migration can add a database uniqueness constraint.
      const sameName = await tx.family.findMany({ select: { name: true } });
      if (sameName.some((family) => familyKey(family.name) === familyKey(row.familyName))) throw new Error("family_import_conflict");

      const family = await tx.family.create({ data: { name: row.familyName } });
      for (const email of row.emails) {
        const [user, invitation] = await Promise.all([
          tx.user.findUnique({ where: { email }, select: { id: true } }),
          tx.userInvitation.findUnique({ where: { email }, select: { id: true, tokenVersion: true } }),
        ]);
        if (user) throw new Error("family_import_conflict");
        const tokenData = createInvitationToken();
        const tokenVersion = (invitation?.tokenVersion ?? 0) + 1;
        const invitationData = {
          email,
          role: UserRole.PARENT,
          familyId: family.id,
          status: InvitationStatus.PENDING,
          tokenHash: tokenData.tokenHash,
          tokenCiphertext: encryptInvitationToken(tokenData.token),
          tokenVersion,
          expiresAt: tokenData.expiresAt,
          // Set only after Resend accepts the queued delivery.
          lastSentAt: null,
          invitedById,
        };
        const savedInvitation = invitation
          ? await tx.userInvitation.update({ where: { id: invitation.id }, data: invitationData, select: { id: true } })
          : await tx.userInvitation.create({ data: invitationData, select: { id: true } });
        if (invitation) {
          await cancelStaleInvitationDeliveryJobs(tx, savedInvitation.id, tokenVersion);
        }
        await createInvitationDeliveryJob(tx, {
          invitationId: savedInvitation.id,
          tokenVersion,
          idempotencyKey: `invitation-delivery-${savedInvitation.id}-${tokenVersion}`,
        });
        invitationsCount += 1;
      }
    }
    return invitationsCount;
  }, { isolationLevel: "Serializable" });

  return { ok: true as const, invitationsCount, familiesCount: preview.familiesCount };
}
