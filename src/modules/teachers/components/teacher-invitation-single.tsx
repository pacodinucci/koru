"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createTeacherInvitationAction,
  type TeacherSingleInvitationState,
} from "@/modules/teachers/server/teacher-import.actions";

const initialTeacherSingleInvitationState: TeacherSingleInvitationState = { status: "idle", message: "" };

function SubmitInvitation() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creando invitación..." : "Enviar invitación"}
    </Button>
  );
}

export function TeacherInvitationSingle() {
  const [state, action] = useActionState(
    createTeacherInvitationAction,
    initialTeacherSingleInvitationState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        El docente recibirá un correo para crear su cuenta.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Nombre</span>
          <Input name="name" required />
        </label>
        <label className="space-y-1 text-sm">
          <span>Puesto</span>
          <Input name="position" required />
        </label>
        <label className="space-y-1 text-sm">
          <span>Correo</span>
          <Input name="email" type="email" required />
        </label>
        <label className="space-y-1 text-sm">
          <span>Grupo (opcional)</span>
          <Input name="group" />
        </label>
      </div>
      <SubmitInvitation />
      {state.message ? (
        <p role="status" className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
