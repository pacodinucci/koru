import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) => readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
test("only the psychopedagogy entrypoint grants Superadmin the learning editor", () => {
  assert.match(source("modules/psychopedagogy/views/psychopedagogy-view.tsx"), /canEditLearning=\{readOnly\}/);
  const detail = source("app/(dashboard)/dashboard/students/[id]/page.tsx");
  assert.match(detail, /<PsychopedagogyProfile student=\{reportStudent\} readOnly\s*\/>/);
  assert.doesNotMatch(detail, /canEditLearning=/);
});
