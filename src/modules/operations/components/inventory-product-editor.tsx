"use client";

import { Pencil } from "lucide-react";
import { useState, useTransition, type ReactElement, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { adjustInventoryStockAction, updateInventoryProductAction } from "@/modules/operations/server/inventory.actions";

type Product = { id: string; name: string; unit: string; stock: number; minimumStock: number };
type ActionResult = { ok: boolean; message: string };
type Action = (formData: FormData) => Promise<ActionResult>;

export function InventoryProductEditor({ product, trigger, children }: { product: Product; trigger: ReactElement; children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function submit(action: Action, form: HTMLFormElement, reset = false) {
    setMessage("");
    startTransition(async () => {
      const result = await action(new FormData(form));
      setMessage(result.message);
      if (result.ok) {
        if (reset) form.reset();
        router.refresh();
      }
    });
  }

  return <ResponsiveDialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setMessage(""); }}>
    <ResponsiveDialogTrigger render={trigger}>
      {children}
    </ResponsiveDialogTrigger>
    <ResponsiveDialogContent className="font-montserrat md:max-w-md">
      <ResponsiveDialogHeader><ResponsiveDialogTitle>Editar producto</ResponsiveDialogTitle><ResponsiveDialogDescription>Actualizá los datos del catálogo o registrá un ajuste de stock con trazabilidad.</ResponsiveDialogDescription></ResponsiveDialogHeader>
      <ResponsiveDialogBody className="grid gap-6">
        <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); submit(updateInventoryProductAction, event.currentTarget); }}>
          <input type="hidden" name="productId" value={product.id} />
          <div className="grid gap-2"><Label htmlFor={`product-name-${product.id}`}>Nombre</Label><Input id={`product-name-${product.id}`} name="name" minLength={2} maxLength={120} defaultValue={product.name} required autoFocus /></div>
          <div className="grid gap-2"><Label htmlFor={`product-unit-${product.id}`}>Unidad</Label><Input id={`product-unit-${product.id}`} name="unit" minLength={1} maxLength={30} defaultValue={product.unit} required /></div>
          <div className="grid gap-2"><Label htmlFor={`product-minimum-${product.id}`}>Stock mínimo</Label><Input id={`product-minimum-${product.id}`} name="minimumStock" type="number" min="0" step="0.001" inputMode="decimal" defaultValue={product.minimumStock} required /></div>
          <div><Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar cambios"}</Button></div>
        </form>
        <form className="grid gap-4 border-t pt-5" onSubmit={(event) => { event.preventDefault(); submit(adjustInventoryStockAction, event.currentTarget, true); }}>
          <input type="hidden" name="productId" value={product.id} />
          <div><p className="font-semibold text-slate-900">Stock actual: {product.stock} {product.unit}</p><p className="mt-1 text-xs text-slate-500">El stock se ajusta mediante un movimiento para mantener el historial.</p></div>
          <div className="grid gap-2"><Label htmlFor={`product-adjustment-${product.id}`}>Ajuste de cantidad</Label><Input id={`product-adjustment-${product.id}`} name="quantity" type="number" step="0.001" inputMode="decimal" placeholder="Ej.: -2 o 5" required /></div>
          <div className="grid gap-2"><Label htmlFor={`product-reason-${product.id}`}>Motivo</Label><Input id={`product-reason-${product.id}`} name="reason" minLength={2} maxLength={500} placeholder="Ej.: recuento físico" required /></div>
          <div><Button type="submit" variant="outline" disabled={pending}>{pending ? "Guardando…" : "Registrar ajuste"}</Button></div>
        </form>
        {message ? <p role="status" className="text-sm text-slate-600">{message}</p> : null}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}><Pencil className="size-4" />Cerrar</Button></ResponsiveDialogFooter>
    </ResponsiveDialogContent>
  </ResponsiveDialog>;
}

