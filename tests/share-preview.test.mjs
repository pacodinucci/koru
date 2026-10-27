import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { approvedPhotos, selectPhotos, renderCollage } from "../scripts/generate-share-preview.mjs";

test("selects four different approved space photos, never team photos", () => {
  for (let i = 0; i < 20; i++) {
    const photos = selectPhotos();
    assert.equal(photos.length, 4);
    assert.equal(new Set(photos).size, 4);
    assert.ok(photos.every((photo) => approvedPhotos.includes(photo)));
    assert.ok(photos.every((photo) => /^insta[1-8]\.png$/.test(photo)));
  }
});

test("renders a compact JPEG with four photo quadrants", async () => {
  const { createRequire } = await import("node:module");
  const sharp = createRequire(import.meta.resolve("next/package.json"))("sharp");
  const photos = approvedPhotos.slice(0, 4);
  const image = await renderCollage(photos);
  const metadata = await sharp(image).metadata();
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 630);
  assert.equal(metadata.format, "jpeg");
  assert.ok(image.length < 300_000);
  for (const [index, photo] of photos.entries()) {
    const left = index % 2 === 0 ? 0 : 604;
    const top = index < 2 ? 0 : 319;
    const quadrant = await sharp(image).extract({ left, top, width: 596, height: 311 }).raw().toBuffer();
    const expected = await sharp(`public/assets/images/${photo}`).rotate().resize(596, 311, { fit: "cover" }).removeAlpha().raw().toBuffer();
    let difference = 0;
    for (let i = 0; i < expected.length; i++) difference += Math.abs(expected[i] - quadrant[i]);
    assert.ok(difference / expected.length < 15, `quadrant ${index} matches its selected photo`);
  }
});

test("rejects unapproved images before rendering", async () => {
  await assert.rejects(renderCollage(["equipo1.png", ...approvedPhotos.slice(0, 3)]), /approved/);
  await assert.rejects(renderCollage(Array(4).fill(approvedPhotos[0])), /different/);
});

test("published metadata points to an existing content-versioned image", async () => {
  const { createHash } = await import("node:crypto");
  const config = JSON.parse(await readFile("src/lib/share-preview.json", "utf8"));
  const image = await readFile(`public${config.url}`);
  const hash = createHash("sha256").update(image).digest("hex").slice(0, 12);
  assert.equal(config.url, `/branding/koru-share-${hash}.jpg`);
  const layout = await readFile("src/app/layout.tsx", "utf8");
  assert.match(layout, /url: sharePreview\.url/);
  assert.match(layout, /images: \[sharePreview\.url\]/);
  const blog = await readFile("src/app/blog/[slug]/page.tsx", "utf8");
  assert.match(blog, /const defaultShareImage = sharePreview\.url/);
  // Existing article-specific images still override the fallback.
  assert.match(blog, /images: \[\{ url: getShareImage\(post\.content\), alt: post\.title \}\]/);
});
