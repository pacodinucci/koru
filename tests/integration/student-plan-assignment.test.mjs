import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path, mocks) {
  const source = readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: name => name in mocks ? mocks[name] : name.startsWith("@/") || name.startsWith("next/") ? {} : require(name) });
  return exports;
}

test("retired plan actions cannot recreate catalog, assign plans or cancel rubric assignments", async () => {
  const permissions = [];
  const actions = load("src/modules/families/server/families.actions.ts", {
    "@/lib/prisma": { prisma: new Proxy({}, { get: () => { throw new Error("unexpected_database_access"); } }) },
    "@/modules/auth/server/auth-guards": { requirePermission: async p => { permissions.push(p); return { id: "admin" }; } },
    "next/cache": { revalidatePath: () => { throw new Error("unexpected_revalidation"); } },
  });
  const form = new FormData();
  form.set("familyId", "family"); form.set("studentId", "student"); form.set("planId", "plan");
  const result = await actions.createPlanAction({ message: null }, form);
  assert.equal(result.message, "Los planes fueron reemplazados por rubros. Administrá y asigná rubros por alumno.");
  for (const name of ["updatePlanAction", "createPlanEventualChargeItemAction", "updatePlanEventualChargeItemAction", "assignPlanToStudentAction"]) {
    await assert.rejects(actions[name](form), /Los planes fueron reemplazados por rubros\./);
  }
  assert.deepEqual(permissions, Array(5).fill("families.manage"));
});

test("retired regularization returns feedback without querying or synchronizing old plans", async () => {
  const permissions = [];
  const actions = load("src/modules/families/server/student-billing.actions.ts", {
    "@/modules/auth/server/auth-guards": { requirePermission: async p => { permissions.push(p); return { id: "admin" }; } },
  });
  const preview = await actions.previewFamilyBillingAction("family");
  assert.equal(preview.charges.length, 0); assert.equal(preview.schedules, 0); assert.equal(preview.token, "");
  assert.match(preview.warnings[0], /Los planes fueron reemplazados por rubros/);
  const result = await actions.regularizeFamilyBillingAction("family", "a".repeat(64));
  assert.equal(result.ok, false); assert.equal(result.message, preview.warnings[0]);
  assert.deepEqual(permissions, ["families.payments", "families.payments"]);
});
