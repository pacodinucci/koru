import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { compile } from "@tailwindcss/node";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = path => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const accordionSource = source("src/components/ui/accordion.tsx");
const viewSource = source("src/modules/families/views/dashboard-family-detail-view.tsx");
const exports = {};
vm.runInNewContext(ts.transpileModule(accordionSource, { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText, {
  exports,
  require: name => name === "@/lib/utils" ? require("../../src/lib/utils.ts") : require(name),
});
const { Accordion, AccordionItem, AccordionTrigger, AccordionContent } = exports;
const h = React.createElement;
function render(values) {
  return renderToStaticMarkup(h(Accordion, { multiple: true, value: values }, ["ana", "luis"].map(id =>
    h(AccordionItem, { key: id, value: id, render: h("section") },
      h("a", { href: `/dashboard/students/${id}` }, id),
      h(AccordionTrigger, { "aria-label": `Mostrar u ocultar rubros de ${id}` }, "Grupo"),
      h(AccordionContent, { className: "h-auto" }, h("p", null, `Rubros de ${id}`)),
    ),
  )));
}

test("real shadcn/Base UI accordion renders linked accessible controls for independent open and closed students", () => {
  for (const [values, openCount] of [[[], 0], [["ana"], 1], [["ana", "luis"], 2], [["luis"], 1]]) {
    const html = render(values);
    assert.equal((html.match(/aria-expanded="true"/g) ?? []).length, openCount);
    assert.equal((html.match(/aria-expanded="false"/g) ?? []).length, 2 - openCount);
    assert.equal((html.match(/aria-controls="[^"]+"/g) ?? []).length, openCount, "expanded panels expose their accessible control relationship");
    assert.equal((html.match(/<section\b/g) ?? []).length, 2);
    assert.doesNotMatch(html, /<button\b[^>]*>(?:(?!<\/button>)[\s\S])*<a\b/);
    for (const id of values) assert.ok(html.includes(`Rubros de ${id}`));
    for (const id of ["ana", "luis"]) assert.ok(html.includes(`href="/dashboard/students/${id}"`));
  }
});

test("student accordion compiles measured-height animations for opening and closing plus reduced-motion support", async () => {
  const classes = viewSource.match(/<Accordion multiple[\s\S]*?className="([^"]+)"/)?.[1];
  assert.ok(classes, "the family view configures the existing shadcn accordion");
  assert.ok(accordionSource.includes("data-open:animate-accordion-down"));
  assert.ok(accordionSource.includes("data-closed:animate-accordion-up"));
  assert.ok(classes.includes("--radix-accordion-content-height:var(--accordion-panel-height)"));
  assert.ok(classes.includes("motion-reduce:"));
  const compiler = await compile('@import "tailwindcss"; @import "tw-animate-css";', {
    base: fileURLToPath(new URL("../../", import.meta.url)),
    onDependency() {},
  });
  const css = compiler.build([...classes.split(" "), "data-open:animate-accordion-down", "data-closed:animate-accordion-up"]);
  assert.match(css, /--radix-accordion-content-height:\s*var\(--accordion-panel-height\)/);
  assert.match(css, /@keyframes accordion-down/);
  assert.match(css, /@keyframes accordion-up/);
  assert.match(css, /height:\s*var\(--radix-accordion-content-height/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /animation:\s*none/);
});
