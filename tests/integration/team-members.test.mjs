import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../../", import.meta.url));
const cache = new Map();

function load(relativePath) {
  const filename = path.join(root, relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const testModule = { exports: {} };
  cache.set(filename, testModule);
  vm.runInNewContext(ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    module: testModule, exports: testModule.exports,
    require(id) {
      if (id.endsWith("cms-page-editable-image")) return { CmsPageEditableImage: () => null };
      if (id.endsWith("facilities-carousel")) return { FacilitiesCarousel: () => null };
      if (id.endsWith("about-video-section")) return { AboutVideoSection: () => null };
      if (id.endsWith("editable-content-slot")) return {
        EditableContentSlot: ({ as = "span", slot, textMap }) => React.createElement(as, {
          "data-content-slot-id": slot.id,
        }, textMap[slot.id] ?? slot.defaultValue),
      };
      if (id.startsWith("@/")) {
        const relative = `src/${id.slice(2)}`;
        const extension = [".ts", ".tsx"].find((ext) => existsSync(path.join(root, relative + ext)));
        assert.ok(extension, `Unresolved import: ${id}`);
        return load(relative + extension);
      }
      return require(id);
    },
  });
  return testModule.exports;
}

const { QuienesSomosView } = load("src/modules/quienes-somos/views/quienes-somos-view.tsx");
const memberName = (index) => `content.quienes-somos.team.member.${index}.name`;

function renderTeam(textMap, previewMode = false) {
  const html = renderToStaticMarkup(React.createElement(QuienesSomosView, { textMap, previewMode }));
  const team = html.match(/<section[^>]*id="equipo"[\s\S]*?<\/section>/)?.[0];
  assert.ok(team, "Public about view must render the team section");
  return team;
}

test("team excludes the CMS-named Itza card without shifting the other member slots", () => {
  const textMap = { [memberName(18)]: "Integrante conservado", [memberName(19)]: "Itza" };
  const snapshot = JSON.stringify(textMap);
  for (const previewMode of [false, true]) {
    const html = renderTeam(textMap, previewMode);
    assert.equal((html.match(/<article\b/g) ?? []).length, 19);
    assert.ok(!html.includes(`data-content-slot-id="${memberName(19)}"`));
    assert.ok(!html.includes(">Itza<"));
    assert.ok(html.includes(`data-content-slot-id="${memberName(18)}">Integrante conservado<`));
    for (let index = 0; index < 19; index++) {
      assert.ok(html.includes(`data-content-slot-id="${memberName(index)}"`), `Missing original slot ${index}`);
    }
    assert.ok(html.includes("grid grid-cols-2 md:grid-cols-4"));
  }
  assert.equal(JSON.stringify(textMap), snapshot);
});

test("team preserves all cards and CMS names when no member is named Itza", () => {
  const textMap = { [memberName(19)]: "Otra integrante" };
  const snapshot = JSON.stringify(textMap);
  const html = renderTeam(textMap);
  assert.equal((html.match(/<article\b/g) ?? []).length, 20);
  assert.ok(html.includes(`data-content-slot-id="${memberName(19)}">Otra integrante<`));
  assert.equal(JSON.stringify(textMap), snapshot);
});
