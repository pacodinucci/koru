import { createHash, randomInt } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Use the image processor shipped with Next.js; no additional dependency needed.
const sharp = createRequire(import.meta.resolve("next/package.json"))("sharp");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Visually reviewed spaces and landscapes only. Never discover photos by glob:
// other collections include staff portraits even when filenames omit "equipo".
export const approvedPhotos = Object.freeze([
  "insta1.png", "insta2.png", "insta3.png", "insta4.png",
  "insta5.png", "insta6.png", "insta7.png", "insta8.png",
]);

export function selectPhotos() {
  const pool = [...approvedPhotos];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 4);
}

export async function renderCollage(photos) {
  if (photos.length !== 4 || new Set(photos).size !== 4) {
    throw new Error("Select four different photos.");
  }
  if (!photos.every((photo) => approvedPhotos.includes(photo))) {
    throw new Error("Only approved space photos may be used.");
  }
  const tiles = await Promise.all(photos.map(async (photo, index) => ({
    input: await sharp(resolve(root, "public/assets/images", photo))
      .rotate().resize(596, 311, { fit: "cover" }).toBuffer(),
    left: index % 2 === 0 ? 0 : 604,
    top: index < 2 ? 0 : 319,
  })));
  return sharp({ create: { width: 1200, height: 630, channels: 3, background: "#ffffff" } })
    .composite(tiles).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
}

async function main() {
  const photos = selectPhotos();
  const image = await renderCollage(photos);
  const hash = createHash("sha256").update(image).digest("hex").slice(0, 12);
  const url = `/branding/koru-share-${hash}.jpg`;
  await mkdir(resolve(root, "public/branding"), { recursive: true });
  // Publish the complete static image before switching metadata to its new URL.
  // Previous images remain available for links already cached by social apps.
  await writeFile(resolve(root, `public${url}`), image);
  await writeFile(resolve(root, "src/lib/share-preview.json"), `${JSON.stringify({ url, width: 1200, height: 630, alt: "Espacios y naturaleza de Koru en Tepoztlán" }, null, 2)}\n`);
  console.log(`Share preview: ${url} (${image.length} bytes)`);
  console.log(`Photos: ${photos.join(", ")}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error); process.exitCode = 1; });
}
