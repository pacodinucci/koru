import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { buildFamilyFinancialSummary } from "../../src/modules/families/lib/family-financial-summary.ts";

const require = createRequire(import.meta.url);
function load(path, imports) {
  const source = readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, { module: mod, exports: mod.exports, require(id) { if (id in imports) return imports[id]; if (id === "react/jsx-runtime") return require(id); throw Error(`Unexpected import ${id}`); } });
  return mod.exports;
}

test("family index counts rubric assignments and preserves membership/status/balance", async () => {
  let query;
  const family = { id: "family", name: "Familia", status: "ACTIVE", eventualChargeSchedules: [], accountEntries: [{ id: "free", type: "EVENTUAL_CHARGE", amount: "25.50", occurredAt: new Date("2026-01-01T03:00:00Z"), allocationsAsCredit: [] }], _count: { users: 2, students: 2, eventualChargeSchedules: 3 } };
  const repository = load("src/modules/families/server/families.repository.ts", {
    "@/modules/families/lib/family-financial-summary": { buildFamilyFinancialSummary },
    "server-only": {}, "@prisma/client": { UserRole: { PARENT: "PARENT" } },
    "@/lib/prisma": { prisma: { family: { async findMany(args) { query = args; return [family]; } }, familyAccountEntry: { async groupBy() { return [{ familyId: "family", _sum: { amount: { toString: () => "25.50" } } }]; } } } },
  });
  const rows = await repository.listFamiliesForAdmin();
  assert.equal(query.include._count.select.eventualChargeSchedules.where.rubricId.not, null);
  assert.equal(query.include._count.select.eventualChargeSchedules.where.cancelledFrom, null);
  assert.equal(query.include.students, undefined);
  assert.equal(rows[0].name, "Familia");
  assert.equal(rows[0].status, "ACTIVE");
  assert.equal(rows[0]._count.users, 2);
  assert.equal(rows[0]._count.students, 2);
  assert.equal(rows[0]._count.eventualChargeSchedules, 3);
  assert.equal(rows[0].balance, "25.50");
});

test("family list presents assigned rubrics rather than an obsolete monthly plan fee", () => {
  const view = readFileSync(new URL("../../src/modules/families/views/dashboard-families-view.tsx", import.meta.url), "utf8");
  const table = readFileSync(new URL("../../src/modules/families/components/families-data-table.tsx", import.meta.url), "utf8");
  assert.match(view, /rubricsCount: family\._count\.eventualChargeSchedules/);
  assert.match(view, /href="\/dashboard\/families\/rubrics"/);
  assert.doesNotMatch(view, /annualPlanInstallment|student\.plan|monthlyFee|>Planes</);
  assert.match(table, /header: "Rubros asignados"/);
  assert.match(table, /Sin rubros asignados/);
  assert.doesNotMatch(table, /plansCount|monthlyFee|Cuota mensual|planes activos/);
  assert.match(table, /header: "Saldo"/);
  assert.match(table, /header: "Estado"/);
  assert.match(table, /header: "Integrantes"/);
});
