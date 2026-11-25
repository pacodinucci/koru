import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);

function load(path, dependencies) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module, exports: module.exports, console,
    require(name) { if (!(name in dependencies)) throw Error(`Unexpected dependency ${name}`); return dependencies[name]; },
  });
  return module.exports;
}
function setup({ denied, failCreation = false, deliveryFails = false } = {}) {
  const rows = [
    { id: "available", childName: "Ana López", guardianNames: "Lucía López", email: "lucia@example.test", family: null },
    { id: "candidate", childName: "Juan Pérez", guardianNames: "Laura Pérez", email: "laura@example.test", family: { id: "candidate-family", kind: "CANDIDATE" } },
    { id: "regular", childName: "Sol Díaz", guardianNames: "José Díaz", email: "jose@example.test", family: { id: "regular-family", kind: "FAMILY" } },
  ];
  const calls = { permissions: [], reads: [], imports: [], deliveries: 0 };
  const auth = { async requirePermission(key) { calls.permissions.push(key); if (key === denied) throw Error("forbidden"); return { id: "admin" }; } };
  const prisma = {
    admissionInquiry: {
      async findMany(query) {
        calls.reads.push(query);
        assert.equal(query.where.family.is, null);
        assert.equal(Object.keys(query.select).sort().join(","), "childName,email,guardianNames,id");
        return rows.filter(row => row.family === null).map(({ family, ...row }) => row);
      },
      async findUnique({ where }) { return rows.find(row => row.id === where.id) ?? null; },
    },
    invitationDeliveryJob: { async findMany() { return [{ status: "SENT" }]; } },
  };
  const list = load("src/modules/families/server/candidate-admissions.actions.ts", {
    "@/modules/auth/server/auth-guards": auth, "@/lib/prisma": { prisma },
  });
  const service = load("src/modules/families/server/candidate-family.service.ts", { "server-only": {}, "@/lib/prisma": { prisma } });
  const actions = load("src/modules/families/server/families.actions.ts", {
    "@prisma/client": require("@prisma/client"), "next/cache": { revalidatePath() {} }, zod: require("zod"),
    "@/modules/auth/server/auth-guards": auth, "@/lib/prisma": { prisma },
    "@/modules/families/server/families.repository": {}, "@/modules/families/lib/family-financial-summary": {},
    "@/modules/families/lib/candidate-family": load("src/modules/families/lib/candidate-family.ts", { zod: require("zod") }),
    "@/modules/families/server/candidate-family.service": service,
    "@/modules/mailing/server/invitation-delivery-worker.service": { async runInvitationDeliveryWorker() { calls.deliveries++; if (deliveryFails) throw Error("transport unavailable"); } },
    "@/modules/users/lib/user-invitation-feedback": {}, "@/modules/users/server/users.repository": {},
    "@/modules/families/server/family-import.service": { async confirmFamilyImport(importRows) {
      calls.imports.push(importRows);
      if (failCreation) return { ok: false, preview: { issues: [{ message: "No se pudo crear" }] } };
      const origin = rows.find(row => row.id === importRows[0].admissionInquiryId);
      origin.family = { id: "created-family", kind: "CANDIDATE" };
      return { ok: true, deliveryJobIds: ["job"] };
    } },
  });
  function form() {
    const data = new FormData();
    for (const [key, value] of Object.entries({ kind: "CANDIDATE", admissionInquiryId: "available", name: "Familia corregida", primaryEmail: "otro@example.test", secondaryEmail: "segundo@example.test" })) data.set(key, value);
    return data;
  }
  return { rows, calls, list: list.listCandidateAdmissionsAction, create: (overrides = {}) => {
    const data = form();
    for (const [key, value] of Object.entries(overrides)) data.set(key, value);
    return actions.createFamilyAction({ status: "idle", message: null }, data);
  } };
}

test("selector lists only initial inquiries with no linked family, excluding both kinds", async () => {
  const h = setup();
  const result = await h.list();
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "available");
  assert.equal(h.calls.permissions.join(","), "families.manage,contacts.view,contacts.manage");
  assert.equal(h.calls.imports.length, 0);
  assert.equal(h.calls.deliveries, 0);
});
for (const permission of ["families.manage", "contacts.view", "contacts.manage"]) {
  test(`selector denies ${permission} before reading personal data`, async () => {
    const h = setup({ denied: permission });
    await assert.rejects(h.list(), /forbidden/);
    assert.equal(h.calls.reads.length, 0);
    assert.equal(h.calls.imports.length, 0);
    assert.equal(h.calls.deliveries, 0);
  });
}
for (const deliveryFails of [false, true]) {
  test(`successful creation removes source, uses edited recipient and keeps origin (delivery failure: ${deliveryFails})`, async () => {
    const h = setup({ deliveryFails });
    assert.equal((await h.list()).length, 1);
    const result = await h.create();
    assert.equal(result.status, deliveryFails ? "warning" : "success");
    assert.equal((await h.list()).length, 0);
    assert.equal(h.rows.length, 3);
    const row = h.calls.imports[0][0];
    assert.equal(row.admissionInquiryId, "available");
    assert.equal(row.motherEmail, "otro@example.test");
    assert.equal(row.fatherEmail, "segundo@example.test");
    assert.equal(row.familyName, "Familia corregida");
    assert.equal(h.rows[0].guardianNames, "Lucía López");
    assert.equal(h.rows[0].email, "lucia@example.test");
    assert.equal(row.kind, "CANDIDATE");
    const duplicate = await h.create();
    assert.equal(duplicate.status, "error");
    assert.equal(duplicate.message, "Ese contacto de admisión ya tiene una familia creada.");
    assert.equal(h.calls.imports.length, 1);
    assert.equal(h.calls.deliveries, 1);
    h.rows[0].family.kind = "FAMILY";
    assert.equal((await h.list()).length, 0);
  });
}
test("candidate edits are validated before persistence or mail, without consuming the source", async () => {
  for (const overrides of [
    { name: "" }, { name: "A" }, { name: "X".repeat(121) },
    { primaryEmail: "" }, { primaryEmail: "a..b@example.com" },
    { secondaryEmail: "sin-arroba" },
    { primaryEmail: "otro@example.test", secondaryEmail: "OTRO@example.test" },
  ]) {
    const h = setup();
    const before = JSON.stringify(h.rows);
    const result = await h.create(overrides);
    assert.equal(result.status, "error");
    assert.equal(result.message, overrides.secondaryEmail === "OTRO@example.test" ? "Los dos emails deben ser distintos." : "Completá el nombre y un email principal válido. El segundo email, si lo ingresás, también debe ser válido.");
    assert.equal(JSON.stringify(h.rows), before);
    assert.equal(h.calls.imports.length, 0);
    assert.equal(h.calls.deliveries, 0);
    assert.equal((await h.list()).length, 1);
  }
});

test("original email may be a second recipient after editing the primary email", async () => {
  const h = setup();
  const result = await h.create({ name: "  Familia   editada  ", primaryEmail: " NUEVO@EXAMPLE.TEST ", secondaryEmail: "lucia@example.test" });
  assert.equal(result.status, "success");
  assert.equal(h.calls.imports[0][0].motherEmail, "nuevo@example.test");
  assert.equal(h.calls.imports[0][0].fatherEmail, "lucia@example.test");
  assert.equal(h.calls.imports[0][0].familyName, "Familia editada");
  assert.equal(h.rows[0].email, "lucia@example.test");
});

test("failed creation leaves inquiry selectable and original data unchanged", async () => {
  const h = setup({ failCreation: true });
  const before = JSON.stringify(await h.list());
  const result = await h.create();
  assert.equal(result.status, "error");
  assert.equal(result.message, "No se pudo crear");
  assert.equal(JSON.stringify(await h.list()), before);
  assert.equal(h.calls.deliveries, 0);
});
