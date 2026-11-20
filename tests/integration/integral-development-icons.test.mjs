import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const componentUrl = new URL("../../src/modules/como-acompanamos/views/integral-development-map.tsx", import.meta.url);
const source = readFileSync(componentUrl, "utf8");
const importedIcons = [];
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, {
  module, exports: module.exports,
  require(id) {
    if (id.endsWith(".svg")) {
      assert.match(readFileSync(new URL(id, componentUrl), "utf8"), /<svg[\s>]/);
      const image = { src: `/_next/static/media/${id.split("/").pop()}`, width: 40, height: 40 };
      importedIcons.push(image);
      return image;
    }
    if (id === "next/image") return { __esModule: true, default: "img" };
    if (id === "react") return { ...require(id), useState: () => [null, () => {}] };
    return require(id);
  },
});

function walk(node) {
  if (!node || typeof node !== "object") return [];
  if (typeof node.type === "function") return walk(node.type(node.props));
  return [node, ...[node.props?.children].flat(Infinity).flatMap(walk)];
}

test("all five original SVGs are bundled and rendered in desktop and mobile maps", () => {
  const nodes = walk(module.exports.IntegralDevelopmentMap());
  const images = nodes.filter((node) => node.type === "img");
  assert.equal(importedIcons.length, 5, "icons must be build-time imports, not missing public URLs");
  assert.equal(images.length, 10);
  for (const image of importedIcons) {
    assert.equal(images.filter((node) => node.props.src === image).length, 2);
  }
});

test("the five dimension labels and accessible controls remain on both layouts", () => {
  const nodes = walk(module.exports.IntegralDevelopmentMap());
  const buttons = nodes.filter((node) => node.type === "button");
  assert.equal(buttons.length, 10);
  for (const label of ["Corporal", "Cognitiva", "Emocional", "Social", "Interior"]) {
    const matches = buttons.filter((node) => node.props["aria-label"].startsWith(`${label}: `));
    assert.equal(matches.length, 2);
    for (const button of matches) {
      assert.equal(button.props["aria-pressed"], false);
      assert.equal(typeof button.props.onClick, "function");
    }
  }
});
