import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import React from "react";

const require = createRequire(import.meta.url);
function load(path, mocks) {
  const output = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, { module: mod, exports: mod.exports, require: (id) => mocks[id] ?? require(id) });
  return mod.exports;
}
function find(node, predicate) {
  if (!React.isValidElement(node)) return [];
  return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap((child) => find(child, predicate))];
}

test("request changes opens the existing responsive dialog and submits only on confirmation", async () => {
  const calls = [];
  let open = false;
  const Button = () => null;
  const names = ["ResponsiveDialog", "ResponsiveDialogTrigger", "ResponsiveDialogContent", "ResponsiveDialogHeader", "ResponsiveDialogTitle", "ResponsiveDialogDescription", "ResponsiveDialogBody", "ResponsiveDialogFooter", "ResponsiveDialogClose"];
  const dialog = Object.fromEntries(names.map((name) => [name, () => null]));
  const { StudentRecordChangesDialog } = load("src/modules/students/components/student-record-changes-dialog.tsx", {
    react: { ...React, useState: () => [open, (value) => { open = value; }] },
    "react-dom": { useFormStatus: () => ({ pending: false }) },
    "@/components/ui/button": { Button },
    "@/components/ui/responsive-dialog": dialog,
    "@/modules/students/server/student.actions": { updateStudentRecordStatusAction: async (data) => calls.push(data) },
  });
  const tree = StudentRecordChangesDialog({ studentId: "student-1", studentName: "Ana Pérez", guardianNames: ["María López", "Juan Pérez"] });
  assert.equal(tree.type, dialog.ResponsiveDialog);
  const trigger = find(tree, (n) => n.type === dialog.ResponsiveDialogTrigger)[0];
  assert.equal(trigger.props.render.props.type, "button");
  assert.equal(calls.length, 0);
  tree.props.onOpenChange(true);
  assert.equal(open, true);
  const text = JSON.stringify(tree);
  assert.match(text, /Ana Pérez/);
  assert.match(text, /María López y Juan Pérez/);
  const message = find(tree, (n) => n.type === "p")[0];
  assert.equal(React.Children.toArray(message.props.children).join(""), "Esta solicitud se comunicará por mail a María López y Juan Pérez para que puedan realizar los cambios necesarios.");
  assert.doesNotMatch(text, /no se enviará ningún correo/);
  assert.match(text, /aunque el formulario ya esté marcado/);
  assert.ok(find(tree, (n) => n.type === dialog.ResponsiveDialogClose).length);
  const form = find(tree, (n) => n.type === "form")[0];
  const data = new FormData();
  for (const input of find(form, (n) => n.type === "input")) data.set(input.props.name, input.props.value);
  assert.equal(data.get("studentId"), "student-1");
  assert.equal(data.get("recordStatus"), "NEEDS_CHANGES");
  await form.props.action(data);
  assert.equal(calls.length, 1);
  assert.equal(open, false);
  const page = readFileSync("src/app/(dashboard)/dashboard/students/[id]/page.tsx", "utf8");
  assert.match(page, /<StudentRecordChangesDialog/);
  assert.match(page, /value="REVIEWED"/);
});

test("every confirmed request sends email again and preserves other status updates", async () => {
  const updates = [], revalidated = [], notifications = [];
  const viewer = { id: "admin" };
  const { updateStudentRecordStatusAction } = load("src/modules/students/server/student.actions.ts", {
    "next/cache": { revalidatePath: (path) => revalidated.push(path) },
    "@/modules/auth/server/auth-guards": { requirePermission: async (permission) => { assert.equal(permission, "students.manage"); return viewer; } },
    "@/modules/students/schemas/student.schema": {},
    "@/modules/students/server/students.repository": { updateStudentRecordStatus: async (...args) => { updates.push(args); return { count: 1 }; } },
    "@/modules/students/server/student-record-notification.service": { notifyStudentRecordChanges: async (...args) => notifications.push(args) },
  });
  for (const status of ["NEEDS_CHANGES", "NEEDS_CHANGES", "REVIEWED", "SUBMITTED", "INVALID"]) {
    const data = new FormData();
    data.set("studentId", "student-1"); data.set("recordStatus", status);
    await updateStudentRecordStatusAction(data);
  }
  assert.deepEqual(updates.map((args) => args[1]), ["NEEDS_CHANGES", "NEEDS_CHANGES", "REVIEWED", "SUBMITTED"]);
  assert.equal(notifications.length, 2);
  for (const args of notifications) assert.deepEqual(args, ["student-1", viewer]);
  assert.equal(revalidated.length, 16);
  assert.deepEqual(revalidated.slice(0, 4), ["/dashboard/students", "/dashboard/students/student-1", "/family-dashboard", "/family-dashboard/expediente"]);
});
