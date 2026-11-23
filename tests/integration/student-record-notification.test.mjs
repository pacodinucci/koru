import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path, mocks) {
  const module = { exports: {} };
  const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  vm.runInNewContext(output, { module, exports: module.exports, URL, Set, require: (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === "server-only") return {};
    if (id === "react" || id === "react/jsx-runtime") return require(id);
    throw Error(`Unexpected dependency ${id}`);
  } });
  return module.exports;
}
function app({ count = 1, denied = false, delivery = "sent", student = { id: "child", firstName: "Ana", lastName: "Pérez", guardians: [{ email: "family@example.com", fullName: "Familia" }] } } = {}) {
  const effects = { updates: [], emails: [], paths: [], reads: 0 };
  const viewer = { id: "admin" };
  const mocks = {
    "next/cache": { revalidatePath: (path) => effects.paths.push(path) },
    "@/modules/auth/server/auth-guards": { requirePermission: async (permission) => { assert.equal(permission, "students.manage"); if (denied) throw Error("denied"); return viewer; } },
    "@/modules/students/schemas/student.schema": { studentFormSchema: {} },
    "@/modules/students/server/students.repository": {
      updateStudentRecordStatus: async (...args) => { effects.updates.push(args); return { count }; },
      getStudentRecordForViewer: async (id, actor) => { assert.equal(id, "child"); assert.equal(actor, viewer); effects.reads++; return student; },
    },
    "@/lib/env": { env: { APP_URL: "https://koru.example" } },
    "@/modules/mailing/server/mailing.service": { sendMail: async (input) => { effects.emails.push(input); return { status: delivery }; } },
    "@/modules/mailing/templates/student-record-changes-email": { StudentRecordChangesEmail: () => null },
  };
  // Load production notification logic, while keeping DB and external email isolated.
  let notifier;
  mocks["@/modules/students/server/student-record-notification.service"] = {
    notifyStudentRecordChanges: (...args) => {
      notifier ??= load("modules/students/server/student-record-notification.service.ts", mocks);
      return notifier.notifyStudentRecordChanges(...args);
    },
  };
  const api = load("modules/students/server/student.actions.ts", mocks);
  async function update(status, id = "child") {
    const data = new FormData();
    if (id !== null) data.set("studentId", id);
    data.set("recordStatus", status);
    return api.updateStudentRecordStatusAction(data);
  }
  return { effects, update, viewer };
}

test("requesting changes emails the family with the child's name and record link", async () => {
  const { effects, update, viewer } = app();
  assert.equal(await update("NEEDS_CHANGES"), undefined);
  assert.equal(effects.updates.length, 1);
  assert.deepEqual(effects.updates[0], ["child", "NEEDS_CHANGES", viewer]);
  assert.equal(effects.emails.length, 1);
  const email = effects.emails[0];
  assert.equal(email.to[0].email, "family@example.com");
  assert.equal(email.subject, "Koru · Completar el expediente de Ana Pérez");
  assert.equal(email.react.props.studentName, "Ana Pérez");
  assert.equal(email.react.props.recordUrl, "https://koru.example/family-dashboard/expediente#alumno-child");
  assert.deepEqual(effects.paths, ["/dashboard/students", "/dashboard/students/child", "/family-dashboard", "/family-dashboard/expediente"]);
});

for (const status of ["REVIEWED", "SUBMITTED"]) {
  test(`${status} still updates without sending email`, async () => {
    const { effects, update } = app();
    assert.equal(await update(status), undefined);
    assert.equal(effects.updates.length, 1);
    assert.equal(effects.updates[0][1], status);
    assert.equal(effects.emails.length, 0);
    assert.equal(effects.reads, 0);
    assert.ok(effects.paths.includes("/dashboard/students/child"));
  });
}

for (const [label, options, status, id] of [
  ["invalid status", {}, "INVALID", "child"],
  ["missing student", {}, "NEEDS_CHANGES", null],
  ["out-of-scope student", { count: 0 }, "NEEDS_CHANGES", "child"],
  ["denied permission", { denied: true }, "NEEDS_CHANGES", "child"],
]) {
  test(`${label} sends nothing and does not refresh`, async () => {
    const { effects, update } = app(options);
    if (options.denied) await assert.rejects(() => update(status, id), /denied/);
    else assert.equal(await update(status, id), undefined);
    assert.equal(effects.updates.length, options.count === 0 ? 1 : 0);
    assert.equal(effects.emails.length, 0);
    assert.equal(effects.reads, 0);
    assert.deepEqual(effects.paths, []);
  });
}

test("duplicate guardian addresses receive only one email", async () => {
  const { effects, update } = app({ student: { id: "child", firstName: "Ana", lastName: "Pérez", guardians: [{ email: " Family@Example.com " }, { email: "family@example.com" }, { email: "other@example.com" }] } });
  await update("NEEDS_CHANGES");
  assert.deepEqual(effects.emails.map((email) => email.to[0].email), ["family@example.com", "other@example.com"]);
});

test("provider failure is surfaced and the persisted status is refreshed", async () => {
  const { effects, update } = app({ delivery: "failed" });
  await assert.rejects(() => update("NEEDS_CHANGES"), /No se pudo enviar/);
  assert.equal(effects.updates.length, 1);
  assert.equal(effects.emails.length, 1);
  assert.ok(effects.paths.includes("/dashboard/students/child"));
});

test("missing recipients cannot silently succeed", async () => {
  const { effects, update } = app({ student: { id: "child", firstName: "Ana", lastName: "Pérez", guardians: [] } });
  await assert.rejects(() => update("NEEDS_CHANGES"), /correo/);
  assert.equal(effects.emails.length, 0);
  assert.ok(effects.paths.includes("/dashboard/students/child"));
});

test("email template renders the child and a link without sensitive record details", async () => {
  const { renderToStaticMarkup } = require("react-dom/server");
  const { StudentRecordChangesEmail } = load("modules/mailing/templates/student-record-changes-email.tsx", {
    "@react-email/components": require("@react-email/components"),
    "@/modules/mailing/lib/email-copy": { EMAIL_LOCALE: "es-MX" },
  });
  const html = renderToStaticMarkup(require("react").createElement(StudentRecordChangesEmail, { studentName: "Ana <Pérez>", recordUrl: "https://koru.example/family-dashboard/expediente#alumno-child" }));
  assert.match(html, /Ana &lt;Pérez&gt;/);
  assert.match(html, /href="https:\/\/koru.example\/family-dashboard\/expediente#alumno-child"/);
  assert.match(html, /Completar expediente/);
});
