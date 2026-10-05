"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculatePlanDiscount } from "@/modules/families/lib/plan-discounts";
import { createPlanAction, type CreatePlanState } from "@/modules/families/server/families.actions";

type EventualItemDraft = { id: string; name: string; suggestedAmount: string; discountPercent: string; installmentCount: string };
type InitialItem = Omit<EventualItemDraft, "id">;

const initialState: CreatePlanState = { message: null };

function draftItem(item?: InitialItem): EventualItemDraft {
  return { id: crypto.randomUUID(), name: item?.name ?? "", suggestedAmount: item?.suggestedAmount ?? "", discountPercent: item?.discountPercent ?? "0", installmentCount: item?.installmentCount ?? "1" };
}

function netPreview(amount: string, discountPercent: string) {
  if (!amount) return null;
  try { return calculatePlanDiscount(amount, discountPercent).netAmount; }
  catch { return null; }
}

export function CreatePlanForm({ initialName = "", initialFee = "", initialDiscountPercent = "0", initialItems = [] }: {
  initialName?: string;
  initialFee?: string;
  initialDiscountPercent?: string;
  initialItems?: InitialItem[];
}) {
  const [items, setItems] = useState<EventualItemDraft[]>(() => initialItems.map(draftItem));
  const [monthlyFee, setMonthlyFee] = useState(initialFee);
  const [monthlyDiscount, setMonthlyDiscount] = useState(initialDiscountPercent);
  const [state, formAction, pending] = useActionState(createPlanAction, initialState);

  function updateItem(id: string, field: keyof InitialItem, value: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,25%)_220px_140px]">
        <label className="grid gap-1 text-sm font-medium text-slate-700">Nombre del plan
          <Input name="name" defaultValue={initialName} maxLength={120} required placeholder="Ej.: Plan anual" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">Cuota básica mensual
          <Input name="basicMonthlyFee" type="number" min="0.01" step="0.01" value={monthlyFee} onChange={(event) => setMonthlyFee(event.target.value)} required placeholder="0,00" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">Descuento (%)
          <Input name="discountPercent" type="number" min="0" max="100" step="0.01" value={monthlyDiscount} onChange={(event) => setMonthlyDiscount(event.target.value)} required />
        </label>
      </div>
      {netPreview(monthlyFee, monthlyDiscount) ? <p className="text-sm text-slate-600">Cuota mensual con descuento: {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(netPreview(monthlyFee, monthlyDiscount)))}</p> : null}
      <section className="space-y-3 rounded-xl border border-slate-200 p-4">
        <div>
          <h3 className="font-medium text-slate-900">Rubros eventuales</h3>
          <p className="text-sm text-slate-600">Son opcionales y no se cobrarán automáticamente. Podés modificarlos antes de crear el plan.</p>
        </div>
        {items.map((item) => (
          <div key={item.id} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_130px_130px_auto] md:items-end">
            <label className="grid gap-1 text-sm font-medium text-slate-700">Concepto
              <Input value={item.name} onChange={(event) => updateItem(item.id, "name", event.target.value)} required placeholder="Ej.: Materiales" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">Importe total sugerido
              <Input value={item.suggestedAmount} onChange={(event) => updateItem(item.id, "suggestedAmount", event.target.value)} type="number" min="0.01" step="0.01" required placeholder="0,00" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">Descuento (%)
              <Input value={item.discountPercent} onChange={(event) => updateItem(item.id, "discountPercent", event.target.value)} type="number" min="0" max="100" step="0.01" required />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">Cuotas
              <Input value={item.installmentCount} onChange={(event) => updateItem(item.id, "installmentCount", event.target.value)} type="number" min="1" max="120" step="1" required />
            </label>
            <Button type="button" variant="outline" onClick={() => setItems((current) => current.filter((candidate) => candidate.id !== item.id))}>Quitar</Button>
            {netPreview(item.suggestedAmount, item.discountPercent) ? <p className="text-sm text-slate-600 md:col-span-full">Total con descuento: {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(netPreview(item.suggestedAmount, item.discountPercent)))}</p> : null}
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setItems((current) => [...current, draftItem()])}>Agregar rubro eventual</Button>
      </section>
      <input type="hidden" name="eventualItems" value={JSON.stringify(items.map(({ name, suggestedAmount, discountPercent, installmentCount }) => ({ name, suggestedAmount, discountPercent, installmentCount })))} />
      {state.message ? <p role="alert" className="text-sm text-destructive">{state.message}</p> : null}
      <div className="flex justify-end"><Button type="submit" disabled={pending}>{pending ? "Creando..." : "Crear plan"}</Button></div>
    </form>
  );
}
