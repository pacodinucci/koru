"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPlanAction } from "@/modules/families/server/families.actions";

type EventualItemDraft = { id: string; name: string; suggestedAmount: string };

function emptyItem(): EventualItemDraft {
  return { id: crypto.randomUUID(), name: "", suggestedAmount: "" };
}

export function CreatePlanForm() {
  const [items, setItems] = useState<EventualItemDraft[]>([]);

  function updateItem(id: string, field: keyof Omit<EventualItemDraft, "id">, value: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  }

  return <form action={createPlanAction} className="space-y-4">
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]"><label className="grid gap-1 text-sm font-medium text-slate-700">Nombre del plan<Input name="name" required placeholder="Ej.: Plan anual"/></label><label className="grid gap-1 text-sm font-medium text-slate-700">Cuota básica mensual<Input name="basicMonthlyFee" type="number" min="1" step="0.01" required placeholder="0,00"/></label></div>
    <section className="space-y-3 rounded-xl border border-slate-200 p-4"><div><h3 className="font-medium text-slate-900">Rubros eventuales</h3><p className="text-sm text-slate-600">Son opcionales y no se cobrarán automáticamente. Podés cargarlos ahora para usarlos luego en cada familia.</p></div>{items.map((item) => <div key={item.id} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end"><label className="grid gap-1 text-sm font-medium text-slate-700">Concepto<Input value={item.name} onChange={(event) => updateItem(item.id, "name", event.target.value)} required placeholder="Ej.: Materiales"/></label><label className="grid gap-1 text-sm font-medium text-slate-700">Importe sugerido<Input value={item.suggestedAmount} onChange={(event) => updateItem(item.id, "suggestedAmount", event.target.value)} type="number" min="0.01" step="0.01" required placeholder="0,00"/></label><Button type="button" variant="outline" onClick={() => setItems((current) => current.filter((candidate) => candidate.id !== item.id))}>Quitar</Button></div>)}<Button type="button" variant="outline" onClick={() => setItems((current) => [...current, emptyItem()])}>Agregar rubro eventual</Button></section>
    <input type="hidden" name="eventualItems" value={JSON.stringify(items.map(({ name, suggestedAmount }) => ({ name, suggestedAmount })))} />
    <div className="flex justify-end"><Button type="submit">Crear plan</Button></div>
  </form>;
}
