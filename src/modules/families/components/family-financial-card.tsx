"use client";

import { ExternalLink } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from "@/components/ui/responsive-dialog";
import { Textarea } from "@/components/ui/textarea";
import { registerFamilyEventualChargeAction, registerFamilyPaymentAction, voidFamilyPaymentAction, waiveFamilyBalanceAction } from "@/modules/families/server/family-account.actions";
import { BILLING_MONTHS } from "@/modules/families/lib/annual-plan";
import { calculatePlanDiscount } from "@/modules/families/lib/plan-discounts";
import type { PendingFamilyCharge, UnallocatedFamilyCredit } from "@/modules/families/lib/payment-allocation";
import { argentinaToday, formatFamilyEntryDate } from "./family-payment-allocation-fields";
import { FamilyPaymentDialog } from "./family-payment-dialog";
import { FamilyCreditReconciliation } from "./family-credit-reconciliation";

type FinancialEntry = { id: string; type: "MONTHLY_CHARGE" | "EVENTUAL_CHARGE" | "PAYMENT" | "PAYMENT_REVERSAL" | "BALANCE_WAIVER"; amount: string; grossAmount: string | null; discountAmount: string | null; description: string; occurredAt: string; payment: { id: string; method: "CASH" | "BANK_TRANSFER" | "CARD" | "OTHER"; reference: string | null; status: "REGISTERED" | "VOIDED"; receipt: { id: string; status: "ACTIVE" | "VOIDED"; pdfUrl: string | null; number: number } | null } | null };
type FamilyFinancialCardProps = { family: { id: string; name: string; balance: string; entries: FinancialEntry[]; pendingCharges: PendingFamilyCharge[]; unallocatedCredits: UnallocatedFamilyCredit[] }; eventualChargeItems: Array<{ id: string; name: string; suggestedAmount: string; discountPercent: string; installmentCount: number; startMonth: number }>; canManagePayments: boolean; canWaive: boolean; onFinancialChange?: () => void };

const typeLabels: Record<FinancialEntry["type"], string> = { MONTHLY_CHARGE: "Cuota básica", EVENTUAL_CHARGE: "Cargo eventual", PAYMENT: "Pago", PAYMENT_REVERSAL: "Anulación", BALANCE_WAIVER: "Condonación" };
const methodLabels: Record<NonNullable<FinancialEntry["payment"]>["method"], string> = { CASH: "Efectivo", BANK_TRANSFER: "Transferencia", CARD: "Tarjeta", OTHER: "Otro" };
function currency(value: string | number) { return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(value)); }
function EntryStatus({ entry }: { entry: FinancialEntry }) { if (entry.payment?.status === "VOIDED") return <Badge variant="danger">Anulado</Badge>; if (entry.type === "BALANCE_WAIVER") return <Badge variant="special">Condonado</Badge>; return <Badge variant="info">Registrado</Badge>; }

export function FamilyFinancialCard({ family, eventualChargeItems, canManagePayments, canWaive, onFinancialChange }: FamilyFinancialCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [paymentDraft, setPaymentDraft] = useState<{ data: FormData; form: HTMLFormElement } | null>(null);
  const [paidAt, setPaidAt] = useState(argentinaToday);
  const registrationBlocked = family.unallocatedCredits.length > 0;
  const allocationOpen = paymentDraft !== null;
  const [chargeOpen, setChargeOpen] = useState(false);
  const [chargeError, setChargeError] = useState<string | null>(null);
  const [eventualChargeItemId, setEventualChargeItemId] = useState("");
  const selectedEventualChargeItem = eventualChargeItems.find((item) => item.id === eventualChargeItemId);
  const selectedAmounts = selectedEventualChargeItem ? calculatePlanDiscount(selectedEventualChargeItem.suggestedAmount, selectedEventualChargeItem.discountPercent) : null;

  function preparePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (registrationBlocked || isPending || allocationOpen || !form.reportValidity()) return;
    setMessage(null);
    setPaymentDraft({ data: new FormData(form), form });
  }

  function submit(event: FormEvent<HTMLFormElement>, action: (data: FormData) => Promise<{ ok: boolean; message: string }>) {
    event.preventDefault(); const form = event.currentTarget; setMessage(null);
    startTransition(async () => { const result = await action(new FormData(form)); setMessage(result.message); if (result.ok) { form.reset(); setEventualChargeItemId(""); onFinancialChange?.(); router.refresh(); } });
  }
  function closeCharge() {
    if (!isPending) {
      setChargeOpen(false);
      setChargeError(null);
      setEventualChargeItemId("");
    }
  }

  function registerCharge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (isPending || !form.reportValidity()) return;
    const data = new FormData(form);
    setChargeError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await registerFamilyEventualChargeAction(data);
        if (!result.ok) { setChargeError(result.message); return; }
        form.reset();
        setEventualChargeItemId("");
        setChargeOpen(false);
        setMessage(result.message);
        onFinancialChange?.();
        router.refresh();
      } catch {
        setChargeError("No se pudo registrar el cargo. Revisá los movimientos antes de reintentar.");
      }
    });
  }

  function voidPayment(event: FormEvent<HTMLFormElement>) { if (!window.confirm("¿Querés anular este pago? El saldo se revertirá y el recibo quedará invalidado.")) { event.preventDefault(); return; } submit(event, voidFamilyPaymentAction); }

  return <section className="space-y-4 border-t border-slate-200 pt-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="font-medium text-slate-900">Ficha financiera</h3><p className="text-xs text-slate-600">Cuenta corriente, pagos, cargos y comprobantes de {family.name}.</p></div><div className="flex items-center gap-3">{canManagePayments ? <Button type="button" variant="outline" disabled={isPending} onClick={() => { setChargeError(null); setChargeOpen(true); }}>Agregar cargo</Button> : null}<div className="rounded-xl bg-slate-100 px-3 py-2 text-right"><p className="text-xs text-slate-600">Saldo actual</p><p className={`font-semibold ${Number(family.balance) > 0 ? "text-amber-700" : "text-emerald-700"}`}>{currency(family.balance)}</p></div></div></div>
    {canManagePayments ? <div className="space-y-3">
      <form aria-label="Registrar pago" onSubmit={preparePayment} className="grid gap-2 rounded-xl border border-slate-200 p-3 lg:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)_minmax(280px,auto)] lg:items-end">
        <input type="hidden" name="familyId" value={family.id}/>
        <label className="grid gap-1 text-xs font-medium text-slate-700">Importe<Input name="amount" type="number" min="0.01" step="0.01" required/></label>
        <label className="grid gap-1 text-xs font-medium text-slate-700">Medio<select name="method" defaultValue="BANK_TRANSFER" className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="CASH">Efectivo</option><option value="BANK_TRANSFER">Transferencia</option><option value="CARD">Tarjeta</option><option value="OTHER">Otro</option></select></label>
        <label className="grid gap-1 text-xs font-medium text-slate-700">Referencia<Input name="reference" maxLength={160} placeholder="Opcional"/></label>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
          <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-700">Fecha del pago<Input name="paidAt" type="date" required value={paidAt} onChange={(event) => setPaidAt(event.target.value)}/></label>
          <Button disabled={isPending || registrationBlocked || allocationOpen} type="submit">Registrar pago</Button>
        </div>
      </form>
      {paymentDraft ? <FamilyPaymentDialog title="Asignar pago a conceptos" description={`Pago de ${currency(String(paymentDraft.data.get("amount")))} · Fecha ${String(paymentDraft.data.get("paidAt")).split("-").reverse().join("/")}`} total={String(paymentDraft.data.get("amount"))} charges={family.pendingCharges} onClose={() => setPaymentDraft(null)} onConfirm={(allocations) => {
        paymentDraft.data.set("allocations", JSON.stringify(allocations));
        return registerFamilyPaymentAction(paymentDraft.data);
      }} onSuccess={(resultMessage) => { paymentDraft.form.reset(); setPaidAt(argentinaToday()); setPaymentDraft(null); setMessage(resultMessage); onFinancialChange?.(); router.refresh(); }} /> : null}
      {chargeOpen ? <ResponsiveDialog open onOpenChange={(open) => { if (!open) closeCharge(); }}>
        <ResponsiveDialogContent className="md:max-w-lg [font-family:var(--font-montserrat)]" showCloseButton={!isPending}>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="[font-family:var(--font-montserrat)]">Agregar cargo</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Agregá un cargo adicional a la cuenta de {family.name}.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
      <form aria-label="Registrar cargo" aria-busy={isPending} onSubmit={registerCharge} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ResponsiveDialogBody className="space-y-4">
            <p className="text-xs text-slate-600">Los rubros del plan se aplican por alumno desde «Cargos por alumno». Este formulario de cargos permite agregar conceptos libres adicionales.</p><input type="hidden" name="familyId" value={family.id}/><label className="grid gap-1 text-xs font-medium text-slate-700">Rubro<select name="eventualChargeItemId" value={eventualChargeItemId} onChange={(event) => setEventualChargeItemId(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="">Concepto libre</option>{eventualChargeItems.map((item) => <option key={item.id} value={item.id} disabled>{item.name} · desde el plan de cada alumno</option>)}</select></label><label className="grid gap-1 text-xs font-medium text-slate-700">Concepto<Input key={`description-${eventualChargeItemId}`} name="description" required readOnly={Boolean(selectedEventualChargeItem)} defaultValue={selectedEventualChargeItem?.name ?? ""} placeholder="Ej.: Salida educativa"/></label><label className="grid gap-1 text-xs font-medium text-slate-700">Importe total con descuento<Input key={`amount-${eventualChargeItemId}`} name="amount" type="number" min={selectedEventualChargeItem ? "0" : "0.01"} step="0.01" required readOnly={Boolean(selectedEventualChargeItem)} defaultValue={selectedAmounts?.netAmount ?? ""}/></label>
      {selectedEventualChargeItem && selectedAmounts ? <p className="text-xs text-slate-600">Importe original {currency(selectedAmounts.grossAmount)} · descuento {selectedEventualChargeItem.discountPercent}% ({currency(selectedAmounts.discountAmount)}) · total {currency(selectedAmounts.netAmount)}. Se dividirá en {selectedEventualChargeItem.installmentCount} {selectedEventualChargeItem.installmentCount === 1 ? "cuota mensual" : "cuotas mensuales"} desde {BILLING_MONTHS[selectedEventualChargeItem.startMonth - 1]} del año actual. Se registrarán las cuotas correspondientes hasta el mes actual; los pagos se cargan por separado.</p> : null}
            {chargeError ? <p role="alert" className="text-sm text-red-700">{chargeError}</p> : null}
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <Button type="button" variant="outline" disabled={isPending} onClick={closeCharge}>Cancelar</Button>
            <Button disabled={isPending} type="submit">{isPending ? "Registrando…" : "Registrar cargo"}</Button>
          </ResponsiveDialogFooter>
        </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog> : null}
    </div> : null}
    <FamilyCreditReconciliation familyId={family.id} credits={family.unallocatedCredits} charges={family.pendingCharges} canManagePayments={canManagePayments} canWaive={canWaive} disabled={isPending || allocationOpen} onFinancialChange={onFinancialChange} />
    {canWaive && Number(family.balance) > 0 ? <form onSubmit={(event) => submit(event, waiveFamilyBalanceAction)} className="grid gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 md:grid-cols-[minmax(0,1fr)_160px_auto] md:items-end"><input type="hidden" name="familyId" value={family.id}/><label className="grid gap-1 text-xs font-medium text-amber-900">Motivo de condonación<Textarea name="reason" minLength={2} maxLength={300} required rows={1} className="min-h-9 resize-none"/></label><label className="grid gap-1 text-xs font-medium text-amber-900">Importe máximo {currency(family.balance)}<Input name="amount" type="number" min="0.01" max={family.balance} step="0.01" required/></label><Button disabled={isPending} type="submit" variant="outline">Condonar saldo</Button></form> : null}
    {message ? <p className="text-sm text-slate-700" role="status">{message}</p> : null}
    <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[720px] text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-600"><tr><th className="px-3 py-2 font-medium">Fecha</th><th className="px-3 py-2 font-medium">Tipo</th><th className="px-3 py-2 font-medium">Detalle</th><th className="px-3 py-2 text-right font-medium">Importe</th><th className="px-3 py-2 font-medium">Estado</th><th className="px-3 py-2 font-medium">Acciones</th></tr></thead><tbody>{family.entries.length === 0 ? <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-600">Todavía no hay movimientos registrados.</td></tr> : family.entries.map((entry) => <tr key={entry.id} className="border-t border-slate-100"><td className="px-3 py-2 text-slate-600">{formatFamilyEntryDate(entry.occurredAt)}</td><td className="px-3 py-2">{typeLabels[entry.type]}</td><td className="px-3 py-2"><p>{entry.description}</p>{entry.discountAmount && Number(entry.discountAmount) > 0 ? <p className="text-xs text-slate-500">Original {currency(entry.grossAmount ?? entry.amount)} · descuento {currency(entry.discountAmount)}</p> : null}{entry.payment ? <p className="text-xs text-slate-500">{methodLabels[entry.payment.method]}{entry.payment.reference ? ` · ${entry.payment.reference}` : ""}</p> : null}</td><td className={`px-3 py-2 text-right font-medium ${Number(entry.amount) > 0 ? "text-amber-700" : "text-emerald-700"}`}>{currency(entry.amount)}</td><td className="px-3 py-2"><EntryStatus entry={entry}/></td><td className="px-3 py-2"><div className="flex flex-wrap gap-2">{entry.payment?.receipt?.pdfUrl && entry.payment.receipt.status === "ACTIVE" ? <Button nativeButton={false} render={<a href={`/api/receipts/${entry.payment.receipt.id}/download`} target="_blank" rel="noreferrer"/>} size="sm" variant="outline"><ExternalLink/>Recibo #{entry.payment.receipt.number}</Button> : null}{canManagePayments && entry.payment?.status === "REGISTERED" ? <form onSubmit={voidPayment} className="flex gap-1"><input type="hidden" name="paymentId" value={entry.payment.id}/><Input name="reason" minLength={2} maxLength={300} required placeholder="Motivo" className="h-8 w-32"/><Button disabled={isPending} type="submit" size="sm" variant="destructive">Anular</Button></form> : null}</div></td></tr>)}</tbody></table></div>
  </section>;
}
