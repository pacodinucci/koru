import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const componentUrl = new URL("../../src/modules/quienes-somos/components/about-video-section.tsx", import.meta.url);

function mount({ rejectPlay = false } = {}) {
  const state = [];
  let cursor = 0;
  const calls = [];
  const video = {
    src: "", muted: false,
    load() { calls.push("load"); },
    play() { calls.push("play"); return rejectPlay ? Promise.reject(new Error("blocked")) : Promise.resolve(); },
  };
  const testModule = { exports: {} };
  vm.runInNewContext(ts.transpileModule(readFileSync(componentUrl, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    module: testModule, exports: testModule.exports,
    require(id) {
      if (id === "react") return {
        useRef: () => ({ current: video }),
        useState(initial) {
          const index = cursor++;
          if (!(index in state)) state[index] = initial;
          return [state[index], (value) => { state[index] = value; }];
        },
      };
      return require(id);
    },
  });
  function render() { cursor = 0; return testModule.exports.AboutVideoSection(); }
  return { render, video, calls };
}

function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
}

function find(tree, type) { return nodes(tree).find((node) => node.type === type); }

test("initial view has a poster and accessible play button but no video source or autoplay", () => {
  const app = mount();
  const tree = app.render();
  const video = find(tree, "video");
  assert.equal(video.props.src, undefined);
  assert.equal(find(tree, "source"), undefined);
  assert.equal(video.props.preload, "none");
  assert.match(video.props.poster, /\.jpg$/);
  assert.equal(video.props.autoPlay, undefined);
  assert.equal(video.props.loop, undefined);
  assert.equal(video.props.muted, undefined);
  assert.equal(video.props.playsInline, true);
  assert.equal(video.props.controls, false);
  assert.ok(find(tree, "button").props["aria-label"]);
  assert.deepEqual(app.calls, []);
  assert.equal(app.video.src, "");
});

test("pressing play assigns the versioned Cloudinary MP4 directly and enables controls with sound", async () => {
  const app = mount();
  const button = find(app.render(), "button");
  button.props.onClick();
  assert.match(app.video.src, /^https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/v\d+\/koru\/quienes-somos\/institucional-1080p\.mp4$/);
  assert.equal(app.video.muted, false);
  assert.deepEqual(app.calls, ["load", "play"]);
  await Promise.resolve();
  const tree = app.render();
  assert.equal(find(tree, "video").props.controls, true);
  assert.equal(find(tree, "button"), undefined);
});

test("the migrated MP4 is not bundled in public and the small poster stays local", () => {
  assert.equal(existsSync(new URL("../../public/assets/videos/koru-institucional-1080p.mp4", import.meta.url)), false);
  assert.equal(existsSync(new URL("../../public/assets/videos/koru-institucional-poster.jpg", import.meta.url)), true);
});

test("playback rejection reports an error and allows the user to retry", async () => {
  const app = mount({ rejectPlay: true });
  find(app.render(), "button").props.onClick();
  await Promise.resolve();
  const tree = app.render();
  assert.ok(nodes(tree).find((node) => node.props?.role === "alert"));
  assert.ok(find(tree, "button"));
  assert.equal(find(tree, "video").props.controls, true);
  find(tree, "button").props.onClick();
  assert.deepEqual(app.calls, ["load", "play", "load", "play"]);
  await Promise.resolve();
});

test("media errors expose retry, buffering status clears when playback starts", () => {
  const app = mount();
  find(app.render(), "button").props.onClick();
  find(app.render(), "video").props.onWaiting();
  assert.ok(nodes(app.render()).find((node) => node.props?.role === "status"));
  find(app.render(), "video").props.onPlaying();
  assert.equal(nodes(app.render()).find((node) => node.props?.role === "status"), undefined);
  find(app.render(), "video").props.onError();
  assert.ok(nodes(app.render()).find((node) => node.props?.role === "alert"));
  assert.ok(find(app.render(), "button"));
});

test("video matches the team container width and uses minimal corner rounding", () => {
  const tree = mount().render();
  assert.match(tree.props.className, /\bpx-6\b/);
  assert.match(tree.props.className, /\bmd:px-10\b/);
  assert.match(tree.props.className, /\blg:px-14\b/);
  assert.equal(tree.props.children.props.className, "mx-auto w-full max-w-7xl");
  const frame = nodes(tree).find((node) => node.props?.className?.includes("aspect-video"));
  assert.match(frame.props.className, /\brounded-sm\b/);
});

test("about page includes the independent video after its introduction", () => {
  const source = readFileSync(new URL("../../src/modules/quienes-somos/views/quienes-somos-view.tsx", import.meta.url), "utf8");
  assert.match(source, /import \{ AboutVideoSection \}/);
  assert.ok(source.indexOf("<AboutVideoSection") > source.indexOf("quienesSomosContentSlotIds.heroParagraphFour"));
  assert.ok(source.indexOf("<AboutVideoSection") < source.indexOf("slotId={quienesSomosContentSlotIds.featured}"));
});
