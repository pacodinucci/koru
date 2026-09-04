import assert from "node:assert/strict";
import test from "node:test";

import { calculateFamilyBalance, canWaiveFamilyBalance } from "../../src/modules/families/lib/family-account-policy";

test("el saldo suma cargos, pagos, reversas y condonaciones", () => {
  const balance = calculateFamilyBalance([{ amount: "100" }, { amount: "-40" }, { amount: "40" }, { amount: "-20" }]);
  assert.equal(balance, 80);
});

test("sólo superadmin puede condonar hasta el saldo pendiente", () => {
  assert.equal(canWaiveFamilyBalance({ role: "SUPERADMIN", outstanding: 100, amount: 100 }), true);
  assert.equal(canWaiveFamilyBalance({ role: "ADMIN", outstanding: 100, amount: 50 }), false);
  assert.equal(canWaiveFamilyBalance({ role: "SUPERADMIN", outstanding: 100, amount: 101 }), false);
  assert.equal(canWaiveFamilyBalance({ role: "SUPERADMIN", outstanding: 0, amount: 1 }), false);
});