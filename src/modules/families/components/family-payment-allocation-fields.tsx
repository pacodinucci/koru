"use client";

import { Input } from "@/components/ui/input";
import { validateConsecutiveAllocations, type PendingFamilyCharge } from "@/modules/families/lib/payment-allocation";

export type AllocationDraft = Record<string, string>;
export type ChargeAllocation = { chargeEntryId: string; amount: string };

const argentinaTimeZone = "America/Argentina/Buenos_Aires";

export function argentinaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: argentinaTimeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatFamilyEntryDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR", { timeZone: argentinaTimeZone });
}

// Canonical monetary strings are converted once; all allocation arithmetic uses cents.
export function moneyCents(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function centsAmount(cents: number) {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

export function currencyCents(cents: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(cents / 100);
}

export function allocationSummary(charges: PendingFamilyCharge[], draft: AllocationDraft, total: string, allowPartial = false) {
  const totalCents = moneyCents(total) ?? 0;
  let assignedCents = 0;
  let valid = totalCents > 0 && Object.keys(draft).length > 0;
  const allocations: ChargeAllocation[] = [];
  for (const [chargeEntryId, value] of Object.entries(draft)) {
    const charge = charges.find((item) => item.id === chargeEntryId);
    const cents = moneyCents(value);
    const outstanding = charge ? moneyCents(charge.outstandingAmount) : null;
    if (cents === null || cents <= 0 || outstanding === null || cents > outstanding) valid = false;
    if (cents !== null) {
      assignedCents += cents;
      allocations.push({ chargeEntryId, amount: centsAmount(cents) });
    }
  }
  const remainingCents = totalCents - assignedCents;
  let error: string | null = null;
  if (valid) {
    try {
      validateConsecutiveAllocations(allocations.map(row => ({ chargeEntryId: row.chargeEntryId, cents: moneyCents(row.amount)! })), charges);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Seleccioná cuotas correlativas y completá las anteriores antes de adelantar la siguiente.";
      valid = false;
    }
  }
  valid = valid && Number.isSafeInteger(assignedCents) && remainingCents >= 0 && (allowPartial || remainingCents === 0);
  return { totalCents, assignedCents, remainingCents, valid, allocations, error };
}

type AllocationFieldsProps = {
  charges: PendingFamilyCharge[];
  draft: AllocationDraft;
  total: string;
  disabled: boolean;
  onChange: (draft: AllocationDraft) => void;
};

export function FamilyPaymentAllocationFields({ charges, draft, total, disabled, onChange }: AllocationFieldsProps) {
  const summary = allocationSummary(charges, draft, total);
  return <fieldset disabled={disabled} className="min-w-0 space-y-3">
    <legend className="mb-2 text-sm font-medium">Conceptos pendientes</legend>
    {charges.length === 0 ? <p className="text-sm text-slate-600">No hay conceptos pendientes para asignar. Se requiere revisión manual.</p> : charges.map((charge) => {
      const selected = Object.hasOwn(draft, charge.id);
      const previous = charge.eventualChargeScheduleId && charge.installmentNumber ? charges.filter(item =>
        item.eventualChargeScheduleId === charge.eventualChargeScheduleId && item.installmentNumber! < charge.installmentNumber!,
      ) : [];
      const canSelect = previous.every(item => moneyCents(draft[item.id] ?? "") === moneyCents(item.outstandingAmount));
      const currentCents = moneyCents(draft[charge.id] ?? "") ?? 0;
      const maximum = Math.max(0, Math.min(moneyCents(charge.outstandingAmount) ?? 0, summary.totalCents - (summary.assignedCents - currentCents)));
      return <div key={charge.id} className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-end">
        <label className="flex min-w-0 items-start gap-3 text-sm">
          <input type="checkbox" value={charge.id} checked={selected} disabled={!selected && (!canSelect || maximum === 0)} className="mt-1 size-4 shrink-0" onChange={(event) => {
            const next = { ...draft };
            if (event.target.checked) next[charge.id] = centsAmount(maximum);
            else {
              delete next[charge.id];
              if (charge.eventualChargeScheduleId && charge.installmentNumber) {
                for (const later of charges.filter(item => item.eventualChargeScheduleId === charge.eventualChargeScheduleId && item.installmentNumber! > charge.installmentNumber!)) delete next[later.id];
              }
            }
            onChange(next);
          }} />
          <span className="min-w-0 break-words"><span className="font-medium">{charge.description}</span><span className="block text-xs text-slate-600">Imputación {formatFamilyEntryDate(charge.occurredAt)}{charge.isFuture ? " · Cuota futura" : ""} · Pendiente {currencyCents(moneyCents(charge.outstandingAmount) ?? 0)}</span></span>
        </label>
        <label className="grid gap-1 text-xs font-medium text-slate-700">Importe a asignar
          <Input aria-label={`Importe para ${charge.description}`} type="number" inputMode="decimal" min="0.01" max={centsAmount(maximum)} step="0.01" required={selected} disabled={disabled || !selected} value={draft[charge.id] ?? ""} onChange={(event) => onChange({ ...draft, [charge.id]: event.target.value })} />
        </label>
      </div>;
    })}
  </fieldset>;
}
