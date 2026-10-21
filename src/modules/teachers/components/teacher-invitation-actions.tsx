"use client";

import { Plus, Settings2, Upload } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogHeader, ResponsiveDialogTitle } from "@/components/ui/responsive-dialog";
import { TeacherInvitationImport } from "@/modules/teachers/components/teacher-invitation-import";
import { TeacherInvitationSingle } from "@/modules/teachers/components/teacher-invitation-single";

export function TeacherInvitationActions() {
  const [activeDialog, setActiveDialog] = useState<"invite" | "import" | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label="Opciones de docentes">
            <Settings2 aria-hidden="true" />
          </Button>
        } />
        <DropdownMenuContent align="end" className="w-max">
          <DropdownMenuItem onClick={() => setActiveDialog("invite")}><Plus aria-hidden="true" />Invitar docente</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveDialog("import")}><Upload aria-hidden="true" />Importar docentes</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ResponsiveDialog open={activeDialog === "invite"} onOpenChange={(open) => setActiveDialog(open ? "invite" : null)}>
        <ResponsiveDialogContent className="font-montserrat md:max-w-xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Invitar docente</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Completá los datos para enviar una invitación por correo.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody><TeacherInvitationSingle /></ResponsiveDialogBody>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog open={activeDialog === "import"} onOpenChange={(open) => setActiveDialog(open ? "import" : null)}>
        <ResponsiveDialogContent className="font-montserrat md:max-w-xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Importar docentes</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Importá una planilla para invitar a varios docentes.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="[&_input[type=file]]:max-w-full"><TeacherInvitationImport /></ResponsiveDialogBody>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
