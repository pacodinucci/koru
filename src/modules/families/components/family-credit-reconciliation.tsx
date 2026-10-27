"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { PendingFamilyCharge, UnallocatedFamilyCredit } from "@/modules/families/lib/payment-allocation";
import { reconcileFamilyCreditAction } from "@/modules/families/server/family-account.actions";
import { currencyCents, formatFamilyEntryDate, moneyCents } from "./family-payment-allocation-fields";
import { FamilyPaymentDialog } from "./family-payment-dialog";

type FamilyCreditReconciliationProps = {
  familyId: string;
  credits: UnallocatedFamilyCredit[];
  charges: PendingFamilyCharge[];
  canManagePayments: boolean;
  canWaive: boolean;
  disabled: boolean;
  onFinancialChange?: () => void;
};

export function FamilyCreditReconciliation({ familyId, credits, charges, canManagePayments, canWaive, disabled, onFinancialChange }: FamilyCreditReconciliationProps) {
  const router = useRouter();
  const [activeCredit, setActiveCredit] = useState<UnallocatedFamilyCredit | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (credits.length === 0) return null;
  const outstandingCents = charges.reduce((sum, charge) => sum + (moneyCents(charge.outstandingAmount) ?? 0), 0);
  const unallocatedCents = credits.reduce((sum, credit) => sum + (moneyCents(credit.unallocatedAmount) ?? 0), 0);

  return <section aria-label="Conciliación de movimientos anteriores" className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
    <h4 className="font-medium text-amber-950">Conciliación pendiente</h4>
    <p className="text-sm text-amber-950">Hay pagos o condonaciones anteriores sin conceptos asignados. Conciliá estos importes antes de registrar nuevos pagos. La conciliación conserva los movimientos y sus fechas. Si asignás un pago a cuotas futuras, ese importe queda reservado para ellas.</p>
    {unallocatedCents > outstandingCents ? <p className="text-sm font-medium text-amber-950">Los conceptos pendientes no alcanzan para conciliar todo el importe anterior. Se requiere revisión manual; no se crearán deudas ni condonaciones automáticamente.</p> : null}
    <ul className="space-y-2">
      {credits.map((credit) => {
        const waiver = credit.type === "BALANCE_WAIVER";
        const permitted = waiver ? canWaive : canManagePayments;
        return <li key={credit.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 p-3">
          <div className="min-w-0 text-sm"><p className="break-words font-medium">{waiver ? "Condonación" : "Pago"} · {credit.description}</p><p>{formatFamilyEntryDate(credit.occurredAt)} · Sin asignar: {currencyCents(moneyCents(credit.unallocatedAmount) ?? 0)}</p>
            {!permitted ? <p className="text-xs text-amber-900">{waiver ? "Necesitás permiso para condonar para conciliar este movimiento." : "Necesitás permiso para gestionar pagos para conciliar este movimiento."}</p> : null}
          </div>
          <Button type="button" variant="outline" disabled={disabled || !permitted || charges.length === 0} onClick={() => { if (permitted && !disabled) { setMessage(null); setActiveCredit(credit); } }}>{waiver ? "Conciliar condonación" : "Conciliar pago"}</Button>
        </li>;
      })}
    </ul>
    {message ? <p className="text-sm" role="status">{message}</p> : null}
    {activeCredit ? <FamilyPaymentDialog key={activeCredit.id} title={activeCredit.type === "BALANCE_WAIVER" ? "Conciliar condonación anterior" : "Conciliar pago anterior"} description="Asigná únicamente a deudas que correspondan a este movimiento anterior." total={activeCredit.unallocatedAmount} charges={activeCredit.type === "BALANCE_WAIVER" ? charges.filter(charge => !charge.isFuture) : charges} allowPartial onClose={() => setActiveCredit(null)} onConfirm={(allocations) => {
      const data = new FormData();
      data.set("familyId", familyId);
      data.set("creditEntryId", activeCredit.id);
      data.set("allocations", JSON.stringify(allocations));
      return reconcileFamilyCreditAction(data);
    }} onSuccess={(resultMessage) => { setMessage(resultMessage); setActiveCredit(null); onFinancialChange?.(); router.refresh(); }} /> : null}
  </section>;
}
