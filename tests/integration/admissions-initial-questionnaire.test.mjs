import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
function renderAdmissions() {
  const source = readFileSync("src/modules/admisiones/views/admisiones-view.tsx", "utf8");
  const output = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, {
    module: mod, exports: mod.exports,
    require: (id) => {
      if (id === "@/modules/cms/components/cms-page-editable-copy") {
        return { CmsPageEditableCopy: ({ as, slotId }) => React.createElement(as, null, slotId) };
      }
      if (id.startsWith("react")) return require(id);
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  return renderToStaticMarkup(React.createElement(mod.exports.AdmisionesView, { textMap: {} }));
}

test("only the first admissions card links to the available initial questionnaire", () => {
  const html = renderAdmissions();
  const cards = [...html.matchAll(/<li class="relative pl-14[^>]*>([\s\S]*?)<div class="absolute left-5/g)].map((match) => match[1]);
  assert.equal(cards.length, 5);
  assert.match(cards[0], /<a[^>]*href="\/admisiones\/cuestionario-inicial"[^>]*>Completar cuestionario inicial<\/a>/);
  assert.doesNotMatch(html, /aria-disabled="true"|Próximamente/);
  for (const card of cards.slice(1)) assert.doesNotMatch(card, /Completar cuestionario inicial|\/admisiones\/cuestionario-inicial/);
  assert.equal((html.match(/Completar cuestionario inicial/g) ?? []).length, 1);
});

test("admissions keeps all timeline steps and the existing downloadable agreement", () => {
  const html = renderAdmissions();
  for (let index = 0; index < 5; index++) assert.ok(html.includes(`admissions.step.${index}.title`));
  assert.match(html, /href="\/documentos\/convenio-ingreso" download=""/);
  assert.doesNotMatch(html, /href="(?:#|\/family-dashboard\/cuestionario-ingreso)"/);
});
