import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const Module = require('node:module');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return originalResolve.call(this, name.startsWith('@/') ? path.resolve('src', name.slice(2)) : name, ...args);
};
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const source = readFileSync(filename, 'utf8');
    const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } });
    module._compile(output.outputText, filename);
  };
}
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { InitialQuestionnaireForm } = require('../../src/modules/admisiones/views/initial-questionnaire-form.tsx');
const { default: InitialQuestionnairePage } = require('../../src/app/(pages)/admisiones/cuestionario-inicial/page.tsx');
const { ContactDetail } = require('../../src/modules/contacts/views/contact-detail.tsx');
const { SearchParamsContext } = require('next/dist/shared/lib/hooks-client-context.shared-runtime');
const { QUESTIONNAIRE_SECTIONS, QUESTIONNAIRE_PRIVACY } = require('../../src/modules/admissions/initial-questionnaire.ts');
test('Contactos back link matches the family ghost/small arrow button and preserves list state', () => {
  const params = new URLSearchParams('q=Ana&source=contact&status=READ&page=2');
  const html = renderToStaticMarkup(React.createElement(SearchParamsContext.Provider, { value: params }, React.createElement(ContactDetail, { source: 'contact', id: 'test', canManage: false })));
  const back = html.match(/<a\b[^>]*>[\s\S]*?Volver a Contactos<\/a>/)?.[0];
  assert.ok(back, 'Back navigation remains a keyboard-accessible link');
  assert.match(back, /data-slot="button"/);
  assert.match(back, /hover:bg-muted/);
  assert.match(back, /h-7/);
  assert.match(back, /lucide-arrow-left/);
  assert.ok(back.includes('/dashboard/contactos?q=Ana&amp;source=contact&amp;status=READ&amp;page=2'));
});
test('public questionnaire explicitly uses the shared Montserrat form typography', () => {
  const html = renderToStaticMarkup(React.createElement(InitialQuestionnairePage));
  assert.match(html, /class="[^"]*font-montserrat/);
});
test('native form renders every approved question in order with associated labels and privacy notice', () => {
  const html = renderToStaticMarkup(React.createElement(InitialQuestionnaireForm));
  let cursor = 0;
  for (const question of QUESTIONNAIRE_SECTIONS.flatMap((section) => section.questions)) {
    const position = html.indexOf(`for="${question.key}"`, cursor);
    assert.ok(position >= cursor, question.key);
    assert.ok(html.includes(`id="${question.key}"`), question.key);
    cursor = position + 1;
  }
  assert.equal((html.match(/required=""/g) ?? []).length, 7);
  assert.equal((html.match(/<textarea/g) ?? []).length, 16);
  assert.ok(html.includes(QUESTIONNAIRE_PRIVACY));
  assert.ok(!html.includes('type="checkbox"'));
  assert.ok(html.includes('Enviar cuestionario'));
  assert.ok(!html.includes('Guardar borrador'));
});
