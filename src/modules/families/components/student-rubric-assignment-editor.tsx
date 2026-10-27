"use client";

import { PencilIcon } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent,
  ResponsiveDialogDescription, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import {
  StudentRubricAssignmentFields,
  type StudentRubricAssignment,
  type StudentRubricAssignmentProps,
} from "@/modules/families/components/student-rubric-assignment-form";
import { deleteStudentRubricAssignmentAction, updateStudentRubricAssignmentAction } from "@/modules/families/server/rubrics.actions";

type EditorProps = StudentRubricAssignmentProps & { assignment: StudentRubricAssignment };
const initialState = { message: null as string | null };

function AssignmentEditorDialog({ familyId, studentId, assignment, rubrics, onClose }: EditorProps & { onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [updateState, updateAction, updating] = useActionState(updateStudentRubricAssignmentAction, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteStudentRubricAssignmentAction, initialState);
  const pending = updating || deleting;
  const identifiers = <>
    <input type="hidden" name="familyId" value={familyId} />
    <input type="hidden" name="studentId" value={studentId} />
    <input type="hidden" name="assignmentId" value={assignment.id} />
  </>;

  return (
    <ResponsiveDialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen && pending) return;
      setOpen(nextOpen);
      if (!nextOpen) onClose();
    }}>
      <ResponsiveDialogTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label={`Editar rubro ${assignment.itemName}`} />}><PencilIcon /></ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="font-montserrat md:max-w-lg" showCloseButton={!pending}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle style={{ fontFamily: "var(--font-montserrat)" }}>Editar rubro · {assignment.itemName}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>El descuento se aplica solo a las cuotas sin pagos. Las cuotas pagadas o parcialmente pagadas conservan sus importes y su saldo pendiente. Con pagos imputados se conservan el rubro, la cantidad de cuotas y el mes de inicio; no se permite eliminar.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-4">
          {open ? <>
            <form action={updateAction} aria-label="Editar rubro del alumno" aria-busy={pending} className="space-y-4">
              {identifiers}
              <StudentRubricAssignmentFields rubrics={rubrics} assignment={assignment} pending={pending} disabled={confirmDelete} submitLabel="Guardar cambios" />
              {updateState.message ? <p role="alert" className="text-sm text-slate-700">{updateState.message}</p> : null}
            </form>
            <div className="space-y-3 border-t border-slate-200 pt-4">
              {confirmDelete ? <form action={deleteAction} aria-label="Eliminar rubro del alumno" aria-busy={pending} className="space-y-3">
                {identifiers}
                <p className="text-sm text-slate-700">¿Eliminar {assignment.itemName} de este alumno? Se quitarán su programación y los cargos asociados impagos. No se elimina el rubro del catálogo ni se modifican otros rubros.</p>
                <fieldset disabled={pending} className="flex flex-wrap gap-2">
                  <Button type="submit" variant="destructive" disabled={pending}>{deleting ? "Eliminando..." : "Confirmar eliminación"}</Button>
                  <Button type="button" variant="outline" disabled={pending} onClick={() => setConfirmDelete(false)}>Cancelar eliminación</Button>
                </fieldset>
              </form> : <Button type="button" variant="destructive" disabled={pending} onClick={() => setConfirmDelete(true)}>Eliminar rubro</Button>}
              {deleteState.message ? <p role="alert" className="text-sm text-slate-700">{deleteState.message}</p> : null}
            </div>
          </> : null}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export function StudentRubricAssignmentEditor(props: EditorProps) {
  const [session, setSession] = useState(0);
  return <AssignmentEditorDialog key={session} {...props} onClose={() => setSession((value) => value + 1)} />;
}
