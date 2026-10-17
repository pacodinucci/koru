import { z } from "zod";

export type InvoiceProduct = { id: string; name: string; unit: string };
export type InvoiceDraftLine = {
  description: string;
  invoiceQuantity: number | null;
  invoiceUnit: string | null;
  productId: string | null;
  stockQuantity: number | null;
  unitsPerInvoiceUnit: number | null;
  /** Cost per catalog stock unit, never an invoice line total. */
  unitCost: number | null;
  confidence: "high" | "medium" | "low";
  note: string | null;
};
export type InvoiceDraft = {
  supplier: string | null;
  invoiceNumber: string | null;
  lines: InvoiceDraftLine[];
  warnings: string[];
};

// Decimal(12,3) quantities/minimum stock and Decimal(12,2) costs.
// Compare the decimal representation, not binary floating-point multiplication.
export function fitsDecimal(value: number, scale: number): boolean {
  return Number.isFinite(value) && value >= 0 && value < 10 ** (12 - scale)
    && Number(value.toFixed(scale)) === value;
}
export const quantitySchema = z.number().positive().refine((n) => fitsDecimal(n, 3));
export const costSchema = z.number().nonnegative().refine((n) => fitsDecimal(n, 2));
export const minimumStockSchema = z.coerce.number().nonnegative().refine((n) => fitsDecimal(n, 3));
/** Exact Gregorian calendar date; no timezone parsing or normalization of invalid dates. */
export const intakeDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const [year, month, day] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1];
});
export const manualIntakeFieldsSchema = z.object({
  supplier: z.string().trim().min(1).max(200),
  date: intakeDateSchema,
});
export const confirmationSchema = z.object({
  batchId: z.uuid().transform((id) => id.toLowerCase()),
  reviewed: z.literal(true),
  ...manualIntakeFieldsSchema.shape,
  /** Required purchase-level total, independent of optional per-stock-unit costs. */
  totalAmount: costSchema,
  invoiceNumber: z.string().trim().max(100).nullable(),
  lines: z.array(z.object({
    productId: z.string().min(1).max(200),
    quantity: quantitySchema,
    unitCost: costSchema.nullish().transform((n) => n ?? null),
    description: z.string().trim().min(1).max(500),
  }).strict()).min(1).max(100),
}).strict();
export type InvoiceConfirmation = z.infer<typeof confirmationSchema>;
