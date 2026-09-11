import assert from "node:assert/strict";
import test from "node:test";

import { canAccessReceipt } from "../../src/modules/families/lib/receipt-access-policy";

test("un miembro de la familia titular puede descargar su recibo", () => {
  assert.equal(canAccessReceipt({ canManagePayments: false, userFamilyId: "family-a", receiptFamilyId: "family-a" }), true);
});

test("una familia ajena no puede descargar el recibo", () => {
  assert.equal(canAccessReceipt({ canManagePayments: false, userFamilyId: "family-b", receiptFamilyId: "family-a" }), false);
});

test("quien tiene permiso de pagos puede descargar cualquier recibo", () => {
  assert.equal(canAccessReceipt({ canManagePayments: true, userFamilyId: null, receiptFamilyId: "family-a" }), true);
});
