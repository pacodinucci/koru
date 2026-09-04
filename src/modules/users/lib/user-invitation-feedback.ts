export type UserInvitationActionState = {
  status: "idle" | "success" | "warning" | "error";
  message: string | null;
};

export const initialUserInvitationActionState: UserInvitationActionState = {
  status: "idle",
  message: null,
};

export function invitationErrorState(error: string): UserInvitationActionState {
  const messages: Record<string, string> = {
    user_already_exists: "Ese email ya tiene un usuario creado.",
    invitation_already_accepted: "Esa invitación ya fue aceptada.",
    family_required_for_parent: "Asigná una familia antes de enviar la invitación.",
    family_only_for_parent: "Solo las invitaciones para familia pueden tener una familia asignada.",
    family_not_found: "La familia seleccionada ya no está disponible.",
  };

  return {
    status: "error",
    message: messages[error] ?? "No pudimos crear la invitación. Intentá de nuevo.",
  };
}
