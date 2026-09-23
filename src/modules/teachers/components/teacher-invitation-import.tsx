"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { importTeacherInvitationsAction, initialTeacherImportState } from "@/modules/teachers/server/teacher-import.actions";
function Submit() { const { pending } = useFormStatus(); return <Button disabled={pending} type="submit">{pending ? "Importando..." : "Importar e invitar"}</Button>; }
export function TeacherInvitationImport() { const [state, action] = useActionState(importTeacherInvitationsAction, initialTeacherImportState); return <form action={action} className="space-y-3"><p className="text-sm text-muted-foreground">Subí una planilla XLSX o CSV con Nombre, Puesto, Correo y Grupo.</p><input name="file" type="file" accept=".xlsx,.csv" required /><Submit />{state.message ? <p className="text-sm">{state.message}</p> : null}{state.errors.length ? <ul className="list-disc pl-5 text-sm text-destructive">{state.errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}</form>; }
