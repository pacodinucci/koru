import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "config", "image-budget.json");
const SRC_DIR = path.join(ROOT, "src");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

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

function collectReferencedAssets() {
  const codeFiles = listFilesRecursively(SRC_DIR).filter((f) =>
    /\.(ts|tsx|js|jsx|md)$/.test(f),
  );
  const rx = /\/assets\/images\/([A-Za-z0-9_-]+\.(png|jpg|jpeg|webp|avif))/g;
  const refs = new Set();
  for (const file of codeFiles) {
    const content = fs.readFileSync(file, "utf8");
    let match;
    while ((match = rx.exec(content)) !== null) {
      refs.add(match[1]);
    }
  }
  return refs;
}

function budgetFor(fileName, cfg) {
  if (fileName.toLowerCase().endsWith(".png")) return cfg.maxBytesPng;
  return cfg.maxBytesDefault;
}

function fmt(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function main() {
  const cfg = readJson(CONFIG_PATH);
  const rootDir = path.join(ROOT, cfg.rootDir);
  const allowed = new Set(cfg.allowedOversize ?? []);
  const referenced = collectReferencedAssets();

  const allFiles = listFilesRecursively(rootDir).filter((f) =>
    /\.(png|jpg|jpeg|webp|avif)$/i.test(f),
  );
  const targetFiles = cfg.referencedOnly
    ? allFiles.filter((f) => referenced.has(path.basename(f)))
    : allFiles;

  const violations = [];
  for (const file of targetFiles) {
    const name = path.basename(file);
    const size = fs.statSync(file).size;
    const soft = budgetFor(name, cfg);
    const hard = cfg.maxBytesAbsolute;
    const isAllowed = allowed.has(name);

    if (size > hard && !isAllowed) {
      violations.push(`${name}: ${fmt(size)} supera hard limit ${fmt(hard)}`);
      continue;
    }
    if (size > soft && !isAllowed) {
      violations.push(`${name}: ${fmt(size)} supera budget ${fmt(soft)}`);
    }
  }

  const total = targetFiles.reduce((acc, f) => acc + fs.statSync(f).size, 0);
  console.log(
    `Checked ${targetFiles.length} imágenes referenciadas (${fmt(total)} total).`,
  );

  if (violations.length > 0) {
    console.error("Image budget violations:");
    for (const v of violations) console.error(`- ${v}`);
    process.exit(1);
  }

  console.log("OK image budgets.");
}

main();
