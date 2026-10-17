import "server-only";

import * as XLSX from "xlsx";

import { FORMULA_ERROR, preflightXlsx, SpreadsheetError } from "@/modules/operations/server/inventory-invoice.archive";
import { preflightCfb } from "@/modules/operations/server/inventory-invoice.cfb";

export { SpreadsheetError };
export const MALFORMED_SHEET = "La planilla está vacía, dañada o tiene un formato no compatible.";
export const SHEET_LIMITS = "La planilla supera los límites: 5 hojas, 1000 filas por hoja, 30 columnas, 10000 celdas o 100000 caracteres.";
const MAX_SHEETS = 5;
const MAX_ROWS = 1000;
const MAX_COLUMNS = 30;
const MAX_CELLS = 10000;
const MAX_TEXT = 100000;
const unsafeNames = new Set(["__proto__", "constructor", "prototype"]);
const malformed = (): never => { throw new SpreadsheetError(MALFORMED_SHEET); };
const oversized = (): never => { throw new SpreadsheetError(SHEET_LIMITS); };
type Value = string | number | boolean | null;
type Sheet = { name: string; rows: Value[][] };

function checkRange(reference: string): void {
  if (!/^[A-Z]+[1-9]\d*(?::[A-Z]+[1-9]\d*)?$/.test(reference)) malformed();
  const range = XLSX.utils.decode_range(reference);
  if (range.e.r >= MAX_ROWS || range.e.c >= MAX_COLUMNS) oversized();
}

/** Reject oversized declared AND actual cell addresses before XML parsing in xlsx. */
function preflightDimensions(xml: Map<string, string>): void {
  let sheets = 0;
  let cells = 0;
  const workbook = xml.get("xl/workbook.xml") ?? "";
  if ([...workbook.matchAll(/<(?:\w+:)?sheet\b/g)].length > MAX_SHEETS) oversized();
  for (const [name, content] of xml) {
    if (!/^xl\/worksheets\/[^/]+\.xml$/.test(name)) continue;
    if (++sheets > MAX_SHEETS || [...content.matchAll(/<(?:\w+:)?row\b/g)].length > MAX_ROWS) oversized();
    for (const match of content.matchAll(/<(?:\w+:)?(?:dimension|c)\b[^>]*\b(?:ref|r)\s*=\s*["']([^"']+)["']/g)) checkRange(match[1]);
    for (const match of content.matchAll(/<(?:\w+:)?row\b[^>]*\br\s*=\s*["'](\d+)["']/g)) {
      if (Number(match[1]) > MAX_ROWS) oversized();
    }
    cells += [...content.matchAll(/<(?:\w+:)?c\b/g)].length;
    if (cells > MAX_CELLS) oversized();
    if (/<(?:\w+:)?f(?:\s|>|\/)/.test(content)) throw new SpreadsheetError(FORMULA_ERROR);
  }
}

/** A bounded RFC-style CSV reader: keep every field as text, including decimal commas and '='. */
function csvRows(bytes: Uint8Array): Value[][] {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, "");
  if (!text.trim() || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text)) malformed();
  if (text.length > MAX_TEXT) oversized();
  // Detect the delimiter only outside quotes on the first record.
  let quoted = false;
  const counts = new Map([[",", 0], [";", 0], ["\t", 0]]);
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') i++;
      else quoted = !quoted;
    } else if (!quoted) {
      if (char === "\r" || char === "\n") break;
      if (counts.has(char)) counts.set(char, counts.get(char)! + 1);
    }
  }
  const [delimiter, count] = [...counts].sort((a, b) => b[1] - a[1])[0];
  if (!count) malformed();
  const rows: Value[][] = [];
  let row: string[] = [];
  let field = "";
  let state: "start" | "plain" | "quoted" | "closed" = "start";
  let cellCount = 0;
  const pushField = () => {
    row.push(field); field = ""; state = "start";
    if (row.length > MAX_COLUMNS || ++cellCount > MAX_CELLS) oversized();
  };
  const pushRow = () => {
    pushField();
    // Ignore only entirely blank physical records, never nonblank/ragged data.
    if (row.length !== 1 || row[0] !== "") {
      if (rows.length && row.length !== rows[0].length) malformed();
      rows.push(row);
      if (rows.length > MAX_ROWS) oversized();
    }
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (state === "quoted") {
      if (char !== '"') field += char;
      else if (text[i + 1] === '"') { field += '"'; i++; }
      else state = "closed";
    } else if (char === delimiter) pushField();
    else if (char === "\r" || char === "\n") {
      pushRow();
      if (char === "\r" && text[i + 1] === "\n") i++;
    } else if (char === '"' && state === "start") state = "quoted";
    else {
      if (char === '"' || state === "closed") malformed();
      field += char; state = "plain";
    }
  }
  if (state === "quoted") malformed();
  if (field || row.length || state === "closed") pushRow();
  return rows;
}

function preflightXls(bytes: Uint8Array): void {
  const data = Buffer.from(bytes);
  const signature = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  if (data.length < 512 || !data.subarray(0, 8).equals(signature) || data.readUInt16LE(28) !== 0xfffe) malformed();
  const sectorShift = data.readUInt16LE(30);
  if (![9, 12].includes(sectorShift) || data.length % (1 << sectorShift) !== 0
    || data.readUInt32LE(44) > data.length / (1 << sectorShift)
    || data.readUInt32LE(72) > data.length / (1 << sectorShift)) malformed();
  preflightCfb(data, MALFORMED_SHEET);
  // CFB reads bytes only: it never executes VBA, formulas or URLs. Reject embedded/macro streams.
  const container = XLSX.CFB.read(data, { type: "buffer" }) as {
    FullPaths: string[]; FileIndex: { name: string; content?: Uint8Array }[];
  };
  if (container.FullPaths.length > 128) oversized();
  if (container.FullPaths.some((path) => /VBA|Macros|ObjectPool/i.test(path))) throw new SpreadsheetError(FORMULA_ERROR);
  const workbook = container.FileIndex.find((entry) => /^(Workbook|Book)$/i.test(entry.name));
  if (!workbook?.content) return malformed();
  const records = Buffer.from(workbook.content);
  if (records.length < 8 || records.readUInt16LE(0) !== 0x0809 || records.readUInt16LE(4) !== 0x0600) malformed();
  let sheets = 0;
  // BIFF external-book references and formula records must not be passed as trusted values.
  for (let offset = 0; offset + 4 <= records.length;) {
    const id = records.readUInt16LE(offset);
    const length = records.readUInt16LE(offset + 2);
    if (offset + 4 + length > records.length) malformed();
    if (id === 0x0085) {
      if (length < 8) malformed();
      if (++sheets > MAX_SHEETS) oversized();
      const count = records[offset + 10];
      const unicode = records[offset + 11] & 1;
      if (8 + count * (unicode ? 2 : 1) > length) malformed();
      const name = records.subarray(offset + 12, offset + 12 + count * (unicode ? 2 : 1)).toString(unicode ? "utf16le" : "latin1");
      if (unsafeNames.has(name)) malformed();
      if (records[offset + 9] !== 0) throw new SpreadsheetError(FORMULA_ERROR);
    }
    if (id === 0x0200 && length >= 12
      && (records.readUInt32LE(offset + 8) > MAX_ROWS || records.readUInt16LE(offset + 14) > MAX_COLUMNS)) oversized();
    if (id === 0x0006 || id === 0x0206 || id === 0x0406) throw new SpreadsheetError(FORMULA_ERROR);
    if (id === 0x01ae && length >= 4) {
      const type = records.readUInt16LE(offset + 6);
      if (type !== 0x0401) throw new SpreadsheetError(FORMULA_ERROR);
    }
    offset += 4 + length;
  }
}

function excelSheets(bytes: Uint8Array, extension: "xlsx" | "xls"): Sheet[] {
  if (extension === "xlsx") preflightDimensions(preflightXlsx(bytes));
  else preflightXls(bytes);
  // Never materialize row headers as object keys. sheetRows has a sentinel row, not a truncation policy:
  // !fullref/!ref and dense lengths below must all fit before any document is sent to OpenAI.
  const workbook = XLSX.read(bytes, {
    type: "array", dense: true, raw: true, sheetRows: MAX_ROWS + 1,
    cellFormula: true, cellHTML: false, cellText: false, cellStyles: false,
    cellDates: false, bookVBA: false, WTF: true,
  });
  if (!workbook.SheetNames.length) malformed();
  if (workbook.SheetNames.length > MAX_SHEETS) oversized();
  return workbook.SheetNames.map((name): Sheet => {
    if (unsafeNames.has(name) || !Object.hasOwn(workbook.Sheets, name)) malformed();
    const sheet = workbook.Sheets[name];
    if (sheet["!fullref"]) checkRange(sheet["!fullref"]);
    if (sheet["!ref"]) checkRange(sheet["!ref"]);
    // xlsx 0.18 dense sheets are arrays. Refuse a fallback to a key-addressed representation.
    if (!Array.isArray(sheet)) malformed();
    if (sheet.length > MAX_ROWS) oversized();
    const rows: Value[][] = [];
    for (const source of sheet as XLSX.CellObject[][]) {
      if (source && source.length > MAX_COLUMNS) oversized();
      const row: Value[] = [];
      for (let col = 0; col < (source?.length ?? 0); col++) {
        const cell = source[col];
        if (cell?.f || cell?.F || cell?.l) throw new SpreadsheetError(FORMULA_ERROR);
        if (!cell || cell.t === "z") { row.push(null); continue; }
        const value: unknown = cell.v;
        if (cell.t === "e" || !["string", "number", "boolean"].includes(typeof value)
          || (typeof value === "number" && !Number.isFinite(value))) malformed();
        row.push(value as Value);
      }
      rows.push(row);
    }
    return { name, rows };
  });
}

export function spreadsheetText(bytes: Uint8Array, extension: "xlsx" | "xls" | "csv"): string {
  try {
    const sheets: Sheet[] = extension === "csv" ? [{ name: "CSV", rows: csvRows(bytes) }] : excelSheets(bytes, extension);
    let cellCount = 0;
    let nonempty = false;
    for (const sheet of sheets) {
      for (const row of sheet.rows) {
        cellCount += row.length;
        if (cellCount > MAX_CELLS) oversized();
        if (row.some((value) => value !== null && (typeof value !== "string" || value.trim() !== ""))) nonempty = true;
      }
    }
    if (!nonempty) malformed();
    const text = JSON.stringify({ sheets });
    if (text.length > MAX_TEXT) oversized();
    return text;
  } catch (error) {
    if (error instanceof SpreadsheetError) throw error;
    return malformed();
  }
}
