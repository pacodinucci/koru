import { analyzeInvoice } from "@/modules/operations/server/inventory-invoice.http";

export const runtime = "nodejs";
export const maxDuration = 60;
export const POST = analyzeInvoice;
