import assert from "node:assert/strict";
import test from "node:test";

import {
  candidateConversionOutcome,
  familyCreationRecord,
  familyKindMessages,
  parseFamilyKind,
  requiredPermissionsForFamilyCreation,
  resolveFamilyCreationDraft,
  resolveImportRowKind,
} from "../../src/modules/families/lib/candidate-family";

const admissionOrigin = {
  id: "adm_1",
  guardianNames: "  Familia   Gómez  ",
  email: "Familia.Gomez@Example.com",
};

test("una familia manual nueva es FAMILY por defecto y conserva los datos enviados", () => {
  const result = resolveFamilyCreationDraft({
    name: "  Familia  Pérez ",
    primaryEmail: " Familia.Perez@Example.com ",
    secondaryEmail: "",
    admissionOrigin: null,
  });

  assert.deepEqual(result, {
    ok: true,
    draft: {
      name: "Familia Pérez",
      kind: "FAMILY",
      primaryEmail: "familia.perez@example.com",
      secondaryEmail: undefined,
      admissionInquiryId: null,
    },
  });
});

test("la familia manual puede elegirse como candidata sin contacto de admisión", () => {
  const result = resolveFamilyCreationDraft({
    kind: "candidate",
    name: "Familia Candidata",
    primaryEmail: "candidata@example.com",
    secondaryEmail: "segundo@example.com",
    admissionOrigin: null,
  });

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.draft.kind, "CANDIDATE");
  assert.equal(result.ok && result.draft.admissionInquiryId, null);
  assert.equal(result.ok && result.draft.secondaryEmail, "segundo@example.com");
});

test("un tipo de familia desconocido se rechaza sin crear borrador", () => {
  const result = resolveFamilyCreationDraft({
    kind: "TRIAL",
    name: "Familia Prueba",
    primaryEmail: "prueba@example.com",
    admissionOrigin: null,
  });

  assert.deepEqual(result, { ok: false, message: familyKindMessages.invalidKind });
  assert.deepEqual(parseFamilyKind("TRIAL"), { ok: false, message: familyKindMessages.invalidKind });
  assert.deepEqual(parseFamilyKind(undefined), { ok: true, kind: "FAMILY" });
  assert.deepEqual(parseFamilyKind("  "), { ok: true, kind: "FAMILY" });
  assert.deepEqual(parseFamilyKind("CANDIDATE"), { ok: true, kind: "CANDIDATE" });
});

test("un origen de admisión conserva el vínculo y acepta el nombre y email corregidos", () => {
  const result = resolveFamilyCreationDraft({
    kind: "FAMILY",
    name: "Nombre escrito por el operador",
    primaryEmail: "reemplazo@example.com",
    secondaryEmail: "segundo@example.com",
    admissionOrigin,
  });

  assert.deepEqual(result, {
    ok: true,
    draft: {
      name: "Nombre escrito por el operador",
      kind: "CANDIDATE",
      primaryEmail: "reemplazo@example.com",
      secondaryEmail: "segundo@example.com",
      admissionInquiryId: "adm_1",
    },
  });
});

test("un origen de admisión sin segundo email mantiene una sola invitación", () => {
  const result = resolveFamilyCreationDraft({
    name: "Familia Gómez",
    primaryEmail: "familia.gomez@example.com",
    secondaryEmail: `${admissionOrigin.email} `,
    admissionOrigin,
  });

  assert.deepEqual(result, { ok: false, message: familyKindMessages.duplicateEmails });
});

test("un origen de admisión sin nombre utilizable cae al nombre enviado", () => {
  const result = resolveFamilyCreationDraft({
    name: "Familia Sin Nombre",
    admissionOrigin: { id: "adm_2", guardianNames: "  ", email: "sin-nombre@example.com" },
  });

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.draft.name, "Familia Sin Nombre");
  assert.equal(result.ok && result.draft.kind, "CANDIDATE");
});

test("un origen de admisión usa el nombre del alumno como valor inicial si no se envía una edición", () => {
  const result = resolveFamilyCreationDraft({
    admissionOrigin: { id: "adm_5", guardianNames: "   ", childName: "  Catalina  Ruiz ", email: "ruiz@example.com" },
  });

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.draft.name, "Catalina Ruiz");
  assert.equal(result.ok && result.draft.primaryEmail, "ruiz@example.com");
});

test("un origen sin id o ediciones vacías se rechazan sin crear familia", () => {
  assert.deepEqual(
    resolveFamilyCreationDraft({
      name: "Familia Inválida",
      primaryEmail: "sin-arroba",
      admissionOrigin: { id: "adm_3", guardianNames: "Familia Inválida", email: "valido@example.com" },
    }),
    { ok: false, message: familyKindMessages.invalidCreationData },
  );

  assert.deepEqual(
    resolveFamilyCreationDraft({
      name: "",
      admissionOrigin: { id: "adm_4", guardianNames: "", email: "valido@example.com" },
    }),
    { ok: false, message: familyKindMessages.invalidCreationData },
  );

  assert.deepEqual(
    resolveFamilyCreationDraft({
      name: "Familia Sin Id",
      admissionOrigin: { id: "", guardianNames: "Familia Sin Id", email: "valido@example.com" },
    }),
    { ok: false, message: familyKindMessages.invalidAdmissionOrigin },
  );
});

test("la familia manual inválida conserva los mensajes existentes", () => {
  assert.deepEqual(
    resolveFamilyCreationDraft({ name: "A", primaryEmail: "valido@example.com", admissionOrigin: null }),
    { ok: false, message: familyKindMessages.invalidCreationData },
  );
  assert.deepEqual(
    resolveFamilyCreationDraft({ name: "Familia Válida", primaryEmail: "sin-arroba", admissionOrigin: null }),
    { ok: false, message: familyKindMessages.invalidCreationData },
  );
  assert.deepEqual(
    resolveFamilyCreationDraft({
      name: "Familia Válida",
      primaryEmail: "igual@example.com",
      secondaryEmail: "IGUAL@example.com",
      admissionOrigin: null,
    }),
    { ok: false, message: familyKindMessages.duplicateEmails },
  );
});

test("la importación regular de familias sigue siendo FAMILY sin origen", () => {
  assert.deepEqual(resolveImportRowKind({}), { ok: true, kind: "FAMILY" });
  assert.deepEqual(resolveImportRowKind({ kind: "FAMILY", admissionInquiryId: "" }), { ok: true, kind: "FAMILY" });
  assert.deepEqual(resolveImportRowKind({ kind: "TRIAL" }), { ok: false, message: familyKindMessages.invalidKind });
});

test("una fila con origen de admisión se guarda como candidata en la misma transacción", () => {
  assert.deepEqual(resolveImportRowKind({ kind: "FAMILY", admissionInquiryId: "adm_9" }), { ok: true, kind: "CANDIDATE" });
  assert.deepEqual(resolveImportRowKind({ admissionInquiryId: " adm_9 " }), { ok: true, kind: "CANDIDATE" });
});

test("el registro persistido sólo lleva nombre, tipo y origen", () => {
  const candidateDraft = {
    name: "Familia Gómez",
    kind: "CANDIDATE" as const,
    primaryEmail: "familia.gomez@example.com",
    secondaryEmail: "segundo@example.com",
    admissionInquiryId: "adm_1",
  };
  const manualDraft = {
    name: "Familia Pérez",
    kind: "FAMILY" as const,
    primaryEmail: "familia.perez@example.com",
    admissionInquiryId: null,
  };

  assert.deepEqual(familyCreationRecord(candidateDraft), { name: "Familia Gómez", kind: "CANDIDATE", admissionInquiryId: "adm_1" });
  assert.deepEqual(familyCreationRecord(manualDraft), { name: "Familia Pérez", kind: "FAMILY", admissionInquiryId: null });
});

test("crear una familia candidata desde admisión exige permisos de familias y contactos", () => {
  assert.deepEqual(requiredPermissionsForFamilyCreation(null), ["families.manage"]);
  assert.deepEqual(requiredPermissionsForFamilyCreation("   "), ["families.manage"]);
  assert.deepEqual(requiredPermissionsForFamilyCreation("adm_1"), [
    "families.manage",
    "contacts.view",
    "contacts.manage",
  ]);
});

test("la importación compartida arma registros FAMILY para las filas regulares", () => {
  const rows: Array<{ rowNumber: number; familyName: string; motherEmail: string; fatherEmail?: string; admissionInquiryId?: string }> = [
    { rowNumber: 1, familyName: "Familia Regular", motherEmail: "regular@example.com", fatherEmail: "segundo@example.com" },
    { rowNumber: 2, familyName: "Familia Candidata", motherEmail: "candidata@example.com", admissionInquiryId: "adm_7" },
  ];

  const records = rows.map((row) => {
    const kind = resolveImportRowKind(row);
    assert.equal(kind.ok, true);
    return familyCreationRecord({
      name: row.familyName,
      kind: kind.ok ? kind.kind : "FAMILY",
      admissionInquiryId: row.admissionInquiryId ?? null,
    });
  });

  assert.deepEqual(records, [
    { name: "Familia Regular", kind: "FAMILY", admissionInquiryId: null },
    { name: "Familia Candidata", kind: "CANDIDATE", admissionInquiryId: "adm_7" },
  ]);
});

test("la conversión sólo aplica a familias candidatas y es idempotente", () => {
  assert.equal(candidateConversionOutcome("CANDIDATE"), "convert");
  assert.equal(candidateConversionOutcome("FAMILY"), "already-family");
});
