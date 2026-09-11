"use client";

import { PackagePlus, Settings2, SlidersHorizontal } from "lucide-react";
import { useState, useTransition } from "react";
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
import {
  adjustInventoryStockAction,
  createInventoryProductAction,
  registerInventoryStockMovementAction,
  setInventoryMinimumStockAction,
} from "@/modules/operations/server/inventory.actions";

type Product = { id: string; name: string; unit: string; stock: number; minimumStock: number };
type ActionResult = { ok: boolean; message: string };
type Action = (formData: FormData) => Promise<ActionResult>;

export function InventoryAdminActions({
  products,
  canOperate,
  canConfigure,
}: {
  products: Product[];
  canOperate: boolean;
  canConfigure: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
      {canOperate ? <InventoryMovementDialog kind="stock-in" products={products} /> : null}
      {canOperate ? <InventoryMovementDialog kind="adjustment" products={products} /> : null}
      {canConfigure ? <InventoryConfigurationDialog products={products} /> : null}
    </div>
  );
}

function InventoryMovementDialog({ kind, products }: { kind: "stock-in" | "adjustment"; products: Product[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const isAdjustment = kind === "adjustment";
  const title = isAdjustment ? "Ajustar stock" : "Registrar ingreso";
  const description = isAdjustment
    ? "Corregí diferencias de inventario dejando el motivo registrado."
    : "Incorporá mercadería al stock disponible con su referencia de ingreso.";
  const action: Action = isAdjustment ? adjustInventoryStockAction : registerInventoryStockMovementAction;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage("");
    startTransition(async () => {
      const result = await action(new FormData(form));
      setMessage(result.message);
      if (result.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  const Icon = isAdjustment ? SlidersHorizontal : PackagePlus;
  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setMessage(""); }}>
      <ResponsiveDialogTrigger render={<Button type="button" variant={isAdjustment ? "outline" : "default"} className="w-full justify-center sm:w-auto" />}>
        <Icon className="size-4" />
        {title}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="font-montserrat md:max-w-md">
        <ResponsiveDialogHeader><ResponsiveDialogTitle>{title}</ResponsiveDialogTitle><ResponsiveDialogDescription>{description}</ResponsiveDialogDescription></ResponsiveDialogHeader>
        <form onSubmit={submit} className="contents">
          <ResponsiveDialogBody className="grid gap-4">
            <div className="grid gap-2"><Label htmlFor={`${kind}-product`}>Producto</Label><select id={`${kind}-product`} name="productId" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" required autoFocus><option value="">Seleccionar producto</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.stock} {product.unit}</option>)}</select></div>
            <div className="grid gap-2"><Label htmlFor={`${kind}-quantity`}>{isAdjustment ? "Ajuste de cantidad" : "Cantidad ingresada"}</Label><Input id={`${kind}-quantity`} name="quantity" type="number" min={isAdjustment ? undefined : "0.001"} step="0.001" inputMode="decimal" placeholder={isAdjustment ? "Ej.: -2 o 5" : "0"} required />{isAdjustment ? <p className="text-xs text-slate-500">Usá un valor negativo para descontar y uno positivo para sumar.</p> : null}</div>
            {!isAdjustment ? <div className="grid gap-2"><Label htmlFor="stock-in-unit-cost">Costo unitario <span className="text-slate-400">(opcional)</span></Label><Input id="stock-in-unit-cost" name="unitCost" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0,00" /></div> : null}
            <div className="grid gap-2"><Label htmlFor={`${kind}-reason`}>Motivo o referencia</Label><Input id={`${kind}-reason`} name="reason" minLength={2} maxLength={500} placeholder={isAdjustment ? "Ej.: recuento físico" : "Ej.: compra a proveedor"} required /></div>
            {message ? <p role="status" className="text-sm text-slate-600">{message}</p> : null}
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={pending || products.length === 0}>{pending ? "Guardando…" : title}</Button></ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function InventoryConfigurationDialog({ products }: { products: Product[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function submit(action: Action, form: HTMLFormElement) {
    setMessage("");
    startTransition(async () => {
      const result = await action(new FormData(form));
      setMessage(result.message);
      if (result.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setMessage(""); }}>
      <ResponsiveDialogTrigger render={<Button type="button" variant="outline" className="w-full justify-center sm:w-auto" />}><Settings2 className="size-4" />Configuración</ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="font-montserrat md:max-w-xl">
        <ResponsiveDialogHeader><ResponsiveDialogTitle>Configuración de inventario</ResponsiveDialogTitle><ResponsiveDialogDescription>Creá productos y definí el stock mínimo que activa las alertas.</ResponsiveDialogDescription></ResponsiveDialogHeader>
        <ResponsiveDialogBody className="grid gap-6">
          <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); submit(createInventoryProductAction, event.currentTarget); }}>
            <h3 className="font-semibold text-slate-900">Nuevo producto</h3>
            <div className="grid gap-3 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="inventory-product-name">Producto</Label><Input id="inventory-product-name" name="name" minLength={2} maxLength={120} required /></div><div className="grid gap-2"><Label htmlFor="inventory-product-unit">Unidad</Label><Input id="inventory-product-unit" name="unit" placeholder="Ej.: unidad, caja, ml" maxLength={30} required /></div></div>
            <div className="grid gap-2"><Label htmlFor="inventory-product-minimum">Stock mínimo</Label><Input id="inventory-product-minimum" name="minimumStock" type="number" min="0" step="0.001" inputMode="decimal" placeholder="0" required /></div>
            <div><Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Crear producto"}</Button></div>
          </form>
          <div className="border-t pt-5"><h3 className="font-semibold text-slate-900">Alertas de stock</h3><p className="mt-1 text-sm text-slate-500">Actualizá el mínimo esperado de cada producto.</p><div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">{products.length ? products.map((product) => <form key={product.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-end" onSubmit={(event) => { event.preventDefault(); submit(setInventoryMinimumStockAction, event.currentTarget); }}><input type="hidden" name="productId" value={product.id} /><div><p className="text-sm font-medium text-slate-900">{product.name}</p><p className="text-xs text-slate-500">Disponible: {product.stock} {product.unit}</p></div><div className="grid gap-1"><Label htmlFor={`minimum-${product.id}`} className="text-xs">Mínimo</Label><Input id={`minimum-${product.id}`} name="minimumStock" type="number" min="0" step="0.001" inputMode="decimal" defaultValue={product.minimumStock} required /></div><Button type="submit" variant="outline" disabled={pending}>Guardar</Button></form>) : <p className="py-4 text-sm text-slate-500">Todavía no hay productos para configurar.</p>}</div></div>
          {message ? <p role="status" className="text-sm text-slate-600">{message}</p> : null}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cerrar</Button></ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
