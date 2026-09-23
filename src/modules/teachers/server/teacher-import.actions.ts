"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/auth/server/auth-guards";
import { createUserInvitation } from "@/modules/users/server/users.repository";
import { runInvitationDeliveryWorker } from "@/modules/mailing/server/invitation-delivery-worker.service";

export type TeacherImportState = { message: string; errors: string[]; imported: number };
export const initialTeacherImportState: TeacherImportState = { message: "", errors: [], imported: 0 };
const norm = (value: unknown) => String(value ?? "").trim();
const key = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export async function importTeacherInvitationsAction(_: TeacherImportState, formData: FormData): Promise<TeacherImportState> {
  const actor = await requireRole(["SUPERADMIN"]);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { message: "Elegí una planilla.", errors: [], imported: 0 };
  try {
    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const teacherRole = await prisma.role.findFirst({ where: { baseRole: UserRole.TEACHER, isActive: true }, select: { id: true } });
    if (!teacherRole) return { message: "No existe un rol docente activo.", errors: [], imported: 0 };
    const knownGroups = await prisma.teacherProfile.findMany({ where: { organizationGroup: { not: null } }, select: { organizationGroup: true } });
    const groupByKey = new Map(knownGroups.flatMap((item) => item.organizationGroup ? [[key(item.organizationGroup), item.organizationGroup] as const] : []));
    const errors: string[] = []; let imported = 0; const seen = new Set<string>();
    for (const [index, row] of rows.entries()) {
      const name = norm(row.Nombre); const position = norm(row.Puesto); const email = norm(row.Correo).toLowerCase(); const requestedGroup = norm(row.Grupo);
      if (!name || !position || !/^\S+@\S+\.\S+$/.test(email)) { errors.push(`Fila ${index + 2}: faltan Nombre, Puesto o Correo válido.`); continue; }
      if (seen.has(email)) { errors.push(`Fila ${index + 2}: correo repetido.`); continue; } seen.add(email);
      try { await createUserInvitation({ email, accessRoleId: teacherRole.id, invitedById: actor.id, teacherName: name, teacherPosition: position, teacherGroup: requestedGroup ? (groupByKey.get(key(requestedGroup)) ?? requestedGroup) : undefined, teacherGroupMatched: Boolean(requestedGroup && groupByKey.has(key(requestedGroup))) }); imported += 1; }
      catch (error) { errors.push(`Fila ${index + 2}: ${error instanceof Error && error.message === "user_already_exists" ? "el correo ya tiene cuenta" : "no se pudo crear la invitación"}.`); }
    }
    if (imported) { try { await runInvitationDeliveryWorker(); } catch {} revalidatePath("/dashboard/teachers"); }
    return { message: imported ? `${imported} invitación(es) creadas.` : "No se crearon invitaciones.", errors, imported };
  } catch { return { message: "No pudimos leer la planilla.", errors: [], imported: 0 }; }
}
