"use client";

import { UserRole } from "@prisma/client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { initialUserInvitationActionState } from "@/modules/users/lib/user-invitation-feedback";
import { createUserInvitationAction } from "@/modules/users/server/user-invitations.actions";

type Props = { families: Array<{ id: string; name: string }> };

const roleLabels: Record<UserRole, string> = { ADMIN: "Admin", ADMIN_TEACHER: "Admin docente", SUPERADMIN: "Superadmin", TEACHER: "Docente", PARENT: "Familia" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return <Button type="submit" className="h-9" disabled={pending}>{pending ? "Enviando..." : "Crear invitación"}</Button>;
}

export function CreateUserInvitationForm({ families }: Props) {
  const [state, formAction] = useActionState(createUserInvitationAction, initialUserInvitationActionState);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.PARENT);
  const [familyId, setFamilyId] = useState("");

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)_auto]">
      <input name="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="familia@ejemplo.com" className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500" />
      <select name="role" value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500">
        {Object.values(UserRole).map((value) => <option key={value} value={value}>{roleLabels[value]}</option>)}
      </select>
      {role === UserRole.PARENT ? (
        <select name="familyId" required value={familyId} onChange={(event) => setFamilyId(event.target.value)} className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500">
          <option value="">Asignar familia</option>
          {families.map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}
        </select>
      ) : <div />}
      <SubmitButton />
      {state.message ? <p className={`md:col-span-4 text-sm ${state.status === "error" ? "text-red-600" : state.status === "warning" ? "text-amber-700" : "text-emerald-700"}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null}
    </form>
  );
}
