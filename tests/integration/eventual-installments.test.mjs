import assert from "node:assert/strict";
import test from "node:test";

import { dueInstallmentIndexes, eventualInstallmentDescription, installmentPeriod, splitInstallmentAmounts } from "../../src/modules/families/lib/eventual-installments.ts";

test("divide un total en cuotas exactas y asigna el centavo sobrante al final", () => {
  assert.deepEqual(splitInstallmentAmounts("400.00", 3), ["133.33", "133.33", "133.34"]);
  assert.deepEqual(splitInstallmentAmounts("0.03", 3), ["0.01", "0.01", "0.01"]);
  assert.deepEqual(splitInstallmentAmounts("10", 1), ["10.00"]);
});

test("rechaza cuotas sin al menos un centavo y cantidades invalidas", () => {
  assert.throws(() => splitInstallmentAmounts("0.01", 2));
  assert.throws(() => splitInstallmentAmounts("1.00", 0));
  assert.throws(() => splitInstallmentAmounts("1.00", 121));
  assert.throws(() => splitInstallmentAmounts("1.001", 1));
});

test("calcula vencimientos por mes incluso al cruzar de año", () => {
  const start = new Date("2026-12-01T00:00:00.000Z");
  assert.equal(installmentPeriod(start, 0).toISOString(), "2026-12-01T00:00:00.000Z");
  assert.equal(installmentPeriod(start, 2).toISOString(), "2027-02-01T00:00:00.000Z");
  assert.equal(eventualInstallmentDescription("Materiales", 2, 3), "Cargo eventual · Materiales · cuota 2/3");
});

test("emite solo cuotas vencidas y recupera meses omitidos sin duplicar", () => {
  const start = new Date("2026-10-01T00:00:00.000Z");
  const current = new Date("2026-12-01T00:00:00.000Z");
  assert.deepEqual(dueInstallmentIndexes(start, 4, current, new Set([1])), [1, 2]);
  assert.deepEqual(dueInstallmentIndexes(start, 4, current, new Set([1, 2, 3])), []);
});
