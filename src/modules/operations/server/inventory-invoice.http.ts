import "server-only";

import { revalidatePath } from "next/cache";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { confirmationSchema, manualIntakeFieldsSchema } from "@/modules/operations/domain/inventory-invoice";
import { commitInvoice, InvoiceConflict, InvoiceProductMissing } from "@/modules/operations/server/inventory-invoice.confirm";
import { extractInvoice } from "@/modules/operations/server/inventory-invoice.provider";
import { spreadsheetText, SpreadsheetError } from "@/modules/operations/server/inventory-invoice.spreadsheet";
import { requireOperationsOperator } from "@/modules/operations/server/operations-access";

const FILE_LIMIT = 4 * 1024 * 1024;
const MULTIPART_LIMIT = FILE_LIMIT + 16 * 1024;
const deniedMessage = "No tenés permiso para operar el inventario.";
const invalidFile = "Subí una imagen JPEG, PNG o WebP, un PDF o una planilla XLSX, XLS o CSV válida de hasta 4 MB.";
const spreadsheetMimes = {
  csv: ["text/csv", "application/csv", "text/plain", "application/vnd.ms-excel", "text/x-csv", "application/x-csv", "text/comma-separated-values"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  xls: ["application/vnd.ms-excel", "application/x-excel"],
};
function sheetExtension(filename: string): keyof typeof spreadsheetMimes | null {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension === "csv" || extension === "xlsx" || extension === "xls" ? extension : null;
}
class BodyTooLarge extends Error {}
const json = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const fail = (message: string, status = 400) => json({ ok: false, message }, status);

/** Do not call request.formData/json until the streaming body has been bounded. */
async function boundedBody(request: Request, limit: number): Promise<Uint8Array> {
  const length = request.headers.get("content-length");
  if (length && /^\d+$/.test(length) && Number(length) > limit) {
    await request.body?.cancel();
    throw new BodyTooLarge();
  }
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new BodyTooLarge(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

function verifiedMime(bytes: Uint8Array, mime: string): boolean {
  const head = Buffer.from(bytes.subarray(0, 12));
  if (mime === "image/jpeg") return head.length >= 3 && head[0] === 255 && head[1] === 216 && head[2] === 255;
  if (mime === "image/png") return head.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/webp") return head.subarray(0, 4).toString() === "RIFF" && head.subarray(8, 12).toString() === "WEBP";
  if (mime === "application/pdf") return /^%PDF-\d\.\d/.test(head.toString("ascii"));
  return false;
}

export async function analyzeInvoice(request: Request): Promise<Response> {
  try { await requireOperationsOperator("inventory.operate"); }
  catch { return fail(deniedMessage, 403); }
  let bytes: Uint8Array;
  let mime: string;
  let text: string | undefined;
  try {
    const body = await boundedBody(request, MULTIPART_LIMIT);
    const form = await new Request("http://localhost", {
      method: "POST", headers: { "Content-Type": request.headers.get("content-type") ?? "" },
      body: Buffer.from(body),
    }).formData();
    const entries = [...form.entries()];
    if (entries.length !== 1 || entries[0][0] !== "file" || typeof entries[0][1] === "string") return fail(invalidFile);
    const file = entries[0][1];
    if (file.size > FILE_LIMIT) return fail(invalidFile, 413);
    if (file.size === 0) return fail(invalidFile);
    bytes = new Uint8Array(await file.arrayBuffer());
    mime = file.type.toLowerCase();
    const extension = sheetExtension(file.name);
    if (extension) {
      if (mime && mime !== "application/octet-stream" && !spreadsheetMimes[extension].includes(mime)) return fail(invalidFile);
      text = spreadsheetText(bytes, extension);
    } else if (!verifiedMime(bytes, mime)) return fail(invalidFile);
  } catch (error) {
    if (error instanceof SpreadsheetError) return fail(error.message);
    return fail(invalidFile, error instanceof BodyTooLarge ? 413 : 400);
  }
  if (!env.OPENAI_API_KEY) return fail("La lectura de facturas no está configurada. Podés usar el ingreso manual.", 503);
  try {
    const catalog = await prisma.inventoryProduct.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, unit: true } });
    const draft = await extractInvoice({ bytes, mime, spreadsheetText: text, catalog, apiKey: env.OPENAI_API_KEY, model: env.OPENAI_INVOICE_MODEL });
    return json({ ok: true, draft });
  } catch { return fail("No se pudo interpretar la factura. Intentá nuevamente o usá el ingreso manual.", 502); }
}

export async function confirmInvoice(request: Request): Promise<Response> {
  let actorId: string;
  try { actorId = (await requireOperationsOperator("inventory.operate")).id; }
  catch { return fail(deniedMessage, 403); }
  let input;
  try {
    const body = await boundedBody(request, 128 * 1024);
    const raw: unknown = JSON.parse(new TextDecoder().decode(body));
    if (raw !== null && typeof raw === "object" && !Array.isArray(raw) && !manualIntakeFieldsSchema.safeParse(raw).success) {
      return fail("Ingresá el proveedor (hasta 200 caracteres) y una fecha válida en formato AAAA-MM-DD.");
    }
    input = confirmationSchema.parse(raw);
  } catch { return fail("Revisá los productos, las cantidades y los costos antes de confirmar."); }
  try {
    await commitInvoice(input, actorId);
  } catch (error) {
    if (error instanceof InvoiceConflict) return fail("Este lote ya fue confirmado con otros datos.", 409);
    if (error instanceof InvoiceProductMissing) return fail("Uno de los productos ya no existe.");
    return fail("No se pudo registrar el ingreso. Reintentá con el mismo lote.", 500);
  }
  // A cache failure must not turn a committed intake into an apparent database failure.
  try { revalidatePath("/dashboard/inventario"); } catch { /* Stock is already committed. */ }
  return json({ ok: true, message: "Ingreso de stock registrado." });
}
