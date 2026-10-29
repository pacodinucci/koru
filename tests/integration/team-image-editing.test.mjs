import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync("src/modules/quienes-somos/views/quienes-somos-view.tsx", "utf8");
const members = source.slice(source.indexOf("const teamMembers ="), source.indexOf("const facilityImages ="));
const section = source.slice(source.indexOf("function TeamSection("), source.indexOf("function FacilitiesSection("));
const code = ts.transpileModule(`${members}\n${section}\nexport { TeamSection };`, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;
function setup(previewMode, selectedMember = null) {
  const selections = [], opened = [];
  const mod = { exports: {} };
  function Image() { return null; }
  vm.runInNewContext(code, {
    module: mod, exports: mod.exports, require,
    useState: () => [selectedMember, (value) => opened.push(value)],
    quienesSomosContentSlotIds: {}, EditableCopy: () => null,
    CmsPageEditableImage: Image, getInitials: () => "?",
  });
  const tree = mod.exports.TeamSection({ previewMode, textMap: {}, imageMap: {}, onSelectContentSlot: (id) => selections.push(id) });
  function nodes(node) {
    if (Array.isArray(node)) return node.flatMap(nodes);
    if (!React.isValidElement(node)) return [];
    return [node, ...nodes(node.props.children)];
  }
  return { nodes: nodes(tree), Image, selections, opened };
}
function event(closest = null) {
  return { target: { closest: () => closest }, prevented: false, stopped: false,
    preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
}

test("preview image click selects that member's image panel and opens their profile", () => {
  const state = setup(true);
  const cards = state.nodes.filter((node) => node.type === "article");
  for (const index of [0, 5, 8, 19]) {
    const click = event();
    cards[index].props.onClickCapture(click);
    assert.equal(state.selections.at(-1), `about.image.team.${index}`);
    assert.equal(state.opened.at(-1), index);
    assert.equal(click.prevented, true);
    assert.equal(click.stopped, true);
  }
});

test("expanded preview image remains editable using the same CMS slot and callback", () => {
  const state = setup(true, 8);
  const images = state.nodes.filter((node) => node.type === state.Image && node.props.slotId === "about.image.team.8");
  assert.equal(images.length, 2);
  const expanded = images.at(-1);
  assert.equal(expanded.props.previewMode, true);
  expanded.props.onSelectContentSlot(expanded.props.slotId);
  assert.deepEqual(state.selections, ["about.image.team.8"]);
  assert.equal(expanded.props.lockFrame, true);
  const copyLayer = state.nodes.find((node) => node.type === "div" && node.props.className?.includes("max-h-full"));
  assert.match(copyLayer.props.className, /\bz-30\b/);
});

test("preview text editing is not intercepted and public profiles still open without editing", () => {
  const preview = setup(true);
  const textClick = event({});
  preview.nodes.find((node) => node.type === "article").props.onClickCapture(textClick);
  assert.deepEqual(preview.selections, []);
  assert.deepEqual(preview.opened, []);
  assert.equal(textClick.prevented, false);
  const live = setup(false, 8);
  const card = live.nodes.find((node) => node.type === "article");
  card.props.onClickCapture(event());
  card.props.onClick();
  assert.deepEqual(live.selections, []);
  assert.equal(live.opened.at(-1), 0);
  const expanded = live.nodes.filter((node) => node.type === live.Image).at(-1);
  assert.equal(expanded.props.previewMode, false);
  const close = live.nodes.find((node) => node.type === "button" && node.props.className?.includes("absolute top-5"));
  assert.match(close.props.className, /\bz-40\b/);
  close.props.onClick();
  assert.equal(live.opened.at(-1), null);
});
