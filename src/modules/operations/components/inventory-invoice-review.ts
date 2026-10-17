import type { InvoiceDraft, InvoiceDraftLine, InvoiceProduct } from "@/modules/operations/domain/inventory-invoice";

export type ReviewLine = {
  original: InvoiceDraftLine;
  productId: string;
  quantity: string;
  unitCost: string;
  conversion: number | null;
  included: boolean;
  manual?: boolean;
};

export type InvoiceReview = {
  batchId: string;
  supplier: string;
  date: string;
  totalAmount: string;
  invoiceNumber: string;
  warnings: string[];
  lines: ReviewLine[];
  reviewed: boolean;
  // Once a response is uncertain, editing could create a second stock intake.
  locked: boolean;
};

type Confirmation = {
  batchId: string;
  reviewed: true;
  supplier: string;
  date: string;
  totalAmount: number;
  invoiceNumber: string | null;
  lines: { productId: string; quantity: number; unitCost: number | null; description: string }[];
};

const nullableText = (value: unknown) => value === null || typeof value === "string";
const nullableNumber = (value: unknown) => value === null || (typeof value === "number" && Number.isFinite(value));
const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

function isDraft(value: unknown): value is InvoiceDraft {
  return record(value)
    && nullableText(value.supplier) && nullableText(value.invoiceNumber)
    && Array.isArray(value.warnings) && value.warnings.every((warning) => typeof warning === "string")
    && Array.isArray(value.lines) && value.lines.length > 0
    && value.lines.every((line) => record(line)
      && typeof line.description === "string" && line.description.trim().length > 0
      && nullableNumber(line.invoiceQuantity) && nullableText(line.invoiceUnit)
      && nullableText(line.productId) && nullableNumber(line.stockQuantity)
      && nullableNumber(line.unitsPerInvoiceUnit) && nullableNumber(line.unitCost)
      && ["high", "medium", "low"].includes(String(line.confidence)) && nullableText(line.note));
}

type ManualHeader = Pick<InvoiceReview, "supplier" | "date" | "totalAmount">;

export function emptyReview(batchId: string, header?: ManualHeader): InvoiceReview {
  return { batchId, supplier: header?.supplier ?? "", date: header?.date ?? "", totalAmount: header?.totalAmount ?? "", invoiceNumber: "", warnings: [], lines: [], reviewed: false, locked: false };
}

export function addManualLine(state: InvoiceReview, batchId: string): InvoiceReview {
  if (state.locked) return state;
  const original: InvoiceDraftLine = {
    description: "Producto manual", invoiceQuantity: null, invoiceUnit: null, productId: null,
    stockQuantity: null, unitsPerInvoiceUnit: null, unitCost: null, confidence: "low", note: null,
  };
  return { ...state, batchId, reviewed: false, lines: [...state.lines, {
    original, productId: "", quantity: "", unitCost: "", conversion: null, included: true, manual: true,
  }] };
}

export function removeReviewLine(state: InvoiceReview, index: number, batchId: string): InvoiceReview {
  return state.locked ? state : { ...state, batchId, reviewed: false, lines: state.lines.filter((_, i) => i !== index) };
}

export function createReview(draft: unknown, batchId: string, header?: ManualHeader): InvoiceReview {
  if (!isDraft(draft)) throw new Error("La interpretación recibida no es válida. Volvé a analizar el archivo.");
  return {
    batchId,
    // Supplier, date and purchase total are always entered manually.
    supplier: header?.supplier ?? "",
    date: header?.date ?? "",
    totalAmount: header?.totalAmount ?? "",
    invoiceNumber: draft.invoiceNumber ?? "",
    warnings: [...draft.warnings],
    lines: draft.lines.map((original) => ({
      original: { ...original },
      productId: original.productId ?? "",
      quantity: original.stockQuantity === null ? "" : String(original.stockQuantity),
      unitCost: original.unitCost === null ? "" : String(original.unitCost),
      conversion: original.unitsPerInvoiceUnit,
      included: true,
    })),
    reviewed: false,
    locked: false,
  };
}

export function editReviewLine(
  state: InvoiceReview,
  index: number,
  patch: Partial<Pick<ReviewLine, "productId" | "quantity" | "unitCost" | "included">>,
  batchId: string,
): InvoiceReview {
  if (state.locked || !state.lines[index]) return state;
  const before = state.lines[index];
  const productChanged = patch.productId !== undefined && patch.productId !== before.productId;
  const next = productChanged
    ? { ...before, ...patch, quantity: "", unitCost: "", conversion: null }
    : { ...before, ...patch };
  if (next.productId === before.productId && next.quantity === before.quantity
    && next.unitCost === before.unitCost && next.included === before.included) return state;
  return { ...state, batchId, reviewed: false, lines: state.lines.map((line, i) => i === index ? next : line) };
}

export function editReviewHeader(
  state: InvoiceReview,
  patch: Partial<Pick<InvoiceReview, "supplier" | "date" | "totalAmount" | "invoiceNumber">>,
  batchId: string,
): InvoiceReview {
  if (state.locked) return state;
  if ((patch.supplier === undefined || patch.supplier === state.supplier)
    && (patch.date === undefined || patch.date === state.date)
    && (patch.totalAmount === undefined || patch.totalAmount === state.totalAmount)
    && (patch.invoiceNumber === undefined || patch.invoiceNumber === state.invoiceNumber)) return state;
  return { ...state, ...patch, reviewed: false, batchId };
}

export function setReviewed(state: InvoiceReview, reviewed: boolean): InvoiceReview {
  return state.locked ? state : { ...state, reviewed };
}

export function lockReview(state: InvoiceReview): InvoiceReview {
  return { ...state, locked: true };
}

export function failReview(state: InvoiceReview, uncertain: boolean): InvoiceReview {
  // An unsuccessful retry cannot prove whether an earlier uncertain request committed.
  // Only a verified success consumes that locked draft.
  return { ...state, locked: state.locked || uncertain };
}

function decimal(value: string, places: number, maximum: number): number | null {
  if (!/^\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number > maximum
    || Number(number.toFixed(places)) !== number) return null;
  return number;
}

export function confirmationPayload(
  state: InvoiceReview,
  products: InvoiceProduct[],
): { ok: true; payload: Confirmation } | { ok: false; message: string } {
  const invalid = (message: string) => ({ ok: false as const, message });
  if (!state.reviewed) return invalid("Confirmá que revisaste los productos, las unidades y las cantidades.");
  if (!state.supplier.trim() || state.supplier.trim().length > 200) return invalid("Ingresá el proveedor (máximo 200 caracteres).");
  if (!isCalendarDate(state.date)) return invalid("Ingresá una fecha del ingreso válida.");
  // Validate the entered precision, not a rounded or coerced numeric value.
  const totalAmount = typeof state.totalAmount === "string" && /^\d+(?:\.\d{1,2})?$/.test(state.totalAmount.trim())
    ? decimal(state.totalAmount, 2, 9999999999.99) : null;
  if (totalAmount === null) return invalid("Ingresá el total de la compra: un importe no negativo con hasta 2 decimales (máximo 9999999999,99).");
  // Spreadsheet padding is not an intake line. Partially edited rows still validate normally.
  const included = state.lines.filter((line) => line.included
    && !(line.manual && line.productId === "" && line.quantity.trim() === "" && line.unitCost.trim() === ""));
  if (!included.length) return invalid("Incluí al menos una línea para registrar el ingreso.");
  const lines: Confirmation["lines"] = [];
  for (const line of included) {
    if (!products.some((product) => product.id === line.productId)) return invalid("Seleccioná un producto del catálogo para cada línea incluida.");
    const quantity = decimal(line.quantity, 3, 999999999.999);
    if (quantity === null || quantity <= 0) return invalid("Ingresá cantidades positivas con hasta 3 decimales (máximo 999999999,999).");
    const unitCost = line.unitCost.trim() === "" ? null : decimal(line.unitCost, 2, 9999999999.99);
    if (line.unitCost.trim() !== "" && unitCost === null) return invalid("El costo por unidad de stock debe ser no negativo y tener hasta 2 decimales.");
    const description = line.manual ? products.find((product) => product.id === line.productId)!.name : line.original.description;
    lines.push({ productId: line.productId, quantity, unitCost, description });
  }
  return { ok: true, payload: {
    batchId: state.batchId,
    reviewed: true,
    supplier: state.supplier.trim(),
    date: state.date,
    totalAmount,
    invoiceNumber: state.invoiceNumber.trim() || null,
    lines,
  } };
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

export function invoiceFileError(file: { name?: string; type: string; size: number }): string | null {
  const types = ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/csv", "application/csv", "text/plain", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
  const extension = /\.(jpe?g|png|webp|pdf|xlsx|xls|csv)$/i.test(file.name ?? "");
  if (!types.includes(file.type.toLowerCase()) && !(extension && ["", "application/octet-stream"].includes(file.type.toLowerCase()))) {
    return "Elegí JPEG, PNG, WebP, PDF, XLSX, XLS o CSV.";
  }
  if (file.size <= 0 || file.size > 4 * 1024 * 1024) return "El archivo debe tener contenido y pesar como máximo 4 MB.";
  return null;
}
