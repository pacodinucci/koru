"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { FamilyFinancialCard } from "@/modules/families/components/family-financial-card";
import {
  assignFamilyStudentAction,
  assignFamilyUserAction,
  changeFamilyStatusAction,
  getFamilyDetailAction,
} from "@/modules/families/server/families.actions";

const labels = {
  ACTIVE: "Activa",
  SUSPENDED: "Suspendida",
  INACTIVE: "Inactiva",
} as const;

type FamilyDetail = NonNullable<Awaited<ReturnType<typeof getFamilyDetailAction>>>;
type MemberOptions = {
  users: Array<{ id: string; name: string | null; email: string; familyId: string | null }>;
  students: Array<{ id: string; firstName: string; lastName: string; familyId: string | null }>;
  plans: Array<{ id: string; name: string; isActive: boolean }>;
};

export function ManageFamilyDialog({
  familyId,
  familyName,
  familyStatus,
  options,
  canWaive,
  open,
  onOpenChange,
}: {
  familyId: string | null;
  familyName: string | null;
  familyStatus: keyof typeof labels | null;
  options: MemberOptions;
  canWaive: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<FamilyDetail | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen || !familyId) return;

    setDetail(null);
    startTransition(async () => setDetail(await getFamilyDetailAction(familyId)));
  }

  if (!familyId || !familyName || !familyStatus) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="md:max-w-5xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Gestionar familia</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Administrá integrantes, estado y cuenta corriente de {familyName}. Los planes se asignan a cada alumno desde la ficha de la familia.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          {isPending ? <p className="py-8 text-center text-sm text-slate-600">Cargando información de la familia…</p> : null}
          {!isPending && !detail ? <p className="py-8 text-center text-sm text-slate-600">No pudimos cargar esta familia.</p> : null}
          {detail ? (
            <div className="space-y-6">
              <section className="grid gap-3 rounded-xl border border-slate-200 p-4 lg:grid-cols-2">
                <form action={assignFamilyUserAction} className="grid gap-2">
                  <input type="hidden" name="familyId" value={familyId} />
                  <label className="grid flex-1 gap-1 text-sm font-medium text-slate-700">Asignar usuario
                    <select name="userId" defaultValue="" className="h-9 rounded-md border border-input bg-background px-3 text-sm" required>
                      <option value="" disabled>Seleccionar usuario</option>
                      {options.users.filter((user) => !user.familyId || user.familyId === familyId).map((user) => <option key={user.id} value={user.id}>{user.name || user.email}</option>)}
                    </select>
                  </label>
                  <Button type="submit" variant="outline" className="w-full">Asignar</Button>
                </form>
                <form action={assignFamilyStudentAction} className="grid gap-2">
                  <input type="hidden" name="familyId" value={familyId} />
                  <label className="grid flex-1 gap-1 text-sm font-medium text-slate-700">Asignar alumno
                    <select name="studentId" defaultValue="" className="h-9 rounded-md border border-input bg-background px-3 text-sm" required>
                      <option value="" disabled>Seleccionar alumno</option>
                      {options.students.filter((student) => !student.familyId || student.familyId === familyId).map((student) => <option key={student.id} value={student.id}>{student.lastName}, {student.firstName}</option>)}
                    </select>
                  </label>
                  <Button type="submit" variant="outline" className="w-full">Asignar</Button>
                </form>
                <form action={changeFamilyStatusAction} className="grid gap-2">
                  <input type="hidden" name="familyId" value={familyId} />
                  <label className="grid flex-1 gap-1 text-sm font-medium text-slate-700">Estado
                    <select name="status" defaultValue={familyStatus} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                      {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <Button type="submit" variant="outline" className="w-full">Guardar</Button>
                </form>
              </section>
              <FamilyFinancialCard family={detail} eventualChargeItems={detail.eventualChargeItems} canManagePayments={detail.canManagePayments} canWaive={canWaive} />
            </div>
          ) : null}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
