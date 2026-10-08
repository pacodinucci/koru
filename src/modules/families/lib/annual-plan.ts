import { splitInstallmentAmounts } from "./eventual-installments.ts";
import { calculatePlanDiscount } from "./plan-discounts.ts";

export const BILLING_MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export function annualPlanInstallment(annualFee: string, discountPercent: string, count: number, index = 0) {
  if (!Number.isInteger(count) || count < 1 || count > 12 || !Number.isInteger(index) || index < 0 || index >= count) throw new Error("invalid_annual_plan_terms");
  const total = calculatePlanDiscount(annualFee, discountPercent);
  const grossAmount = splitInstallmentAmounts(total.grossAmount, count)[index];
  const netAmount = splitInstallmentAmounts(total.netAmount, count)[index];
  const discountAmount = (Number(grossAmount) - Number(netAmount)).toFixed(2);
  return { grossAmount, netAmount, discountAmount };
}

export function annualPlanInstallmentIndex(month: number, startMonth: number, count: number) {
  if (![month, startMonth, count].every(Number.isInteger) || month < 1 || month > 12 || startMonth < 1 || startMonth > 12 || count < 1 || count > 12) throw new Error("invalid_annual_plan_terms");
  const index = (month - startMonth + 12) % 12;
  return index < count ? index : null;
}
