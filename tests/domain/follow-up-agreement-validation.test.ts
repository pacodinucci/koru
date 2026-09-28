import assert from "node:assert/strict";
import test from "node:test";

import { parseAgreementForm, validateAgreementParticipants } from "../../src/modules/follow-up-agreements/lib/agreement-validation";

function form(studentIds: string[]) {
  const data = new FormData();
  data.set("title", "Cita de seguimiento");
  data.set("body", "Se conversó y acordó continuar el seguimiento.");
  data.set("studentIds", JSON.stringify(studentIds));
  return data;
}

const students = [
  { id: "student-1", familyId: "family-1" },
  { id: "student-2", familyId: "family-1" },
  { id: "student-3", familyId: "family-2" },
  { id: "student-4", familyId: null },
];

test("acepta un solo alumno y exige al menos uno", () => {
  assert.throws(() => parseAgreementForm(form([])));
  assert.deepEqual(parseAgreementForm(form(["student-1"])).studentIds, ["student-1"]);
});

test("deduplica participantes y exige título y acuerdo", () => {
  const data = form(["student-1", "student-1"]);
  assert.deepEqual(parseAgreementForm(data).studentIds, ["student-1"]);
  data.set("body", "  ");
  assert.throws(() => parseAgreementForm(data));
});

test("deriva familias únicas de los alumnos seleccionados", () => {
  assert.deepEqual(validateAgreementParticipants(students, ["student-1"]), ["family-1"]);
  assert.deepEqual(validateAgreementParticipants(students, ["student-1", "student-2", "student-3"]), ["family-1", "family-2"]);
});

test("rechaza alumnos ajenos o sin familia activa", () => {
  assert.throws(() => validateAgreementParticipants(students, ["student-5"]));
  assert.throws(() => validateAgreementParticipants(students, ["student-4"]));
});
