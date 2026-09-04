import assert from "node:assert/strict";
import test from "node:test";

import { canAccessFamilyStudent } from "../../src/modules/families/lib/family-student-access-policy";

test("un padre o madre sólo accede a alumnos de su familia", () => {
  assert.equal(canAccessFamilyStudent({ studentFamilyId: "family-a", userFamilyId: "family-a" }), true);
  assert.equal(canAccessFamilyStudent({ studentFamilyId: "family-a", userFamilyId: "family-b" }), false);
  assert.equal(canAccessFamilyStudent({ studentFamilyId: null, userFamilyId: "family-a" }), false);
  assert.equal(canAccessFamilyStudent({ studentFamilyId: "family-a", userFamilyId: null }), false);
});