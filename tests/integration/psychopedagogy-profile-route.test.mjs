import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../../src/app/api/teacher/students/[id]/psychopedagogy/profile/route.ts", import.meta.url), "utf8");

test("profile route declares explicit GET/POST entrypoints and forwards requests and dynamic params unchanged", async () => {
  assert.match(source, /export async function GET\(/);
  assert.match(source, /export async function POST\(/);
  const calls = [];
  const response = Response.json({ ok: true });
  const handlers = Object.fromEntries(["GET", "POST"].map((method) => [method, async (...args) => {
    calls.push({ method, args });
    return response;
  }]));
  const module = { exports: {} };
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: (id) => {
      assert.equal(id, "@/modules/psychopedagogy/server/psychopedagogy-profile.handlers");
      return handlers;
    },
  });
  const context = { params: Promise.resolve({ id: "student-1" }) };
  for (const method of ["GET", "POST"]) {
    const request = new Request("http://localhost/api/teacher/students/student-1/psychopedagogy/profile", { method });
    assert.equal(await module.exports[method](request, context), response);
    const call = calls.at(-1);
    assert.equal(call.method, method);
    assert.equal(call.args[0], request);
    assert.equal(call.args[1], context);
  }
});
