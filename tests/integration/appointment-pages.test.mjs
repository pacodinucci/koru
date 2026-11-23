import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import React from "react";

const require = createRequire(import.meta.url);
function load(file, mocks) {
  const source = readFileSync(file, "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, { module: mod, exports: mod.exports, require: (id) => {
    if (id in mocks) return mocks[id];
    if (id.startsWith("react")) return require(id);
    throw new Error(`Unexpected import: ${id}`);
  } });
  return mod.exports;
}
function findContact(element) {
  if (!React.isValidElement(element)) return null;
  if (element.type === "contact-detail") return element.props;
  for (const child of React.Children.toArray(element.props.children)) {
    const result = findContact(child);
    if (result) return result;
  }
  return null;
}

test("contact page grants scheduling only to admins with manage permission and admission source", async () => {
  for (const [role, source, manage, expected] of [
    ["ADMIN", "admission", true, true], ["SUPERADMIN", "admission", true, true],
    ["TEACHER", "admission", true, false], ["ADMIN", "contact", true, false],
    ["ADMIN", "admission", false, false],
  ]) {
    const page = load("src/app/(dashboard)/dashboard/contactos/[source]/[id]/page.tsx", {
      "next/navigation": { notFound() { throw new Error("not found"); } },
      "@/modules/auth/server/auth-guards": { requirePermission: async (key) => {
        assert.equal(key, "contacts.view");
        return { email: "admin@example.test", role, permissionKeys: manage ? ["contacts.view", "contacts.manage"] : ["contacts.view"] };
      } },
      "@/modules/dashboard/components/dashboard-shell": { DashboardShell: "dashboard-shell" },
      "@/modules/contacts/views/contact-detail": { ContactDetail: "contact-detail" },
    });
    const props = findContact(await page.default({ params: Promise.resolve({ source, id: "inquiry" }) }));
    assert.equal(props.canSchedule, expected, `${role}/${source}/${manage}`);
    assert.equal(props.canManage, manage);
  }
});

test("family scheduling page is anonymous, non-indexable, and never places the token in metadata", async () => {
  const page = load("src/app/(appointments)/citas/[token]/page.tsx", {
    "@/modules/appointments/views/appointment-family-view": { AppointmentFamilyView: "family-view" },
  });
  assert.equal(page.metadata.robots.index, false);
  assert.equal(page.metadata.robots.follow, false);
  assert.equal(page.metadata.referrer, "no-referrer");
  const view = await page.default({ params: Promise.resolve({ token: "opaque-token" }) });
  assert.equal(view.type, "family-view");
  assert.equal(view.props.token, "opaque-token");
  assert.doesNotMatch(JSON.stringify(page.metadata), /opaque-token/);
});
