import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const compile = (path) => ts.transpileModule(readFileSync(path, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const rulesModule = { exports: {} };
vm.runInNewContext(compile("src/modules/families/lib/candidate-family.ts"), { module: rulesModule, exports: rulesModule.exports, require });

function harness() {
  const calls = { permissions: [], imports: [], previews: [], deliveries: 0 };
  const module = { exports: {} };
  const dependencies = {
    "@prisma/client": require("@prisma/client"),
    "next/cache": { revalidatePath() {} },
    zod: require("zod"),
    "@/modules/auth/server/auth-guards": { async requirePermission(key) { calls.permissions.push(key); return { id: "admin" }; } },
    "@/lib/prisma": { prisma: {} },
    "@/modules/families/server/families.repository": {},
    "@/modules/families/lib/family-financial-summary": {},
    "@/modules/families/lib/candidate-family": rulesModule.exports,
    "@/modules/families/server/candidate-family.service": {},
    "@/modules/mailing/server/invitation-delivery-worker.service": { async runInvitationDeliveryWorker() { calls.deliveries++; } },
    "@/modules/users/lib/user-invitation-feedback": {},
    "@/modules/users/server/users.repository": {},
    "@/modules/families/server/family-import.service": {
      async previewFamilyImport(rows) { calls.previews.push(rows); return { validRows: rows, issues: [], familiesCount: 1, invitationsCount: 1 }; },
      async confirmFamilyImport(rows) { calls.imports.push(rows); return { ok: true, familiesCount: 1, invitationsCount: 1, deliveryJobIds: ["job"] }; },
    },
  };
  vm.runInNewContext(compile("src/modules/families/server/families.actions.ts"), {
    module, exports: module.exports, console,
    require(name) { if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`); return dependencies[name]; },
  });
  return { actions: module.exports, calls };
}

const row = { rowNumber: 1, familyName: "Familia prueba", motherEmail: "familia@example.test" };
for (const metadata of [{ admissionInquiryId: "private-admission" }, { kind: "CANDIDATE" }, { kind: "FAMILY", admissionInquiryId: "private-admission" }]) {
  test(`public import rejects lifecycle metadata ${JSON.stringify(metadata)} without persistence or delivery`, async () => {
    const { actions, calls } = harness();
    const preview = await actions.previewFamilyImportAction([{ ...row, ...metadata }]);
    assert.equal(preview.familiesCount, 0);
    assert.equal(preview.invitationsCount, 0);
    assert.equal(preview.issues[0].message, "La planilla no tiene un formato válido.");
    const result = await actions.confirmFamilyImportAction([{ ...row, ...metadata }]);
    assert.equal(result.status, "error");
    assert.equal(result.message, "La planilla no tiene un formato válido.");
    assert.equal(calls.imports.length, 0);
    assert.equal(calls.previews.length, 0);
    assert.equal(calls.deliveries, 0);
  });
}

test("normal family creation preserves strict email validation before persistence", async () => {
  const { actions, calls } = harness();
  for (const emails of [
    { primaryEmail: "a..b@example.com" },
    { primaryEmail: "valid@example.com", secondaryEmail: "a..b@example.com" },
  ]) {
    const data = new FormData();
    data.set("name", "Familia prueba");
    for (const [key, value] of Object.entries(emails)) data.set(key, value);
    const result = await actions.createFamilyAction({ status: "idle", message: null }, data);
    assert.equal(result.status, "error");
    assert.equal(result.message, "Completá el nombre y un email principal válido. El segundo email, si lo ingresás, también debe ser válido.");
    assert.equal(calls.imports.length, 0);
    assert.equal(calls.deliveries, 0);
  }
});

test("public ordinary family import still previews, persists and delivers", async () => {
  const { actions, calls } = harness();
  const preview = await actions.previewFamilyImportAction([row]);
  assert.equal(preview.familiesCount, 1);
  assert.equal(preview.invitationsCount, 1);
  const result = await actions.confirmFamilyImportAction([row]);
  assert.equal(result.status, "success");
  assert.equal(result.message, "Se crearon 1 familias y se prepararon 1 invitaciones para enviar.");
  assert.equal(calls.imports.length, 1);
  assert.equal(calls.previews.length, 1);
  assert.equal(calls.deliveries, 1);
  assert.equal(calls.permissions.join(","), "families.manage,families.manage");
});
