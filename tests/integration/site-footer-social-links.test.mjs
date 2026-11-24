import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { Instagram, Youtube } from "lucide-react";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../../src/modules/landing/components/site-footer.tsx", import.meta.url), "utf8");
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  module,
  exports: module.exports,
  require(id) {
    if (!id.startsWith("@/")) return require(id);
    if (id.endsWith("inserted-text-blocks")) return {
      getCmsInsertedTextBlocks: () => [],
      serializeCmsInsertedTextBlocks: JSON.stringify,
    };
    if (id.endsWith("site-chrome-content")) return {
      siteChromeFooterSlots: [], siteChromeImageSlots: [], siteChromeSlotIds: {},
    };
    return {};
  },
});

function links(previewMode = false) {
  const tree = module.exports.SiteFooter({ textMap: {}, navLinks: [], previewMode });
  function walk(node) {
    if (!node || typeof node !== "object") return [];
    const children = [node.props?.children].flat(Infinity);
    return [node, ...children.flatMap(walk)];
  }
  return walk(tree).filter((node) => node.type === "a");
}

test("footer renders YouTube from Lucide immediately after Instagram with matching styling", () => {
  const anchors = links();
  const instagramIndex = anchors.findIndex((node) => node.props["aria-label"] === "Instagram de Koru");
  const instagram = anchors[instagramIndex];
  const youtube = anchors[instagramIndex + 1];
  assert.ok(youtube, "YouTube must follow Instagram");
  assert.equal(youtube.props.href, "https://www.youtube.com/@KORUOSA");
  assert.equal(youtube.props["aria-label"], "YouTube de Koru");
  assert.equal(youtube.props.children.type, Youtube);
  assert.equal(youtube.props.children.props["aria-hidden"], "true");
  assert.equal(youtube.props.children.props.className, instagram.props.children.props.className);
  assert.equal(youtube.props.className, instagram.props.className);
});

test("Instagram keeps its URL and icon, and both links prevent navigation only in CMS preview", () => {
  const instagram = links().find((node) => node.props["aria-label"] === "Instagram de Koru");
  assert.equal(instagram.props.href, "https://www.instagram.com/koruosa.tepoz");
  assert.equal(instagram.props.children.type, Instagram);
  for (const previewMode of [false, true]) {
    for (const anchor of links(previewMode).filter((node) => /^(Instagram|YouTube) de Koru$/.test(node.props["aria-label"]))) {
      let prevented = false;
      anchor.props.onClick({ preventDefault() { prevented = true; } });
      assert.equal(prevented, previewMode);
    }
  }
});
