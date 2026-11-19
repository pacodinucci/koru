"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { updateStudentRecordStatusAction } from "@/modules/students/server/student.actions";

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Confirmando…" : "Confirmar solicitud"}
    </Button>
  );
}

export function StudentRecordChangesDialog({
  studentId,
  studentName,
  guardianNames,
}: {
  studentId: string;
  studentName: string;
  guardianNames: string[];
}) {
  const [open, setOpen] = useState(false);
  const recipients = new Intl.ListFormat("es-AR", { style: "long", type: "conjunction" }).format(guardianNames);

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        Solicitar cambios
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="md:w-[min(calc(100vw-2rem),28rem)] [font-family:var(--font-montserrat)] [&_*]:[font-family:var(--font-montserrat)]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Solicitar cambios</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Vas a marcar el formulario de {studentName} como «Requiere cambios».
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-3">
          <p>Esta solicitud se comunicará por mail a {recipients || "los padres"} para que puedan realizar los cambios necesarios.</p>
          <p className="text-sm text-muted-foreground">
            Al confirmar se enviará un mail, aunque el formulario ya esté marcado como «Requiere cambios».
          </p>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose render={<Button type="button" variant="outline">Cancelar</Button>} />
          <form action={async (formData) => {
            await updateStudentRecordStatusAction(formData);
            setOpen(false);
          }}>
            <input type="hidden" name="studentId" value={studentId} />
            <input type="hidden" name="recordStatus" value="NEEDS_CHANGES" />
            <ConfirmButton />
          </form>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
