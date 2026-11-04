import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync("src/modules/quienes-somos/views/quienes-somos-view.tsx", "utf8");
const members = source.slice(source.indexOf("const teamMembers ="), source.indexOf("const facilityImages ="));
const section = source.slice(source.indexOf("function TeamSection("), source.indexOf("function FacilitiesSection("));
const output = ts.transpileModule(`${members}\n${section}\nexport { TeamSection };`, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;
const mod = { exports: {} };
vm.runInNewContext(output, {
  module: mod, exports: mod.exports, require,
  useState: () => [null, () => {}],
  quienesSomosContentSlotIds: { teamEyebrow: "team.title" },
  EditableCopy: ({ slotId, textMap }) => React.createElement("span", { "data-slot": slotId }, textMap[slotId]),
  CmsPageEditableImage: ({ slotId }) => React.createElement("img", { "data-slot": slotId, alt: "" }),
  getInitials: (name) => name[0],
});
function render(names) {
  const textMap = Object.fromEntries(names.map((name, index) => [`content.quienes-somos.team.member.${index}.name`, name]));
  return renderToStaticMarkup(React.createElement(mod.exports.TeamSection, { textMap, imageMap: {} }));
}

test("removes Itza without reindexing other members or changing the four-column grid", () => {
  const names = Array.from({ length: 20 }, (_, index) => `Member ${index}`);
  names[13] = "Itza";
  const html = render(names);
  assert.equal((html.match(/<article/g) ?? []).length, 19);
  assert.doesNotMatch(html, /member\.13\.name/);
  assert.doesNotMatch(html, />Itza</);
  for (let index = 0; index < 20; index++) {
    if (index !== 13) assert.ok(html.includes(`member.${index}.name`));
  }
  assert.match(html, /grid-cols-2 md:grid-cols-4/);
  assert.equal(19 % 4, 3);
});

test("keeps every other member and their original CMS slots", () => {
  const html = render(Array.from({ length: 20 }, (_, index) => `Member ${index}`));
  assert.equal((html.match(/<article/g) ?? []).length, 20);
  assert.match(html, /member\.19\.name/);
  assert.match(html, /about\.image\.team\.13/);
});
