"use client";

import { useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from "@/components/ui/responsive-dialog";
import type { PendingFamilyCharge } from "@/modules/families/lib/payment-allocation";
import { allocationSummary, currencyCents, FamilyPaymentAllocationFields, type AllocationDraft, type ChargeAllocation } from "./family-payment-allocation-fields";

type FamilyPaymentDialogProps = {
  total: string;
  charges: PendingFamilyCharge[];
  title: string;
  description: string;
  allowPartial?: boolean;
  onConfirm: (allocations: ChargeAllocation[]) => Promise<{ ok: boolean; message: string }>;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export function FamilyPaymentDialog({ total, charges, title, description, allowPartial = false, onConfirm, onClose, onSuccess }: FamilyPaymentDialogProps) {
  const [draft, setDraft] = useState<AllocationDraft>({});
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const summary = allocationSummary(charges, draft, total, allowPartial);

  function close() {
    if (!submitting.current) onClose();
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !summary.valid || !event.currentTarget.reportValidity()) return;
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await onConfirm(summary.allocations);
      if (result.ok) onSuccess(result.message);
      else setError(result.message);
    } catch {
      setError("No se pudo confirmar. Conservamos la asignación para que revises el estado antes de reintentar.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return <ResponsiveDialog open onOpenChange={(open) => { if (!open) close(); }}>
    <ResponsiveDialogContent className="md:max-w-2xl [font-family:var(--font-montserrat)]" showCloseButton={!isPending}>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle className="[font-family:var(--font-montserrat)]">{title}</ResponsiveDialogTitle>
        <ResponsiveDialogDescription>{description}</ResponsiveDialogDescription>
      </ResponsiveDialogHeader>
      <form aria-label="Asignar conceptos" onSubmit={confirm} aria-busy={isPending} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="sticky top-0 z-10 grid shrink-0 grid-cols-3 gap-2 border-y bg-slate-50 px-4 py-3 text-xs" role="status" aria-live="polite" aria-atomic="true">
          <div>Total<p className="break-words text-sm font-semibold">{currencyCents(summary.totalCents)}</p></div>
          <div>Asignado<p className="break-words text-sm font-semibold">{currencyCents(summary.assignedCents)}</p></div>
          <div>Restante<p className={`break-words text-sm font-semibold ${summary.remainingCents === 0 ? "text-emerald-700" : "text-amber-800"}`}>{currencyCents(summary.remainingCents)}</p></div>
        </div>
        <ResponsiveDialogBody className="space-y-3 overscroll-contain">
          <p className="text-sm text-slate-600">{allowPartial ? "Al elegir un concepto, se completa su saldo pendiente hasta el importe disponible. Podés editarlo y conciliar una parte dejando el resto pendiente." : "Al elegir un concepto, se completa su saldo pendiente hasta el importe disponible. Podés editarlo; para confirmar, el restante debe quedar en cero."}</p>
          <FamilyPaymentAllocationFields charges={charges} total={total} draft={draft} onChange={setDraft} disabled={isPending} />
          {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter className="sticky bottom-0">
          <Button type="button" variant="outline" disabled={isPending} onClick={close}>Cancelar</Button>
          <Button type="submit" disabled={isPending || !summary.valid}>{allowPartial ? "Confirmar conciliación" : "Confirmar pago"}</Button>
        </ResponsiveDialogFooter>
      </form>
    </ResponsiveDialogContent>
  </ResponsiveDialog>;
}
