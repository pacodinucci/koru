import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
function buttonHarness({ denied = false, clipboardAvailable = true } = {}) {
  const copied = [];
  const notifications = [];
  let sequence = 0;
  const source = readFileSync("src/modules/blog/components/blog-copy-link-button.tsx", "utf8");
  const output = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const mod = { exports: {} };
  const mocks = {
    "lucide-react": { LinkIcon: (props) => React.createElement("svg", { ...props, "data-icon": "hyperlink" }) },
    "@/components/ui/button": { Button: ({ variant, size, ...props }) => {
      assert.equal(variant, "ghost");
      assert.equal(size, "icon");
      return React.createElement("button", props);
    } },
    "@/components/ui/toast": { useToast: () => ({ toast: (...args) => notifications.push(args) }) },
  };
  vm.runInNewContext(output, {
    module: mod, exports: mod.exports, URL,
    window: { location: { origin: "https://www.koruosa.com.mx", search: "?comment=sent#comments" } },
    crypto: { randomUUID: () => `fresh-${++sequence}` },
    navigator: clipboardAvailable ? { clipboard: { writeText: async (value) => {
      if (denied) throw new Error("Clipboard permission denied");
      copied.push(value);
    } } } : {},
    require: (id) => {
      if (id in mocks) return mocks[id];
      if (id.startsWith("react")) return require(id);
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  return { Button: mod.exports.BlogCopyLinkButton, copied, notifications };
}

test("copy control is an accessible hyperlink-icon button, not a WhatsApp navigation link", () => {
  const { Button } = buttonHarness();
  const html = renderToStaticMarkup(Button({ slug: "celebrar-la-cosecha" }));
  assert.match(html, /<button[^>]*type="button"/);
  assert.match(html, /aria-label="Copiar enlace del post"/);
  assert.match(html, /title="Copiar enlace para WhatsApp"/);
  assert.match(html, /<svg[^>]*aria-hidden="true"[^>]*data-icon="hyperlink"/);
  assert.doesNotMatch(html, /href=|wa.me|whatsapp.com/);
});

test("each click copies an absolute post URL with a fresh share parameter and confirms only successful copies", async () => {
  const { Button, copied, notifications } = buttonHarness();
  const element = Button({ slug: "celebrar-la-cosecha" });
  assert.equal(copied.length, 0);
  await element.props.onClick();
  await element.props.onClick();
  assert.deepEqual(copied, [
    "https://www.koruosa.com.mx/blog/celebrar-la-cosecha?share=fresh-1",
    "https://www.koruosa.com.mx/blog/celebrar-la-cosecha?share=fresh-2",
  ]);
  assert.deepEqual(notifications, [["Enlace copiado.", "success"], ["Enlace copiado.", "success"]]);
  assert.doesNotMatch(copied.join(""), /comment=|#comments/);
});

test("post slug stays in its own path segment and cannot replace the destination or add query values", async () => {
  const { Button, copied } = buttonHarness();
  await Button({ slug: "café/otra?comment=sent#section" }).props.onClick();
  const url = new URL(copied[0]);
  assert.equal(url.origin, "https://www.koruosa.com.mx");
  assert.equal(url.pathname, "/blog/caf%C3%A9%2Fotra%3Fcomment%3Dsent%23section");
  assert.equal(url.search, "?share=fresh-1");
  assert.equal(url.hash, "");
});

test("denied or unavailable clipboard reports an error without claiming success or copying anything", async () => {
  for (const options of [{ denied: true }, { clipboardAvailable: false }]) {
    const { Button, copied, notifications } = buttonHarness(options);
    await Button({ slug: "celebrar-la-cosecha" }).props.onClick();
    assert.deepEqual(copied, []);
    assert.deepEqual(notifications, [["No pudimos copiar el enlace.", "error"]]);
  }
});
