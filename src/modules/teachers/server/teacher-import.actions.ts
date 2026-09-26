"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/auth/server/auth-guards";
import { createUserInvitation } from "@/modules/users/server/users.repository";
import { runInvitationDeliveryWorker } from "@/modules/mailing/server/invitation-delivery-worker.service";

export type TeacherSingleInvitationState = { status: "idle" | "success" | "error"; message: string };
const singleInvitationSchema = z.object({
  name: z.string().trim().min(1),
  position: z.string().trim().min(1),
  email: z.email().transform((value) => value.toLowerCase()),
  group: z.string().trim(),
});

export type TeacherImportState = { message: string; errors: string[]; imported: number };
const norm = (value: unknown) => String(value ?? "").trim();
const key = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

async function getTeacherInvitationContext() {
  const teacherRole = await prisma.role.findFirst({
    where: { baseRole: UserRole.TEACHER, isActive: true },
    select: { id: true },
  });
  if (!teacherRole) return null;
  const knownGroups = await prisma.teacherProfile.findMany({
    where: { organizationGroup: { not: null } },
    select: { organizationGroup: true },
  });
  const groupByKey = new Map(
    knownGroups.flatMap((item) =>
      item.organizationGroup ? [[key(item.organizationGroup), item.organizationGroup] as const] : [],
    ),
  );
  return { roleId: teacherRole.id, groupByKey };
}

async function inviteTeacher(
  invitedById: string,
  context: NonNullable<Awaited<ReturnType<typeof getTeacherInvitationContext>>>,
  input: { name: string; position: string; email: string; group: string },
) {
  const matchedGroup = input.group ? context.groupByKey.get(key(input.group)) : undefined;
  await createUserInvitation({
    email: input.email,
    accessRoleId: context.roleId,
    invitedById,
    teacherName: input.name,
    teacherPosition: input.position,
    teacherGroup: (matchedGroup ?? input.group) || undefined,
    teacherGroupMatched: Boolean(matchedGroup),
  });
}

export async function createTeacherInvitationAction(
  _previousState: TeacherSingleInvitationState,
  formData: FormData,
): Promise<TeacherSingleInvitationState> {
  const actor = await requireRole(["SUPERADMIN"]);
  const parsed = singleInvitationSchema.safeParse({
    name: formData.get("name"),
    position: formData.get("position"),
    email: formData.get("email"),
    group: formData.get("group") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", message: "Completá nombre, puesto y un correo válido." };
  }
  const context = await getTeacherInvitationContext();
  if (!context) return { status: "error", message: "No existe un rol docente activo." };
  try {
    await inviteTeacher(actor.id, context, parsed.data);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error && error.message === "user_already_exists"
        ? "Ese correo ya tiene una cuenta."
        : "No pudimos crear la invitación. Intentá de nuevo.",
    };
  }
  try {
    await runInvitationDeliveryWorker();
  } catch (error) {
    console.error("teacher_invitation_delivery_trigger_failed", error);
  }
  revalidatePath("/dashboard/teachers");
  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/mailing");
  return { status: "success", message: "Invitación creada y encolada para su envío." };
}

export async function importTeacherInvitationsAction(_: TeacherImportState, formData: FormData): Promise<TeacherImportState> {
  const actor = await requireRole(["SUPERADMIN"]);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { message: "Elegí una planilla.", errors: [], imported: 0 };
  try {
    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const context = await getTeacherInvitationContext();
    if (!context) return { message: "No existe un rol docente activo.", errors: [], imported: 0 };
    const errors: string[] = []; let imported = 0; const seen = new Set<string>();
    for (const [index, row] of rows.entries()) {
      const name = norm(row.Nombre); const position = norm(row.Puesto); const email = norm(row.Correo).toLowerCase(); const requestedGroup = norm(row.Grupo);
      if (!name || !position || !/^\S+@\S+\.\S+$/.test(email)) { errors.push(`Fila ${index + 2}: faltan Nombre, Puesto o Correo válido.`); continue; }
      if (seen.has(email)) { errors.push(`Fila ${index + 2}: correo repetido.`); continue; } seen.add(email);
      try { await inviteTeacher(actor.id, context, { name, position, email, group: requestedGroup }); imported += 1; }
      catch (error) { errors.push(`Fila ${index + 2}: ${error instanceof Error && error.message === "user_already_exists" ? "el correo ya tiene cuenta" : "no se pudo crear la invitación"}.`); }
    }
    if (imported) {
      try { await runInvitationDeliveryWorker(); }
      catch (error) { console.error("teacher_invitation_delivery_trigger_failed", error); }
      revalidatePath("/dashboard/teachers");
      revalidatePath("/dashboard/users");
      revalidatePath("/dashboard/mailing");
    }
    return { message: imported ? `${imported} invitación(es) creadas.` : "No se crearon invitaciones.", errors, imported };
  } catch { return { message: "No pudimos leer la planilla.", errors: [], imported: 0 }; }
}
