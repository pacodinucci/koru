import assert from "node:assert/strict";
import test from "node:test";

import { calculatePlanDiscount } from "../../src/modules/families/lib/plan-discounts.ts";
import { splitInstallmentAmounts } from "../../src/modules/families/lib/eventual-installments.ts";

test("calcula descuentos en centavos con redondeo comercial", () => {
  assert.deepEqual(calculatePlanDiscount("100.00", "12.50"), { grossAmount: "100.00", discountAmount: "12.50", netAmount: "87.50" });
  assert.deepEqual(calculatePlanDiscount("0.05", "10"), { grossAmount: "0.05", discountAmount: "0.00", netAmount: "0.05" });
  assert.deepEqual(calculatePlanDiscount("0.05", "50"), { grossAmount: "0.05", discountAmount: "0.02", netAmount: "0.03" });
  assert.deepEqual(calculatePlanDiscount("100.00", "100"), { grossAmount: "100.00", discountAmount: "100.00", netAmount: "0.00" });
});

test("divide el neto descontado y soporta una bonificacion completa", () => {
  const discounted = calculatePlanDiscount("400.00", "25");
  assert.deepEqual(splitInstallmentAmounts(discounted.netAmount, 3), ["100.00", "100.00", "100.00"]);
  assert.deepEqual(splitInstallmentAmounts("0.00", 3), ["0.00", "0.00", "0.00"]);
  assert.throws(() => splitInstallmentAmounts("0.01", 2));
});

test("rechaza porcentajes invalidos o importes con mas de dos decimales", () => {
  assert.throws(() => calculatePlanDiscount("100", "100.01"));
  assert.throws(() => calculatePlanDiscount("100", "-1"));
  assert.throws(() => calculatePlanDiscount("100", "1.001"));
  assert.throws(() => calculatePlanDiscount("1.001", "10"));
});
