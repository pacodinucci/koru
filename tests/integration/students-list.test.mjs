import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import React from "react";

const require = createRequire(import.meta.url);
function harness(readOnly = true) {
  const state = [];
  let cursor = 0;
  const component = () => null;
  const mocks = {
    react: { ...React, useMemo: (fn) => fn(), useTransition: () => [false, () => {}], useState: (initial) => {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], (value) => { state[index] = value; }];
    } },
    "next/link": { __esModule: true, default: component },
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    "@hookform/resolvers/zod": { zodResolver: () => ({}) },
    "react-hook-form": { useForm: () => ({ control: {}, reset() {}, handleSubmit: (fn) => fn }), useFieldArray: () => ({ fields: [] }) },
    "@/modules/students/schemas/student.schema": {},
    "@/modules/students/server/student.actions": {},
  };
  for (const [module, names] of Object.entries({
    card: ["Card", "CardAction", "CardContent", "CardHeader", "CardTitle"],
    tabs: ["Tabs", "TabsList", "TabsTrigger"],
    table: ["Table", "TableBody", "TableCell", "TableHead", "TableHeader", "TableRow"],
    button: ["Button"], input: ["Input"], badge: ["Badge"], textarea: ["Textarea"],
    form: ["Form", "FormControl", "FormField", "FormItem", "FormLabel", "FormMessage"],
    "responsive-dialog": ["ResponsiveDialog", "ResponsiveDialogBody", "ResponsiveDialogContent", "ResponsiveDialogDescription", "ResponsiveDialogFooter", "ResponsiveDialogHeader", "ResponsiveDialogTitle"],
  })) mocks[`@/components/ui/${module}`] = Object.fromEntries(names.map((name) => [name, () => null]));
  const output = ts.transpileModule(readFileSync("src/modules/students/components/dashboard-students-client.tsx", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, { module: mod, exports: mod.exports, require: (id) => mocks[id] ?? require(id) });
  const groups = [{ id: "a", name: "Esporas" }, { id: "b", name: "Helechos" }];
  const students = [
    { id: "one", firstName: "Ana", lastName: "Pérez", groupId: "a" },
    { id: "two", firstName: "Ana", lastName: "Gómez", groupId: "b" },
    { id: "three", firstName: "Juan", lastName: "Díaz", groupId: "b" },
  ].map((student) => ({ ...student, group: groups.find((g) => g.id === student.groupId), birthDate: "2018-01-01", updatedAt: "2026-01-01", teachers: [], guardians: [], status: "ACTIVE", recordStatus: "REVIEWED", questionnaireStatus: "PENDING" }));
  function find(predicate, node) {
    if (!React.isValidElement(node)) return [];
    return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap((child) => find(predicate, child))];
  }
  return {
    mocks, find,
    render: () => { cursor = 0; return mod.exports.DashboardStudentsClient({ students, groups, familyUsers: [], readOnly }); },
    of: (name) => Object.values(mocks).find((module) => module[name])?.[name],
  };
}

test("students heading is outside the table container and create action remains available", () => {
  for (const readOnly of [true, false]) {
    const h = harness(readOnly);
    const tree = h.render();
    assert.equal(h.find((n) => n.type === "h1" && n.props.children === "Alumnos", tree).length, 1);
    const card = h.find((n) => n.type === h.of("Card"), tree)[0];
    assert.equal(h.find((n) => n.props.children === "Alumnos", card).length, 0);
    assert.equal(h.find((n) => n.type === h.of("Button") && React.Children.toArray(n.props.children).includes("Nuevo alumno"), tree).length, readOnly ? 0 : 1);
  }
});

test("segmented group filters match contacts and preserve combined live search", () => {
  const h = harness();
  let tree = h.render();
  const tabs = () => h.find((n) => n.type === h.of("Tabs"), tree)[0];
  assert.ok(tabs(), "group filter uses tabs rather than a select");
  const triggers = h.find((n) => n.type === h.of("TabsTrigger"), tree);
  assert.deepEqual(triggers.map((n) => n.props.children), ["Todos", "Esporas", "Helechos"]);
  assert.ok(triggers.every((n) => n.props.className.includes("data-[active]:bg-background")));
  const list = h.find((n) => n.type === h.of("TabsList"), tree)[0];
  assert.ok(list.props.className.includes("bg-[color-mix(in_srgb,var(--brand-600)_14%,white)]"));
  assert.ok(list.props["aria-labelledby"]);
  const rows = () => h.find((n) => n.type === h.of("TableRow"), h.find((n) => n.type === h.of("TableBody"), tree)[0]).map((n) => n.key);
  assert.equal(rows().length, 3);
  h.find((n) => n.type === h.of("Input"), tree)[0].props.onChange({ target: { value: " ana " } });
  tree = h.render(); assert.equal(rows().length, 2);
  tabs().props.onValueChange("b");
  tree = h.render(); assert.equal(rows().length, 1); assert.match(rows()[0], /two/);
  tabs().props.onValueChange("");
  tree = h.render(); assert.equal(rows().length, 2);
  h.find((n) => n.type === h.of("Input"), tree)[0].props.onChange({ target: { value: "nadie" } });
  tree = h.render();
  assert.equal(h.find((n) => n.props.children === "Todavía no hay alumnos para mostrar.", tree).length, 1);
});
