"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { submitMultiItemInventoryRequestAction } from "@/modules/operations/server/inventory.actions";

type Product = { id: string; name: string; unit: string; stock: number };
type Line = { productId: string; quantity: number };

const fieldClass = "h-9 rounded-md border border-slate-300 bg-white px-3 text-sm";

export function InventoryRequestForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: 1 }]);
  const [message, setMessage] = useState("");

  function updateLine(index: number, next: Partial<Line>) {
    setLines((current) => current.map((line, position) => position === index ? { ...line, ...next } : line));
  }

  function submit() {
    setMessage("");
    startTransition(async () => {
      const result = await submitMultiItemInventoryRequestAction(lines);
      setMessage(result.message);
      if (result.ok) {
        setLines([{ productId: "", quantity: 1 }]);
        router.refresh();
      }
    });
  }

  return <div className="grid gap-3">
    {lines.map((line, index) => <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto]">
      <select className={fieldClass} value={line.productId} onChange={(event) => updateLine(index, { productId: event.target.value })} required>
        <option value="">Producto</option>
        {products.map((product) => <option key={product.id} value={product.id} disabled={lines.some((current, position) => position !== index && current.productId === product.id)}>{product.name} ({product.stock} {product.unit})</option>)}
      </select>
      <input className={fieldClass} type="number" min="0.001" step="0.001" value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} aria-label="Cantidad" required />
      {lines.length > 1 ? <Button type="button" variant="outline" onClick={() => setLines((current) => current.filter((_, position) => position !== index))}>Quitar</Button> : null}
    </div>)}
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" disabled={lines.length >= Math.min(products.length, 50)} onClick={() => setLines((current) => [...current, { productId: "", quantity: 1 }])}>Agregar producto</Button>
      <Button type="button" disabled={pending || lines.some((line) => !line.productId || line.quantity <= 0)} onClick={submit}>{pending ? "Enviando…" : "Enviar solicitud"}</Button>
    </div>
    {message ? <p className="text-sm text-slate-600">{message}</p> : null}
  </div>;
}
