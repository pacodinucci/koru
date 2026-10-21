import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import ts from "typescript";

const require = createRequire(import.meta.url);
const primitive = (name) => (props) => React.createElement(name, props, props.children);
const primitives = new Proxy({}, { get: (_, name) => primitive(name) });
function load(path, overrides = {}) {
  const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, { module: mod, exports: mod.exports, require: (id) => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (["react", "react/jsx-runtime"].includes(id)) return require(id);
    return primitives;
  } });
  return mod.exports;
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!React.isValidElement(tree)) return [];
  if (typeof tree.type === "function") return nodes(tree.type(tree.props));
  return [tree, ...nodes(tree.props.children), ...nodes(tree.props.render)];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join("");
  if (!React.isValidElement(tree)) return typeof tree === "string" ? tree : "";
  return typeof tree.type === "function" ? text(tree.type(tree.props)) : text(tree.props.children);
}

test("teacher invitation menu opens two exclusive responsive dialogs and closes each", () => {
  const states = [];
  let cursor = 0;
  const { TeacherInvitationActions } = load("modules/teachers/components/teacher-invitation-actions.tsx", {
    react: { ...React, useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], (value) => { states[i] = value; }]; } },
  });
  const render = () => { cursor = 0; return nodes(TeacherInvitationActions()); };
  let all = render();
  assert.ok(all.some((node) => node.type === "Settings2"), "same menu icon as Families");
  assert.ok(all.some((node) => node.type === "Button" && node.props["aria-label"] === "Opciones de docentes"));
  assert.equal(all.filter((node) => node.type === "ResponsiveDialog").length, 2);
  assert.ok(all.filter((node) => node.type === "ResponsiveDialog").every((node) => node.props.open === false));
  assert.deepEqual(all.filter((node) => node.type === "DropdownMenuItem").map(text), ["Invitar docente", "Importar docentes"]);
  for (const [label, form] of [["Invitar docente", "TeacherInvitationSingle"], ["Importar docentes", "TeacherInvitationImport"]]) {
    all.find((node) => node.type === "DropdownMenuItem" && text(node) === label).props.onClick();
    all = render();
    const open = all.filter((node) => node.type === "ResponsiveDialog" && node.props.open);
    assert.equal(open.length, 1);
    assert.ok(nodes(open[0]).some((node) => node.type === form), "existing form is reused unchanged");
    assert.ok(nodes(open[0]).some((node) => node.type === "ResponsiveDialogTitle" && text(node) === label));
    assert.ok(nodes(open[0]).some((node) => node.type === "ResponsiveDialogBody"));
    open[0].props.onOpenChange(false);
    all = render();
    assert.ok(all.filter((node) => node.type === "ResponsiveDialog").every((node) => !node.props.open));
  }
});

test("teachers title and action menu share a header outside the table card; inline invitations are removed", async () => {
  const { DashboardTeachersClient } = load("modules/teachers/components/dashboard-teachers-client.tsx", {
    react: { ...React, useState: (initial) => [initial, () => {}], useMemo: (fn) => fn(), useTransition: () => [false, () => {}] },
    "next/navigation": { useRouter: () => ({}) },
    "react-hook-form": { useForm: () => ({ control: {}, handleSubmit: (fn) => fn }) },
    "@hookform/resolvers/zod": { zodResolver: () => ({}) },
  });
  const tree = DashboardTeachersClient({ teachers: [], groups: [] });
  const header = tree.props.children[0];
  assert.match(header.props.className, /flex.*items-center.*justify-between/);
  const heading = nodes(header).find((node) => node.type === "h1");
  assert.equal(text(heading), "Docentes");
  assert.ok(nodes(header).some((node) => node.type === "TeacherInvitationActions"));
  assert.ok(!nodes(tree).some((node) => node.type === "CardTitle" && text(node) === "Docentes"));
  assert.match(text(tree), /Todavía no hay usuarios con rol docente/);
  const { DashboardTeachersView } = load("modules/teachers/views/dashboard-teachers-view.tsx", {
    "@/modules/auth/server/auth-guards": { requireRole: async () => ({ role: "SUPERADMIN" }) },
    "@/modules/teachers/server/teachers.repository": { listTeacherProfilesForAdmin: async () => [] },
    "@/modules/students/server/students.repository": { listStudentGroups: async () => [] },
  });
  const view = nodes(await DashboardTeachersView());
  assert.ok(view.some((node) => node.type === "DashboardTeachersClient"));
  assert.ok(!view.some((node) => ["TeacherInvitationSingle", "TeacherInvitationImport", "Card"].includes(node.type)));
});
