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

export async function createUserInvitationAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = createInvitationSchema.safeParse({
    email: getString(formData, "email"),
    role: getString(formData, "role"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: "Revisá el email y el rol de la invitación.",
    };
  }

  try {
    await createUserInvitation({
      email: parsed.data.email,
      role: parsed.data.role,
      invitedById: admin.id,
    });
    revalidatePath("/dashboard/users");

    return {
      ok: true as const,
      message: "Invitación creada correctamente.",
    };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof Error ? resolveInvitationError(error.message) : "Error inesperado.",
    };
  }
}

export async function revokeUserInvitationAction(formData: FormData) {
  await requireAdmin();
  const parsed = revokeInvitationSchema.safeParse({
    id: getString(formData, "id"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: "Invitación inválida.",
    };
  }

  try {
    await revokeUserInvitation(parsed.data.id);
    revalidatePath("/dashboard/users");

    return {
      ok: true as const,
      message: "Invitación revocada correctamente.",
    };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof Error ? resolveInvitationError(error.message) : "Error inesperado.",
    };
  }
}

export async function updateUserRoleAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = updateUserRoleSchema.safeParse({
    userId: getString(formData, "userId"),
    role: getString(formData, "role"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: "Revisá el usuario y el rol.",
    };
  }

  if (parsed.data.userId === admin.id && parsed.data.role !== "ADMIN") {
    return {
      ok: false as const,
      message: "No podés quitarte tu propio rol admin.",
    };
  }

  try {
    await updateUserRole(parsed.data);
    revalidatePath("/dashboard/users");

    return {
      ok: true as const,
      message: "Rol actualizado correctamente.",
    };
  } catch {
    return {
      ok: false as const,
      message: "No pudimos actualizar el rol sin dejar el sistema sin admin.",
    };
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
