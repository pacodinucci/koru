import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(path, "utf8");

test("family creation offers both kinds and retains both invitation email fields", () => {
  const source = read("src/modules/families/components/create-family-dialog.tsx");
  assert.match(source, /DropdownMenuItem[^\n]*FAMILY[^\n]*Familia</);
  assert.match(source, /DropdownMenuItem[^\n]*CANDIDATE[^\n]*Familia candidata</);
  assert.match(source, /name="name"[^\n]*defaultValue=\{initialName\}/);
  assert.doesNotMatch(source, /name="name"[^\n]*readOnly/);
  assert.match(source, /name="primaryEmail"/);
  assert.match(source, /name="secondaryEmail"/);
  assert.match(source, /name="kind"/);
  assert.match(source, /name="admissionInquiryId"/);
  assert.match(source, /defaultValue=\{initialEmail\}/);
  assert.doesNotMatch(source, /name="primaryEmail"[^\n]*readOnly/);
});

test("admission entry requires family management permission and passes the source", () => {
  const source = read("src/modules/contacts/views/contact-detail.tsx");
  assert.match(source, /item.source === "admission" && canManage && canManageFamilies/);
  assert.match(source, /admissionInquiryId=\{item.id\}/);
  const page = read("src/app/(dashboard)/dashboard/contactos/[source]/[id]/page.tsx");
  assert.match(page, /canManageFamilies=\{user.permissionKeys.includes\("families.manage"\)\}/);
});

test("candidate label and conversion are separate from operational status", () => {
  const source = read("src/modules/families/components/families-data-table.tsx");
  assert.match(source, /kind\??: "FAMILY" \| "CANDIDATE"/);
  assert.match(source, /Candidata/);
  assert.match(source, /ConvertCandidateFamily/);
  const conversion = read("src/modules/families/components/convert-candidate-family.tsx");
  assert.match(conversion, /convertCandidateFamilyAction/);
  assert.match(conversion, /name="familyId"/);
  assert.match(conversion, /Convertir en familia/);
  assert.match(read("src/modules/families/views/dashboard-families-view.tsx"), /kind: family.kind/);
});
