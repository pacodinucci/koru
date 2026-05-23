import fs from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const PUBLIC_DIR = path.join(ROOT, "public");
const TARGET_FOLDER = "koru/landing";

const REQUIRED_ENVS = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

function loadDotEnvFile() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1")
      .replace(/^'(.*)'$/, "$1");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function assertEnv() {
  loadDotEnvFile();
  const missing = REQUIRED_ENVS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }
}

function listFilesRecursively(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursively(fullPath));
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

function collectReferencedPublicImages() {
  const codeFiles = listFilesRecursively(SRC_DIR).filter((file) =>
    /\.(ts|tsx|js|jsx|md)$/.test(file),
  );
  const pattern = /\/assets\/images\/([A-Za-z0-9_-]+)\.(png|jpg|jpeg|webp|avif)/g;
  const refs = new Set();

  for (const file of codeFiles) {
    const content = fs.readFileSync(file, "utf8");
    let match;
    while ((match = pattern.exec(content)) !== null) {
      refs.add(`/assets/images/${match[1]}.${match[2]}`);
    }
  }

  return [...refs].sort();
}

function fileToPublicId(assetPath) {
  const ext = path.extname(assetPath);
  const base = path.basename(assetPath, ext);
  return `${TARGET_FOLDER}/${base}`;
}

function formatError(error) {
  if (typeof error === "object" && error !== null) {
    const maybe = error;
    if (typeof maybe.message === "string") return maybe.message;
    if (
      typeof maybe.error === "object" &&
      maybe.error !== null &&
      typeof maybe.error.message === "string"
    ) {
      return maybe.error.message;
    }
  }
  if (error instanceof Error) return error.message;
  return "Unknown Cloudinary error";
}

async function uploadAsWebp(localAbsolutePath, publicId) {
  const options = {
    folder: TARGET_FOLDER,
    public_id: publicId.replace(`${TARGET_FOLDER}/`, ""),
    resource_type: "image",
    format: "webp",
    overwrite: true,
    invalidate: true,
  };
  const stats = fs.statSync(localAbsolutePath);
  if (stats.size > 10 * 1024 * 1024) {
    const result = await cloudinary.uploader.upload_large(localAbsolutePath, {
      ...options,
      chunk_size: 6 * 1024 * 1024,
    });
    if (Array.isArray(result)) {
      return result[result.length - 1];
    }
    return result;
  }
  return cloudinary.uploader.upload(localAbsolutePath, options);
}

async function main() {
  assertEnv();

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const referencedAssets = collectReferencedPublicImages();
  if (referencedAssets.length === 0) {
    console.log("No /assets/images references found in src.");
    return;
  }

  const existing = referencedAssets.filter((assetPath) =>
    fs.existsSync(path.join(PUBLIC_DIR, assetPath.replace(/^\//, ""))),
  );

  console.log(`Found ${existing.length} referenced local assets to migrate.`);

  for (const relativePath of existing) {
    const localPath = path.join(PUBLIC_DIR, relativePath.replace(/^\//, ""));
    const publicId = fileToPublicId(relativePath);
    try {
      const result = await uploadAsWebp(localPath, publicId);
      const resultPublicId =
        result && typeof result.public_id === "string"
          ? result.public_id
          : publicId;
      const resultFormat =
        result && typeof result.format === "string" ? result.format : "unknown";
      const resultBytes =
        result && typeof result.bytes === "number" ? result.bytes : undefined;
      console.log(
        `OK  ${relativePath} -> ${resultPublicId}.${resultFormat}${
          resultBytes ? ` (${resultBytes} bytes)` : ""
        }`,
      );
    } catch (error) {
      const message = formatError(error);
      const httpCode =
        typeof error === "object" &&
        error !== null &&
        "http_code" in error &&
        error.http_code
          ? ` (http ${String(error.http_code)})`
          : "";
      console.error(`ERR ${relativePath} -> ${message}${httpCode}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
