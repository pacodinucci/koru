"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { minimumStockSchema, type InvoiceProduct } from "@/modules/operations/domain/inventory-invoice";
import { requireOperationsSuperAdmin } from "@/modules/operations/server/operations-access";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  unit: z.string().trim().min(1).max(30),
  minimumStock: minimumStockSchema,
});
type Result = { ok: true; product: InvoiceProduct; message: string } | { ok: false; message: string };

/** Explicit creation only: extraction never calls this action. */
export async function createInvoiceProductAction(formData: FormData): Promise<Result> {
  try { await requireOperationsSuperAdmin("inventory.configure"); }
  catch { return { ok: false, message: "No tenés permiso para configurar el inventario." }; }
  const parsed = schema.safeParse({ name: formData.get("name"), unit: formData.get("unit"), minimumStock: formData.get("minimumStock") ?? "" });
  if (!parsed.success) return { ok: false, message: "Revisá los datos del producto." };
  let product: InvoiceProduct;
  try {
    product = await prisma.inventoryProduct.create({ data: parsed.data, select: { id: true, name: true, unit: true } });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    return { ok: false, message: code === "P2002" ? "Ya existe un producto con ese nombre y unidad." : "No se pudo crear el producto. Intentá nuevamente." };
  }
  try { revalidatePath("/dashboard/inventario"); } catch { /* Product creation succeeded. */ }
  return { ok: true, product: { id: product.id, name: product.name, unit: product.unit }, message: "Producto creado." };
}
