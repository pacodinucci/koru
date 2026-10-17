import "server-only";

import { inflateRawSync } from "node:zlib";

export const ARCHIVE_ERROR = "El XLSX está dañado, no es una planilla compatible o supera los límites de descompresión (8 MiB y 128 archivos).";
export const FORMULA_ERROR = "La planilla contiene fórmulas o vínculos externos. Exportala como valores y volvé a subirla.";
export class SpreadsheetError extends Error {}

const EXPANDED_LIMIT = 8 * 1024 * 1024;
const ENTRY_LIMIT = 128;
const unsafeNames = new Set(["__proto__", "constructor", "prototype"]);
const crcTable = Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function invalid(): never { throw new SpreadsheetError(ARCHIVE_ERROR); }

/** Inspect and bounded-inflate every entry before the legacy spreadsheet parser sees the ZIP. */
export function preflightXlsx(bytes: Uint8Array): Map<string, string> {
  try { return inspectZip(Buffer.from(bytes)); }
  catch (error) {
    if (error instanceof SpreadsheetError) throw error;
    return invalid();
  }
}

function inspectZip(zip: Buffer): Map<string, string> {
  // No ZIP64, encryption, multi-disk archives or ambiguous trailing bytes.
  if (zip.length < 22 || zip.readUInt32LE(0) !== 0x04034b50) invalid();
  let end = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65557); i--) {
    if (zip.readUInt32LE(i) === 0x06054b50 && i + 22 + zip.readUInt16LE(i + 20) === zip.length) { end = i; break; }
  }
  // The installed parser searches backwards for EOCD without validating comments.
  // Refuse comments so it cannot select a second attacker-controlled EOCD.
  if (end < 0 || zip.readUInt16LE(end + 4) || zip.readUInt16LE(end + 6) || zip.readUInt16LE(end + 20)) invalid();
  const count = zip.readUInt16LE(end + 10);
  const start = zip.readUInt32LE(end + 16);
  if (!count || count > ENTRY_LIMIT || zip.readUInt16LE(end + 8) !== count
    || start + zip.readUInt32LE(end + 12) !== end) invalid();

  const entries: { name: string; offset: number; method: number; flags: number; size: number; compressed: number; crc: number }[] = [];
  const names = new Set<string>();
  let position = start;
  let expanded = 0;
  for (let i = 0; i < count; i++) {
    if (position + 46 > end || zip.readUInt32LE(position) !== 0x02014b50) invalid();
    const flags = zip.readUInt16LE(position + 8);
    const method = zip.readUInt16LE(position + 10);
    const compressed = zip.readUInt32LE(position + 20);
    const size = zip.readUInt32LE(position + 24);
    const nameLength = zip.readUInt16LE(position + 28);
    const next = position + 46 + nameLength + zip.readUInt16LE(position + 30) + zip.readUInt16LE(position + 32);
    if (next > end || !nameLength || flags & ~0x0808 || ![0, 8].includes(method) || zip.readUInt16LE(position + 34)) invalid();
    const name = new TextDecoder("utf-8", { fatal: true }).decode(zip.subarray(position + 46, position + 46 + nameLength));
    const canonical = name.toLowerCase();
    if (name.includes("\\") || name.includes("\0") || name.startsWith("/") || name.includes("//")
      || name.split("/").some((part) => part === ".." || part === "." || unsafeNames.has(part)) || names.has(canonical)) invalid();
    // CFB's ZIP lookup is case-insensitive: aliases must not bypass dimension/content checks.
    names.add(canonical);
    expanded += size;
    if (expanded > EXPANDED_LIMIT || compressed > zip.length) invalid();
    entries.push({ name, offset: zip.readUInt32LE(position + 42), method, flags, size, compressed, crc: zip.readUInt32LE(position + 16) });
    position = next;
  }
  if (position !== end || !names.has("[content_types].xml") || !names.has("xl/workbook.xml")
    || !entries.some((entry) => /^xl\/worksheets\/[^/]+\.xml$/i.test(entry.name))) invalid();

  const xml = new Map<string, string>();
  const ranges: { start: number; end: number }[] = [];
  for (const entry of entries) {
    const local = entry.offset;
    if (local + 30 > start || zip.readUInt32LE(local) !== 0x04034b50
      || zip.readUInt16LE(local + 6) !== entry.flags || zip.readUInt16LE(local + 8) !== entry.method) invalid();
    const nameEnd = local + 30 + zip.readUInt16LE(local + 26);
    const dataStart = nameEnd + zip.readUInt16LE(local + 28);
    const dataEnd = dataStart + entry.compressed;
    if (dataEnd > start || new TextDecoder("utf-8", { fatal: true }).decode(zip.subarray(local + 30, nameEnd)) !== entry.name) invalid();
    const localCompressed = zip.readUInt32LE(local + 18);
    const localSize = zip.readUInt32LE(local + 22);
    let recordEnd = dataEnd;
    if (entry.flags & 8) {
      // The installed parser allocates from LOCAL sizes even when a descriptor is present.
      if ((localCompressed !== 0 && localCompressed !== entry.compressed) || (localSize !== 0 && localSize !== entry.size)) invalid();
      const descriptor = dataEnd + (zip.readUInt32LE(dataEnd) === 0x08074b50 ? 4 : 0);
      recordEnd = descriptor + 12;
      if (recordEnd > start || zip.readUInt32LE(descriptor) !== entry.crc
        || zip.readUInt32LE(descriptor + 4) !== entry.compressed || zip.readUInt32LE(descriptor + 8) !== entry.size) invalid();
    } else if (localCompressed !== entry.compressed || localSize !== entry.size) invalid();
    if (ranges.some((range) => local < range.end && recordEnd > range.start)) invalid();
    ranges.push({ start: local, end: recordEnd });
    const data = zip.subarray(dataStart, dataEnd);
    let inflated = data;
    if (entry.method === 8) {
      // Node returns this shape with info:true; @types/node declares only the default Buffer shape.
      const output = inflateRawSync(data, { maxOutputLength: Math.max(1, entry.size), info: true }) as unknown as {
        buffer: Buffer; engine: { bytesWritten: number };
      };
      inflated = output.buffer;
      // Deflate streams may not hide trailing compressed data from this preflight.
      if (output.engine.bytesWritten !== data.length) invalid();
    }
    if (inflated.length !== entry.size || crc32(inflated) !== entry.crc) invalid();
    if (/vbaProject|externalLinks|activeX|embeddings/i.test(entry.name)) throw new SpreadsheetError(FORMULA_ERROR);
    if (/\.(xml|rels)$/i.test(entry.name)) {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(inflated);
      if (/<!DOCTYPE|<!ENTITY/i.test(text)) invalid();
      // Names/IDs in workbook, relationships and custom properties become parser keys.
      // Cell text is NOT inspected here: literal headers such as __proto__ remain row values.
      for (const match of text.matchAll(/\b(?:name|Id|id)\s*=\s*["']([^"']*)["']/g)) {
        const value = match[1].replace(/&#(x[\da-f]+|\d+);/gi, (_, code: string) => String.fromCodePoint(code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code)));
        if (unsafeNames.has(value)) invalid();
      }
      if (/TargetMode\s*=\s*["']External["']|<\w*:?(?:externalReference|externalLink)\b/i.test(text)) throw new SpreadsheetError(FORMULA_ERROR);
      xml.set(entry.name.toLowerCase(), text);
    }
  }
  const types = xml.get("[content_types].xml") ?? "";
  const workbook = xml.get("xl/workbook.xml") ?? "";
  if (!types.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml")
    || !workbook.includes("http://schemas.openxmlformats.org/spreadsheetml/2006/main")) invalid();
  // Workbook sheet names become parser dictionary keys, unlike row-array cell values.
  for (const match of workbook.matchAll(/\bname\s*=\s*["']([^"']*)["']/g)) {
    const decoded = match[1].replace(/&#(x[\da-f]+|\d+);/gi, (_, code: string) => String.fromCodePoint(code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code)))
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    if (unsafeNames.has(decoded)) invalid();
  }
  return xml;
}
