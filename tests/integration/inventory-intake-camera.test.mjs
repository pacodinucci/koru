import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = "../../src/modules/operations/components/";
function load(name, overrides = {}, globals = {}) {
  const source = readFileSync(new URL(root + name, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, { module: mod, exports: mod.exports, ...globals, require: (id) => {
    if (id in overrides) return overrides[id];
    if (id === "react" || id === "react/jsx-runtime") return require(id);
    if (id.endsWith("inventory-invoice-review")) return load("inventory-invoice-review.ts");
    if (id.endsWith("inventory-intake-files")) return load("inventory-intake-files.ts");
    return { Button: (props) => React.createElement("button", props) };
  } });
  return mod.exports;
}
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };
const plain = (value) => JSON.parse(JSON.stringify(value));
function harness({ media, secure = true, ready = true } = {}) {
  const slots = [];
  const effects = [];
  let pending = [];
  let cursor = 0;
  let tree;
  let active = true;
  let stops = 0;
  let requests = 0;
  const captured = [];
  const drawn = [];
  const stream = { getTracks: () => [{ stop: () => stops++ }, { stop: () => stops++ }] };
  const video = { videoWidth: ready ? 4000 : 0, videoHeight: ready ? 3000 : 0, srcObject: null, play: async () => {} };
  const canvas = { getContext: () => ({ drawImage: (...args) => drawn.push(args) }), toBlob: (cb, type) => cb(new Blob(["jpeg"], { type })) };
  const hooks = { ...React,
    useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = value; return [slots[i], (next) => { slots[i] = typeof next === "function" ? next(slots[i]) : next; }]; },
    useRef(value) { const i = cursor++; if (!(i in slots)) slots[i] = { current: value }; return slots[i]; },
    useEffect(fn, deps) { const i = cursor++; if (!effects[i] || deps.some((dep, j) => dep !== effects[i].deps[j])) pending.push(() => { effects[i]?.cleanup?.(); effects[i] = { deps, cleanup: fn() }; }); },
  };
  const { InventoryIntakeCamera } = load("inventory-intake-camera.tsx", { react: hooks }, {
    navigator: { mediaDevices: { getUserMedia: async (constraints) => { requests++; assert.deepEqual(plain(constraints), { video: { facingMode: { ideal: "environment" } }, audio: false }); return media ? media() : stream; } } },
    window: { isSecureContext: secure }, document: { createElement: () => canvas }, File, Blob,
  });
  function nodes(node) { if (!node || typeof node !== "object") return []; if (Array.isArray(node)) return node.flatMap(nodes); return [node, ...nodes(node.props?.children)]; }
  function text(node) { if (Array.isArray(node)) return node.map(text).join(""); return node && typeof node === "object" ? text(node.props?.children) : node == null ? "" : String(node); }
  const api = {
    render() { cursor = 0; tree = InventoryIntakeCamera({ active, onCapture: (file) => captured.push(file), onCancel: () => { active = false; }, onChooseFile: () => { active = false; } }); for (const node of nodes(tree)) if (node.type === "video") node.props.ref.current = video; const run = pending; pending = []; run.forEach((fn) => fn()); return api; },
    nodes: () => nodes(tree), text: () => text(tree), button: (label) => nodes(tree).find((node) => node.props?.onClick && text(node) === label),
    close() { active = false; api.render(); }, unmount() { effects.forEach((effect) => effect?.cleanup?.()); },
    stats: () => ({ stops, requests, captured, drawn, video, stream }),
  };
  return api.render();
}
const settle = async (ui) => { await Promise.resolve(); await Promise.resolve(); ui.render(); };

test("camera requests once, live preview flags, ready JPEG capture stops every track without upload", async () => {
  const ui = harness();
  assert.match(ui.text(), /Abriendo cámara/);
  await settle(ui);
  const video = ui.nodes().find((node) => node.type === "video");
  for (const flag of ["autoPlay", "muted", "playsInline"]) assert.equal(video.props[flag], true);
  assert.equal(ui.stats().video.srcObject, ui.stats().stream);
  ui.render(); ui.render();
  assert.equal(ui.stats().requests, 1);
  await ui.button("Capturar foto").props.onClick();
  assert.equal(ui.stats().captured.length, 1);
  assert.equal(ui.stats().captured[0].type, "image/jpeg");
  assert.equal(ui.stats().stops, 2);
  assert.equal(ui.stats().drawn.length, 1);
  ui.unmount();
  assert.equal(ui.stats().stops, 2);
});

test("camera refuses capture before dimensions are ready; cancel, mode/close and unmount stop tracks", async () => {
  const notReady = harness({ ready: false }); await settle(notReady);
  await notReady.button("Capturar foto").props.onClick(); notReady.render();
  assert.equal(notReady.stats().captured.length, 0);
  assert.match(notReady.text(), /todavía no está lista/);
  notReady.button("Cancelar cámara").props.onClick(); notReady.render();
  assert.equal(notReady.stats().stops, 2);
  for (const method of ["close", "unmount"]) { const ui = harness(); await settle(ui); ui[method](); assert.equal(ui.stats().stops, 2); }
});

test("late camera permission after close stops stream and cannot restore preview", async () => {
  const permission = deferred(); const ui = harness({ media: () => permission.promise });
  ui.close(); permission.resolve(ui.stats().stream); await settle(ui);
  assert.equal(ui.stats().stops, 2);
  assert.equal(ui.stats().video.srcObject, null);
  assert.equal(ui.nodes().some((node) => node.type === "video"), false);
});

test("permission, missing device and insecure context show Spanish native capture/file fallbacks", async () => {
  for (const name of ["NotAllowedError", "NotFoundError", "NotReadableError"]) {
    const ui = harness({ media: async () => { throw Object.assign(new Error("browser error"), { name }); } }); await settle(ui);
    assert.match(ui.text(), /permiso|cámara|ocupada/);
    assert.ok(ui.nodes().find((node) => node.props?.type === "file" && node.props.capture === "environment"));
    assert.ok(ui.button("Elegir archivo en este dispositivo"));
    assert.equal(ui.stats().captured.length, 0);
  }
  const ui = harness({ secure: false }); await settle(ui);
  assert.match(ui.text(), /HTTPS/); assert.equal(ui.stats().requests, 0);
});

function photoHelpers({ bytes = 1024, decodes = true } = {}) {
  let revoked = 0; let drawn = 0; const qualities = [];
  class ImageMock { naturalWidth = 4000; naturalHeight = 3000; set src(value) { if (value) queueMicrotask(() => decodes ? this.onload() : this.onerror()); } }
  const canvas = { getContext: () => ({ drawImage: () => drawn++, fillRect() {} }), toBlob: (cb, type, quality) => { qualities.push(quality); cb(new Blob([new Uint8Array(typeof bytes === "function" ? bytes(quality) : bytes)], { type })); } };
  const { prepareInvoiceFile } = load("inventory-intake-files.ts", {}, { Image: ImageMock, URL: { createObjectURL: () => "blob:photo", revokeObjectURL: () => revoked++ }, document: { createElement: () => canvas }, File, Blob });
  return { prepareInvoiceFile, stats: () => ({ revoked, drawn, qualities, canvas }) };
}

test("raw 8 MiB photo is resized/reencoded before final 4 MiB guard and releases object URL", async () => {
  const helper = photoHelpers({ bytes: (quality) => quality > 0.8 ? 5 * 1024 * 1024 : 2 * 1024 * 1024 });
  const file = await helper.prepareInvoiceFile(new File([new Uint8Array(8 * 1024 * 1024)], "foto.jpg", { type: "image/jpeg" }));
  assert.equal(file.type, "image/jpeg"); assert.ok(file.size <= 4 * 1024 * 1024);
  assert.equal(helper.stats().canvas.width, 2400); assert.equal(helper.stats().canvas.height, 1800);
  assert.ok(helper.stats().qualities.length > 1); assert.equal(helper.stats().revoked, 1);
});

test("HEIC is only supported when browser decodes; impossible/raw >20 MiB photos rejected with Spanish guidance", async () => {
  const source = new File(["heic"], "foto.heic", { type: "image/heic" });
  assert.equal((await photoHelpers().prepareInvoiceFile(source)).type, "image/jpeg");
  const noDecode = photoHelpers({ decodes: false });
  await assert.rejects(noDecode.prepareInvoiceFile(source), /JPEG|PNG/); assert.equal(noDecode.stats().revoked, 1);
  await assert.rejects(photoHelpers({ bytes: 5 * 1024 * 1024 }).prepareInvoiceFile(source), /4 MB/);
  await assert.rejects(photoHelpers().prepareInvoiceFile(new File([new Uint8Array(21 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" })), /20 MB/);
  const csv = new File(["producto,cantidad\nGuantes,2"], "ingreso.csv", { type: "" });
  assert.equal(await photoHelpers().prepareInvoiceFile(csv), csv);
});
