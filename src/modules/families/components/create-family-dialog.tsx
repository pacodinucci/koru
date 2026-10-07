"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogTrigger } from "@/components/ui/responsive-dialog";
import { createFamilyAction } from "@/modules/families/server/families.actions";
import type { CreateFamilyState } from "@/modules/families/server/families.actions";

const initialState: CreateFamilyState = { status: "idle", message: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" className="w-full" disabled={pending}>{pending ? "Creando familia..." : "Crear familia"}</Button>;
}

export function CreateFamilyDialog() {
  const [state, formAction] = useActionState(createFamilyAction, initialState);

  return (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger render={<Button type="button" />}>
        <PlusIcon /> Nueva familia
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="font-montserrat md:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle style={{ fontFamily: "var(--font-montserrat)" }}>Nueva familia</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Creala ahora y enviá las invitaciones. Podés completar sus integrantes, plan y datos después.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <form action={formAction} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Nombre de la familia
              <Input name="name" required minLength={2} maxLength={120} placeholder="Ej. García" autoFocus />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email principal
              <Input name="primaryEmail" type="email" required autoComplete="email" placeholder="familia@ejemplo.com" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Segundo email (opcional)
              <Input name="secondaryEmail" type="email" placeholder="otra-persona@ejemplo.com" />
            </label>
            {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-600" : state.status === "warning" ? "text-amber-700" : "text-emerald-700"}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null}
            <SubmitButton />
          </form>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
