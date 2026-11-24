import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../../src/modules/landing/components/landing-nav.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("landing-nav.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declaration = ast.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "getDefaultSubmenuByLabel");
const getSubmenu = vm.runInNewContext(ts.transpile(declaration.getText(ast)) + "\ngetDefaultSubmenuByLabel;");

test("Blog offers Próximos eventos linked to its blog section", () => {
  for (const label of ["Blog", " BLOG "]) {
    const submenu = getSubmenu(label);
    assert.ok(submenu);
    assert.equal(submenu.columns[0].title, "Blog");
    assert.equal(submenu.columns[0].links.length, 1);
    assert.equal(submenu.columns[0].links[0].label, "Próximos eventos");
    assert.equal(submenu.columns[0].links[0].href, "/blog#proximos-eventos");
  }
  const blog = readFileSync(new URL("../../src/modules/blog/views/blog-list-view.tsx", import.meta.url), "utf8");
  assert.match(blog, /<aside[^>]*id="proximos-eventos"/);
});

test("Blog image has its own CMS slot and survives a renamed label", () => {
  const submenu = getSubmenu("Noticias", "blog");
  assert.equal(submenu.featured.imageSrc, getSubmenu("Comunidad").featured.imageSrc);
  assert.equal(submenu.featured.imageSlotId, "site-chrome.navbar.blog.featured");
  const config = readFileSync(new URL("../../src/modules/cms/site-chrome-content.ts", import.meta.url), "utf8");
  const loadedModule = { exports: {} };
  vm.runInNewContext(ts.transpileModule(config, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { module: loadedModule, exports: loadedModule.exports });
  const slot = loadedModule.exports.siteChromeImageSlots.find((item) => item.key === submenu.featured.imageSlotId);
  assert.ok(slot);
  assert.equal(slot.defaultSrc, submenu.featured.imageSrc);
  assert.equal(slot.frameLocked, true);
});

const require = createRequire(import.meta.url);
function renderNav(props) {
  const loadedModule = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module: loadedModule, exports: loadedModule.exports,
    require(id) {
      if (id === "react") return { useState: (initial) => [initial, () => {}], useRef: () => ({ current: null }), useEffect: () => {} };
      if (id.endsWith("site-chrome-content")) return { siteChromeNavbarSlots: [], siteChromeImageSlots: [], siteChromeSlotIds: {} };
      if (id.endsWith("cms-page-editable-image")) return { CmsPageEditableImage: "EditableImage" };
      if (id.startsWith("@/")) return {};
      return require(id);
    },
  });
  return loadedModule.exports.LandingNav(props);
}
function walk(node) {
  if (!node || typeof node !== "object") return [];
  return [node, ...[node.props?.children].flat(Infinity).flatMap(walk)];
}

test("selecting the Blog image opens a non-navigating preview card with CMS bindings", () => {
  const slotId = "site-chrome.navbar.blog.featured";
  const imageMap = { [slotId]: { url: "/replacement.png" } };
  const onSelect = () => {};
  const tree = renderNav({ previewMode: true, selectedContentSlotId: slotId, imageMap, onSelectContentSlot: onSelect, links: [{ id: "blog", label: "Noticias", href: "/blog" }] });
  const image = walk(tree).find((node) => node.type === "EditableImage");
  assert.ok(image, "selected image must remain visible without hovering the navbar");
  assert.equal(image.props.slotId, slotId);
  assert.equal(image.props.imageMap, imageMap);
  assert.equal(image.props.onSelectContentSlot, onSelect);
  assert.equal(image.props.lockFrame, true);
  assert.ok(walk(tree).some((node) => node.type === "div" && walk(node).includes(image)));
  assert.equal(walk(tree).some((node) => node.type === "a" && walk(node).includes(image)), false, "preview overlay button must not be nested in an anchor");
  tree.props.onMouseLeave();
  assert.ok(walk(renderNav({ previewMode: true, selectedContentSlotId: slotId })).some((node) => node.type === "EditableImage"));
});

test("existing default submenus and plain links keep their behavior", () => {
  assert.equal(getSubmenu("Cómo acompañamos").columns[0].links.length, 4);
  assert.equal(getSubmenu("Comunidad").columns[0].links.length, 4);
  assert.equal(getSubmenu("Contacto"), undefined);
});
