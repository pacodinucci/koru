import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { scripts } = JSON.parse(
  await readFile(new URL("../../package.json", import.meta.url), "utf8"),
);

test("production builds use Webpack to avoid the Turbopack Google Fonts resolver failure", () => {
  assert.equal(scripts.build, "next build --webpack");
});

test("development keeps its existing Webpack commands", () => {
  assert.equal(scripts.dev, "next dev --webpack");
  assert.equal(scripts["dev:webpack"], "next dev --webpack");
  assert.equal(scripts["dev:poll"], "set WATCHPACK_POLLING=true&& next dev --webpack");
});
