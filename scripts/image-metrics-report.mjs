import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIR = path.join(ROOT, "public", "assets", "images");
const OUT_DIR = path.join(ROOT, "perf");
const OUT_FILE = path.join(OUT_DIR, "image-metrics.latest.json");

function listFilesRecursively(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listFilesRecursively(full));
    else files.push(full);
  }
  return files;
}

function main() {
  const files = listFilesRecursively(TARGET_DIR).filter((f) =>
    /\.(png|jpg|jpeg|webp|avif)$/i.test(f),
  );
  const metrics = files.map((f) => ({
    file: path.relative(ROOT, f).replaceAll("\\", "/"),
    bytes: fs.statSync(f).size,
  }));
  metrics.sort((a, b) => b.bytes - a.bytes);

  const payload = {
    generatedAt: new Date().toISOString(),
    imageCount: metrics.length,
    totalBytes: metrics.reduce((acc, x) => acc + x.bytes, 0),
    top10ByBytes: metrics.slice(0, 10),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, OUT_FILE)}`);
}

main();
