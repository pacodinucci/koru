"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/modules/auth/server/auth-guards";
import {
  createUserInvitation,
  listUserInvitations,
  listUsers,
  revokeUserInvitation,
  updateUserRole,
} from "@/modules/users/server/users.repository";

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
});

const revokeInvitationSchema = z.object({
  id: z.string().min(1),
});

const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(UserRole),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function listUsersForAdmin() {
  await requireAdmin();
  return listUsers();
}

export async function listUserInvitationsForAdmin() {
  await requireAdmin();
  return listUserInvitations();
}

export async function createUserInvitationAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = createInvitationSchema.safeParse({
    email: getString(formData, "email"),
    role: getString(formData, "role"),
  });

  if (!parsed.success) {
    return;
  }

  try {
    await createUserInvitation({
      email: parsed.data.email,
      role: parsed.data.role,
      invitedById: admin.id,
    });
    revalidatePath("/dashboard/users");
  } catch (error) {
    resolveInvitationError(error instanceof Error ? error.message : "");
  }
}

export async function revokeUserInvitationAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = revokeInvitationSchema.safeParse({
    id: getString(formData, "id"),
  });

  if (!parsed.success) {
    return;
  }

  try {
    await revokeUserInvitation(parsed.data.id);
    revalidatePath("/dashboard/users");
  } catch (error) {
    resolveInvitationError(error instanceof Error ? error.message : "");
  }
}

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = updateUserRoleSchema.safeParse({
    userId: getString(formData, "userId"),
    role: getString(formData, "role"),
  });

  if (!parsed.success) {
    return;
  }

  if (parsed.data.userId === admin.id && parsed.data.role !== "ADMIN") {
    return;
  }

  try {
    await updateUserRole(parsed.data);
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/teachers");
    revalidatePath("/dashboard/students");
  } catch {
    return;
  }
}

function resolveInvitationError(error: string) {
  if (error === "user_already_exists") {
    return "Ese email ya tiene un usuario creado.";
  }

  if (error === "invitation_already_accepted") {
    return "Esa invitación ya fue aceptada.";
  }

  if (error === "invitation_not_revocable") {
    return "Solo se pueden revocar invitaciones pendientes.";
  }

  return "No pudimos procesar la invitación.";
}
