import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeRoot = new URL("../../src/app/(dashboard)/dashboard/families/", import.meta.url);

test("rubric catalog retains the family read permission and management capability", async () => {
  const source = await readFile(new URL("rubrics/page.tsx", routeRoot), "utf8");
  assert.match(source, /requirePermission\("families\.view"\)/);
  assert.match(source, /permissionKeys\.includes\("families\.manage"\)/);
  assert.match(source, /DashboardRubricsView/);
  assert.match(source, /breadcrumbPage="Rubros"/);
});

for (const path of ["plans/page.tsx", "plans/new/page.tsx", "plans/[planId]/page.tsx"]) {
  test(`legacy ${path} no longer exposes plan creation or editing`, async () => {
    const source = await readFile(new URL(path, routeRoot), "utf8");
    assert.match(source, /requirePermission\("families\.(view|manage)"\)/);
    assert.match(source, /redirect\("\/dashboard\/families\/rubrics"\)/);
    assert.doesNotMatch(source, /CreatePlanForm|updatePlanAction|assignPlanToStudentAction/);
  });
}
