"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { decideWholeInventoryRequestAction } from "@/modules/operations/server/inventory.actions";

type Line = { id: string; productName: string; requestedQuantity: number };

export function InventoryRequestDecisionForm({ requestId, teacherName, lines }: { requestId: string; teacherName: string; lines: Line[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [quantities, setQuantities] = useState<Record<string, number>>(() => Object.fromEntries(lines.map((line) => [line.id, line.requestedQuantity])));
  const [message, setMessage] = useState("");
  function submit() {
    startTransition(async () => {
      const result = await decideWholeInventoryRequestAction(requestId, lines.map((line) => ({ lineId: line.id, approvedQuantity: Number(quantities[line.id] ?? 0) })));
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }
  return <div className="grid gap-2 border-t pt-3"><p>{teacherName}: pedido de {lines.length} artículos</p>{lines.map((line) => <label key={line.id} className="flex items-center gap-2"><span className="min-w-36">{line.productName} ({line.requestedQuantity})</span><input className="h-8 w-28 rounded border border-slate-300 px-2" type="number" min="0" max={line.requestedQuantity} step="0.001" value={quantities[line.id] ?? 0} onChange={(event) => setQuantities((current) => ({ ...current, [line.id]: Number(event.target.value) }))} /></label>)}<Button type="button" variant="outline" disabled={pending} onClick={submit}>{pending ? "Resolviendo…" : "Resolver pedido completo"}</Button>{message ? <p className="text-xs text-slate-500">{message}</p> : null}</div>;
}