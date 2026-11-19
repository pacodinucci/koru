import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function harness(count, error) {
  const notifications = [], paths = [];
  const source = ts.transpileModule(readFileSync("src/modules/students/server/student.actions.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mocks = {
    "next/cache": { revalidatePath: (path) => paths.push(path) },
    "@/modules/auth/server/auth-guards": { requirePermission: async () => ({ id: "admin" }) },
    "@/modules/students/schemas/student.schema": {},
    "@/modules/students/server/students.repository": { updateStudentRecordStatus: async () => ({ count }) },
    "@/modules/students/server/student-record-notification.service": { notifyStudentRecordChanges: async (id) => { notifications.push(id); if (error) throw error; } },
  };
  const mod = { exports: {} };
  vm.runInNewContext(source, { module: mod, exports: mod.exports, require: (id) => mocks[id] ?? require(id) });
  const data = new FormData();
  data.set("studentId", "student-1"); data.set("recordStatus", "NEEDS_CHANGES");
  return { run: () => mod.exports.updateStudentRecordStatusAction(data), notifications, paths };
}

test("a record not updated for the viewer never sends a notification", async () => {
  const h = harness(0);
  await h.run();
  assert.deepEqual(h.notifications, []);
  assert.deepEqual(h.paths, []);
});

test("delivery errors propagate while the changed status is revalidated", async () => {
  const error = new Error("Delivery failed");
  const h = harness(1, error);
  await assert.rejects(h.run(), (actual) => actual === error);
  assert.deepEqual(h.notifications, ["student-1"]);
  assert.deepEqual(h.paths, ["/dashboard/students", "/dashboard/students/student-1", "/family-dashboard", "/family-dashboard/expediente"]);
});
