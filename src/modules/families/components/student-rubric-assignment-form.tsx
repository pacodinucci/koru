"use client";

import { PlusIcon } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent,
  ResponsiveDialogDescription, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { BillingMonthSelect } from "@/modules/families/components/billing-month-select";
import type { RubricCatalogItem } from "@/modules/families/components/rubric-catalog";
import { MAX_EVENTUAL_INSTALLMENTS, splitInstallmentAmounts } from "@/modules/families/lib/eventual-installments";
import { calculatePlanDiscount } from "@/modules/families/lib/plan-discounts";
import { assignRubricToStudentAction } from "@/modules/families/server/rubrics.actions";

export type StudentRubricAssignment = {
  id: string;
  rubricId: string;
  itemName: string;
  grossAmount: string;
  discountPercent: string;
  installmentCount: number;
  startPeriod: string;
};

export type StudentRubricAssignmentProps = { familyId: string; studentId: string; rubrics: RubricCatalogItem[] };
export const currency = (amount: string) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(amount));

function assignmentPreview(amount: string | undefined, percent: string, count: string) {
  if (!amount) return null;
  try {
    const discount = calculatePlanDiscount(amount, percent);
    const amounts = splitInstallmentAmounts(discount.netAmount, Number(count));
    const first = amounts[0];
    const last = amounts[amounts.length - 1];
    const installments = first === last
      ? `${count} ${count === "1" ? "cuota de" : "cuotas de"} ${currency(first)}`
      : `${count} cuotas de ${currency(first)} a ${currency(last)} (ajuste de centavos incluido)`;
    return { ...discount, installments };
  } catch {
    return null;
  }
}

export function StudentRubricAssignmentFields({ rubrics, assignment, pending, disabled = false, submitLabel }: {
  rubrics: RubricCatalogItem[];
  assignment?: StudentRubricAssignment;
  pending: boolean;
  disabled?: boolean;
  submitLabel: string;
}) {
  const [rubricId, setRubricId] = useState(assignment?.rubricId ?? "");
  const [installmentCount, setInstallmentCount] = useState(String(assignment?.installmentCount ?? 1));
  const [discountPercent, setDiscountPercent] = useState(assignment?.discountPercent ?? "0");
  const options = rubrics.filter((rubric) => rubric.isActive && rubric.id !== assignment?.rubricId);
  if (assignment) {
    options.unshift({ id: assignment.rubricId, name: assignment.itemName, amount: assignment.grossAmount, isActive: true });
  }
  const selectedRubric = options.find((rubric) => rubric.id === rubricId);
  const preview = assignmentPreview(selectedRubric?.amount, discountPercent, installmentCount);
  const startPeriod = assignment ? new Date(assignment.startPeriod) : null;

  return (
    <>
      <fieldset disabled={pending || disabled || !options.length} className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">Rubro
          <select name="rubricId" value={rubricId} onChange={(event) => setRubricId(event.target.value)} className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm" required>
            <option value="" disabled>Seleccionar rubro</option>
            {options.map((rubric) => <option key={rubric.id} value={rubric.id}>{rubric.name} · {currency(rubric.amount)}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">Cuotas
          <Input name="installmentCount" type="number" value={installmentCount} onChange={(event) => setInstallmentCount(event.target.value)} min="1" max={MAX_EVENTUAL_INSTALLMENTS} step="1" required />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">Mes de inicio{startPeriod ? ` · ${startPeriod.getUTCFullYear()}` : ""}
          <BillingMonthSelect defaultValue={startPeriod ? startPeriod.getUTCMonth() + 1 : 1} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">Descuento (%)
          <Input name="discountPercent" type="number" value={discountPercent} onChange={(event) => setDiscountPercent(event.target.value)} min="0" max="100" step="0.01" required />
        </label>
      </fieldset>
      <p className="text-xs text-slate-600">{startPeriod ? `Se conserva el año de inicio ${startPeriod.getUTCFullYear()}.` : "El mes elegido es el primer mes de cobro del año actual."} Las cuotas se imputan en meses consecutivos; con una sola cuota, el total se imputa ese mismo mes. El porcentaje se aplica al total antes de dividir las cuotas.</p>
      {assignment ? <p className="text-xs text-slate-600">Al mantener el rubro se conservan su nombre e importe bruto originales. Al cambiarlo se usa el importe actual del catálogo.</p> : <p className="text-xs text-slate-600">Cada rubro se agrega sin reemplazar los anteriores.</p>}
      {preview ? <p role="status" className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">Bruto: {currency(preview.grossAmount)} · Descuento ({discountPercent}%): {currency(preview.discountAmount)} · Neto: {currency(preview.netAmount)} · {preview.installments}. El cálculo definitivo se valida al guardar.</p> : null}
      {!options.length ? <p className="text-sm text-slate-600">No hay rubros activos para agregar. Cargá un rubro en el catálogo primero.</p> : null}
      <Button type="submit" disabled={pending || disabled || !preview} className="w-full">{pending ? "Guardando..." : submitLabel}</Button>
    </>
  );
}

function AssignmentCreationDialog({ familyId, studentId, rubrics, onClose }: StudentRubricAssignmentProps & { onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (previousState: { message: string | null; success?: boolean }, formData: FormData) => {
    const result = await assignRubricToStudentAction(previousState, formData);
    if (result.success) onClose();
    return result;
  }, { message: null as string | null });
  return (
    <ResponsiveDialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen && pending) return;
      setOpen(nextOpen);
      if (!nextOpen) onClose();
    }}>
      <ResponsiveDialogTrigger render={<Button type="button" className="w-full sm:w-auto" />}><PlusIcon />Agregar rubro</ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="font-montserrat md:max-w-lg" showCloseButton={!pending}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle style={{ fontFamily: "var(--font-montserrat)" }}>Agregar rubro</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Elegí el rubro, las cuotas, el mes y el descuento para este alumno.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          {open ? <form action={formAction} aria-label="Agregar rubro al alumno" aria-busy={pending} className="space-y-4">
            <input type="hidden" name="familyId" value={familyId} />
            <input type="hidden" name="studentId" value={studentId} />
            <StudentRubricAssignmentFields rubrics={rubrics} pending={pending} submitLabel="Guardar rubro" />
            {state.message ? <p role="alert" className="text-sm text-slate-700">{state.message}</p> : null}
          </form> : null}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export function StudentRubricAssignmentForm(props: StudentRubricAssignmentProps) {
  const [session, setSession] = useState(0);
  return <AssignmentCreationDialog key={session} {...props} onClose={() => setSession((value) => value + 1)} />;
}
