import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".css", ".scss"]);
const skipDirs = new Set([".git", "node_modules", ".next", "dist", "build", "coverage"]);

const badPatterns = [
  /Ã./g,
  /Â./g,
  /�/g,
  /D\?a/g,
  /T\?tulo/g,
  /Pr\?ximos/g,
  /Reuni\?n/g,
  /S\?b/g,
  /Mi\?/g,
  /\\u00(?:e1|e9|ed|f3|fa)/g,
];

const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!skipDirs.has(name)) walk(full);
      continue;
    }
    if (exts.has(extname(name))) files.push(full);
  }
}
walk(ROOT);

const issues = [];
for (const file of files) {
  const content = readFileSync(file, "utf8");
  for (const p of badPatterns) {
    if (p.test(content)) {
      issues.push(file.replace(ROOT + "\\", ""));
      break;
    }
  }
}

if (issues.length) {
  console.error("\nEncoding/mojibake check failed in:\n");
  for (const f of issues) console.error(` - ${f}`);
  console.error("\nFix encoding/accents before commit.\n");
  process.exit(1);
}

console.log("Encoding check passed.");
