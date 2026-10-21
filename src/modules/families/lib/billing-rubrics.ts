import { MAX_EVENTUAL_INSTALLMENTS, splitInstallmentAmounts } from "./eventual-installments.ts";
import { calculatePlanDiscount } from "./plan-discounts.ts";

export class BillingRubricInputError extends Error {}

export function parseBillingRubric(input: { name: unknown; amount: unknown }) {
  if (typeof input.name !== "string" || input.name.trim().length < 2 || input.name.trim().length > 120) {
    throw new BillingRubricInputError("Ingresá un nombre de entre 2 y 120 caracteres.");
  }
  if (typeof input.amount !== "string" || !/^(0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(input.amount) || Number(input.amount) <= 0) {
    throw new BillingRubricInputError("Ingresá un importe positivo de hasta 10 enteros y 2 decimales.");
  }
  return { name: input.name.trim(), amount: input.amount };
}

export function parseRubricId(id: unknown): string {
  if (typeof id !== "string" || !id.trim() || id.length > 200) {
    throw new BillingRubricInputError("La identificación no es válida.");
  }
  return id.trim();
}

export function parseRubricAssignment(input: { familyId: unknown; studentId: unknown; rubricId: unknown; installmentCount: unknown; startMonth: unknown; discountPercent?: unknown }) {
  const familyId = parseRubricId(input.familyId);
  const studentId = parseRubricId(input.studentId);
  const rubricId = parseRubricId(input.rubricId);
  if (typeof input.installmentCount !== "number" || !Number.isInteger(input.installmentCount) || input.installmentCount < 1 || input.installmentCount > MAX_EVENTUAL_INSTALLMENTS) {
    throw new BillingRubricInputError(`Seleccioná entre 1 y ${MAX_EVENTUAL_INSTALLMENTS} cuotas enteras.`);
  }
  if (typeof input.startMonth !== "number" || !Number.isInteger(input.startMonth) || input.startMonth < 1 || input.startMonth > 12) {
    throw new BillingRubricInputError("Seleccioná un mes entre 1 y 12.");
  }
  const discountPercent = input.discountPercent === undefined ? "0" : input.discountPercent;
  try {
    if (typeof discountPercent !== "string") throw new Error("invalid_discount");
    calculatePlanDiscount("1.00", discountPercent);
  } catch {
    throw new BillingRubricInputError("Ingresá un descuento entre 0 y 100 con hasta 2 decimales.");
  }
  return { familyId, studentId, rubricId, installmentCount: input.installmentCount, startMonth: input.startMonth, discountPercent: discountPercent as string };
}

export function validateRubricInstallments(amount: string, count: number) {
  try { splitInstallmentAmounts(amount, count); }
  catch { throw new BillingRubricInputError("Cada cuota debe ser de al menos $0,01."); }
}
