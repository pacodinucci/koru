import assert from "node:assert/strict";
import test from "node:test";

import { canAccessReceipt } from "../../src/modules/families/lib/receipt-access-policy";

test("un miembro de la familia titular puede descargar su recibo", () => {
  assert.equal(canAccessReceipt({ role: "PARENT", userFamilyId: "family-a", receiptFamilyId: "family-a" }), true);
});

test("una familia ajena no puede descargar el recibo", () => {
  assert.equal(canAccessReceipt({ role: "PARENT", userFamilyId: "family-b", receiptFamilyId: "family-a" }), false);
});

test("los roles administrativos pueden descargar cualquier recibo", () => {
  assert.equal(canAccessReceipt({ role: "ADMIN", userFamilyId: null, receiptFamilyId: "family-a" }), true);
  assert.equal(canAccessReceipt({ role: "SUPERADMIN", userFamilyId: null, receiptFamilyId: "family-a" }), true);
});