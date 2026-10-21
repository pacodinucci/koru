import assert from "node:assert/strict";
import test from "node:test";
import { parseBillingRubric, parseRubricAssignment } from "../../src/modules/families/lib/billing-rubrics";

test("S2 normaliza nombres y conserva importes Decimal(12,2) positivos", () => {
  assert.deepEqual(parseBillingRubric({ name: "  Materiales  ", amount: "120000" }), { name: "Materiales", amount: "120000" });
  assert.equal(parseBillingRubric({ name: "Máximo", amount: "9999999999.99" }).amount, "9999999999.99");
  for (const amount of ["0", "0.00", "-1", "1.001", "10000000000", "1e3", "", "NaN"]) {
    assert.throws(() => parseBillingRubric({ name: "Materiales", amount }), /Ingresá un importe positivo de hasta 10 enteros y 2 decimales\./);
  }
  for (const name of ["", " ", "a", "a".repeat(121)]) assert.throws(() => parseBillingRubric({ name, amount: "1" }), /Ingresá un nombre de entre 2 y 120 caracteres\./);
});

test("S3/S4 valida alumno, familia, rubro, cuotas enteras y mes sin coerción", () => {
  const input = { familyId: "family", studentId: "student", rubricId: "rubric", installmentCount: 3, startMonth: 12 };
  assert.deepEqual(parseRubricAssignment(input), { ...input, discountPercent: "0" });
  assert.equal(parseRubricAssignment({ ...input, installmentCount: 120, startMonth: 1 }).installmentCount, 120);
  for (const installmentCount of [0, 121, 1.5, NaN, "3"]) assert.throws(() => parseRubricAssignment({ ...input, installmentCount }), /Seleccioná entre 1 y 120 cuotas enteras\./);
  for (const startMonth of [0, 13, 1.5, NaN, "3"]) assert.throws(() => parseRubricAssignment({ ...input, startMonth }), /Seleccioná un mes entre 1 y 12\./);
  for (const key of ["familyId", "studentId", "rubricId"]) assert.throws(() => parseRubricAssignment({ ...input, [key]: " " }), /La identificación no es válida\./);
});

test("S1/S6 porcentajes exactos de 0 a 100 y hasta dos decimales, sin coerción", () => {
  const input = { familyId: "family", studentId: "student", rubricId: "rubric", installmentCount: 3, startMonth: 1 };
  for (const discountPercent of ["0", "0.01", "12.34", "99.99", "100", "100.00"]) {
    assert.equal(parseRubricAssignment({ ...input, discountPercent }).discountPercent, discountPercent);
  }
  for (const discountPercent of ["-1", "100.01", "1.001", "1e1", "", " 1", "01", "NaN", 10, null]) {
    assert.throws(() => parseRubricAssignment({ ...input, discountPercent }), /Ingresá un descuento entre 0 y 100 con hasta 2 decimales\./);
  }
});
