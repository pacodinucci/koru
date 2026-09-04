"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isAdminRole } from "@/modules/auth/roles";
import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { sendUserInvitationEmail } from "@/modules/mailing/server/mailing.service";
import {
  invitationErrorState,
  type UserInvitationActionState,
} from "@/modules/users/lib/user-invitation-feedback";
import {
  createUserInvitation,
  deleteUserForAdmin,
  listFamiliesForInvitation,
  listUserInvitations,
  listUsers,
  resendUserInvitation,
  revokeUserInvitation,
  updateUserRole,
} from "@/modules/users/server/users.repository";

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  familyId: z.string().min(1).optional(),
});
const invitationIdSchema = z.object({ id: z.string().min(1) });
const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(UserRole),
});
const deleteUserSchema = z.object({ userId: z.string().min(1) });

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
export async function listFamiliesForInvitationAdmin() {
  await requireAdmin();
  return listFamiliesForInvitation();
}

async function deliverInvitation(
  created: Awaited<ReturnType<typeof createUserInvitation>>,
) {
  return sendUserInvitationEmail({
    email: created.invitation.email,
    role: created.invitation.role,
    invitationId: created.invitation.id,
    invitationToken: created.token,
    familyName: created.invitation.family?.name,
  });
}

function revalidateInvitations() {
  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/mailing");
}

export async function createUserInvitationAction(
  _previousState: UserInvitationActionState,
  formData: FormData,
): Promise<UserInvitationActionState> {
  const admin = await requireAdmin();
  const parsed = createInvitationSchema.safeParse({
    email: getString(formData, "email"),
    role: getString(formData, "role"),
    familyId: getString(formData, "familyId") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Completá un email válido y los datos requeridos.",
    };
  }

  let created: Awaited<ReturnType<typeof createUserInvitation>>;
  try {
    created = await createUserInvitation({
      ...parsed.data,
      invitedById: admin.id,
    });
  } catch (error) {
    return invitationErrorState(error instanceof Error ? error.message : "");
  }

  try {
    const delivery = await deliverInvitation(created);
    revalidateInvitations();

    if (delivery.status === "failed") {
      return {
        status: "warning",
        message:
          "La invitación fue creada, pero el email no pudo enviarse. Podés reenviarla desde la lista.",
      };
    }
  } catch {
    revalidateInvitations();
    return {
      status: "warning",
      message:
        "La invitación fue creada, pero el email no pudo enviarse. Podés reenviarla desde la lista.",
    };
  }

  return {
    status: "success",
    message: "Invitación creada y enviada correctamente.",
  };
}

export async function resendUserInvitationAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = invitationIdSchema.safeParse({ id: getString(formData, "id") });
  if (!parsed.success) return;

  try {
    await deliverInvitation(await resendUserInvitation(parsed.data.id, admin.id));
    revalidateInvitations();
  } catch (error) {
    resolveInvitationError(error instanceof Error ? error.message : "");
  }
}

export async function revokeUserInvitationAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = invitationIdSchema.safeParse({ id: getString(formData, "id") });
  if (!parsed.success) return;

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
  if (!parsed.success || (parsed.data.userId === admin.id && !isAdminRole(parsed.data.role))) return;

  try {
    await updateUserRole(parsed.data);
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/teachers");
    revalidatePath("/dashboard/students");
  } catch {
    return;
  }
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = deleteUserSchema.safeParse({ userId: getString(formData, "userId") });
  if (!parsed.success) return;

  try {
    await deleteUserForAdmin({ userId: parsed.data.userId, adminId: admin.id });
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/teachers");
    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/calendar");
  } catch {
    return;
  }
}

function resolveInvitationError(error: string) {
  const messages: Record<string, string> = {
    user_already_exists: "Ese email ya tiene un usuario creado.",
    invitation_already_accepted: "Esa invitación ya fue aceptada.",
    family_required_for_parent: "Las invitaciones para familia deben tener una familia asignada.",
    family_only_for_parent: "Solo las invitaciones para familia pueden tener una familia asignada.",
    family_not_found: "La familia seleccionada ya no está disponible.",
    invitation_not_revocable: "Solo se pueden revocar invitaciones pendientes.",
    invitation_not_resendable: "Solo se pueden reenviar invitaciones pendientes.",
  };
  return messages[error] ?? "No pudimos procesar la invitación.";
}
