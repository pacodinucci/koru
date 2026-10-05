import assert from "node:assert/strict";
import test from "node:test";

import {
  familyStudentMedicalSchema,
  familyStudentPersonalEditSchema,
} from "../../src/modules/family-dashboard/schemas/family-student-record.schema";

const personal = {
  studentId: "student-1",
  documentType: "CURP",
  documentNumber: "",
  birthDate: "2017-01-16",
  groupId: "group-1",
  primaryGuardianName: "Adalberto",
};

test("la edición personal permite un documento opcional pero exige alumno, fecha y grupo", () => {
  assert.equal(familyStudentPersonalEditSchema.safeParse(personal).success, true);
  assert.equal(familyStudentPersonalEditSchema.safeParse({ ...personal, studentId: "" }).success, false);
  assert.equal(familyStudentPersonalEditSchema.safeParse({ ...personal, birthDate: "" }).success, false);
  assert.equal(familyStudentPersonalEditSchema.safeParse({ ...personal, groupId: "" }).success, false);
});

test("la cobertura médica exige institución sólo cuando está activa", () => {
  const medical = {
    studentId: "student-1",
    bloodType: "",
    knownAllergies: "",
    medicalConditions: "",
    regularMedications: "",
    hasHealthInsurance: false,
    insuranceProviderAndPolicy: "",
  };

  assert.equal(familyStudentMedicalSchema.safeParse(medical).success, true);
  assert.equal(familyStudentMedicalSchema.safeParse({ ...medical, hasHealthInsurance: true }).success, false);
  assert.equal(familyStudentMedicalSchema.safeParse({ ...medical, hasHealthInsurance: true, insuranceProviderAndPolicy: "Institución 123" }).success, true);
});
