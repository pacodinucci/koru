import assert from "node:assert/strict";
import test from "node:test";
import { deflateRawSync } from "node:zlib";

import {
  getSafeStudentReportFileName,
  getStudentReportExtension,
  isStudentReportFileType,
  isValidStudentReportFile,
} from "../../src/modules/teachers/lib/student-report-file";

function zip(entries: Array<[string, string]>, deflated = false) {
  const localParts: Buffer[] = [];
  const directoryParts: Buffer[] = [];
  let localOffset = 0;
  for (const [name, content] of entries) {
    const nameBytes = Buffer.from(name);
    const data = Buffer.from(content);
    const payload = deflated ? deflateRawSync(data) : data;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(deflated ? 8 : 0, 8);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    localParts.push(local, nameBytes, payload);

    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0);
    directory.writeUInt16LE(deflated ? 8 : 0, 10);
    directory.writeUInt32LE(payload.length, 20);
    directory.writeUInt32LE(data.length, 24);
    directory.writeUInt16LE(nameBytes.length, 28);
    directory.writeUInt32LE(localOffset, 42);
    directoryParts.push(directory, nameBytes);
    localOffset += local.length + nameBytes.length + payload.length;
  }
  const directory = Buffer.concat(directoryParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localParts, directory, end]);
}

test("acepta únicamente formatos de adjunto conocidos y normaliza el nombre", () => {
  assert.equal(isStudentReportFileType("DOCX"), true);
  assert.equal(isStudentReportFileType("XLSX"), false);
  assert.equal(getStudentReportExtension("DOC"), "doc");
  assert.equal(getSafeStudentReportFileName("C:\\reportes\\Informe.DOCX", "DOCX"), "Informe.DOCX");
  assert.equal(getSafeStudentReportFileName("informe.pdf", "DOCX"), null);
  assert.equal(getSafeStudentReportFileName("informe.docx\u0000", "DOCX"), "informe.docx");
});

test("distingue PDF y Word binario por contenido", () => {
  assert.equal(isValidStudentReportFile(Buffer.from("%PDF-1.7 contenido"), "PDF"), true);
  assert.equal(isValidStudentReportFile(Buffer.from("otro contenido"), "PDF"), false);
  const doc = Buffer.concat([
    Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
    Buffer.from("WordDocument", "utf16le"),
  ]);
  assert.equal(isValidStudentReportFile(doc, "DOC"), true);
  assert.equal(isValidStudentReportFile(Buffer.from("WordDocument"), "DOC"), false);
});

test("exige las partes Word reales dentro del DOCX", () => {
  const parts: Array<[string, string]> = [
    ["[Content_Types].xml", '<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
    ["word/document.xml", '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'],
  ];
  const docx = zip(parts);
  assert.equal(isValidStudentReportFile(docx, "DOCX"), true);
  assert.equal(isValidStudentReportFile(zip(parts, true), "DOCX"), true);
  assert.equal(isValidStudentReportFile(zip([["other.txt", "not a document"]]), "DOCX"), false);
  assert.equal(isValidStudentReportFile(zip([
    ["[Content_Types].xml", "not Office"], ["word/document.xml", "not Word"],
  ]), "DOCX"), false);
  assert.equal(isValidStudentReportFile(docx.subarray(0, docx.length - 4), "DOCX"), false);
});
