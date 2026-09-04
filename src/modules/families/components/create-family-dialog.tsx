"use client";

import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogTrigger } from "@/components/ui/responsive-dialog";
import { createFamilyAction } from "@/modules/families/server/families.actions";

export function CreateFamilyDialog() {
  return (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger render={<Button type="button" />}>
        <PlusIcon /> Nueva familia
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="md:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Nueva familia</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Creala ahora y completá sus integrantes, plan y datos después.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <form action={createFamilyAction} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Nombre de la familia
              <Input name="name" required minLength={2} maxLength={120} placeholder="Ej. García" autoFocus />
            </label>
            <Button type="submit" className="justify-self-end">Crear familia</Button>
          </form>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}