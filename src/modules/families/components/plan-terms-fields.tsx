"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { annualPlanInstallment, BILLING_MONTHS } from "@/modules/families/lib/annual-plan";

export function PlanTermsFields({ annualFee = "", discountPercent = "0", installmentCount = 12, startMonth = 1 }: { annualFee?: string; discountPercent?: string; installmentCount?: number; startMonth?: number }) {
  const [fee, setFee] = useState(annualFee);
  const [discount, setDiscount] = useState(discountPercent);
  const [count, setCount] = useState(String(installmentCount));
  let preview: string | null = null;
  try {
    const first = annualPlanInstallment(fee, discount, Number(count)).netAmount;
    const last = annualPlanInstallment(fee, discount, Number(count), Number(count) - 1).netAmount;
    const currency = (amount: string) => Number(amount).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
    preview = first === last ? currency(first) : currency(first) + " a " + currency(last) + " (ajuste de centavos)";
  } catch { /* Incomplete inputs do not have a preview. */ }
  return <>
    <label className="grid gap-1 text-sm font-medium text-slate-700">Cuota anual<Input name="annualFee" type="number" min="0.01" step="0.01" value={fee} onChange={e => setFee(e.target.value)} required /></label>
    <label className="grid gap-1 text-sm font-medium text-slate-700">Cuotas<Input name="installmentCount" type="number" min="1" max="12" step="1" value={count} onChange={e => setCount(e.target.value)} required /></label>
    <label className="grid gap-1 text-sm font-medium text-slate-700">Mes de inicio del cobro<select name="startMonth" defaultValue={startMonth} className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm" required>{BILLING_MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label>
    <label className="grid gap-1 text-sm font-medium text-slate-700">Descuento (%)<Input name="discountPercent" type="number" min="0" max="100" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} required /></label>
    <p className="text-sm text-slate-600 md:col-span-full" aria-live="polite">{preview ? "Importe por cuota con descuento: " + preview : "Completá el importe anual y las cuotas para ver el cálculo."}</p>
  </>;
}
