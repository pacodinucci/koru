"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  importTeacherInvitationsAction,
  type TeacherImportState,
} from "@/modules/teachers/server/teacher-import.actions";

const initialTeacherImportState: TeacherImportState = {
  message: "",
  errors: [],
  imported: 0,
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Importando..." : "Importar e invitar"}
    </Button>
  );
}

export function TeacherInvitationImport() {
  const [state, action] = useActionState(
    importTeacherInvitationsAction,
    initialTeacherImportState,
  );
  const errors = Array.isArray(state.errors) ? state.errors : [];

  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Subí una planilla XLSX o CSV con Nombre, Puesto, Correo y Grupo.
      </p>
      <input name="file" type="file" accept=".xlsx,.csv" required />
      <Submit />
      {state.message ? <p className="text-sm">{state.message}</p> : null}
      {errors.length > 0 ? (
        <ul className="list-disc pl-5 text-sm text-destructive">
          {errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      ) : null}
    </form>
  );
}
