import { inflateRawSync } from "node:zlib";

export type StudentReportFileType = "PDF" | "DOC" | "DOCX";

const extensions: Record<StudentReportFileType, string> = {
  PDF: "pdf",
  DOC: "doc",
  DOCX: "docx",
};

const oleHeader = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const wordDocumentStream = Buffer.from("WordDocument", "utf16le");

export function isStudentReportFileType(value: unknown): value is StudentReportFileType {
  return value === "PDF" || value === "DOC" || value === "DOCX";
}

export function getStudentReportExtension(type: StudentReportFileType) {
  return extensions[type];
}

export function getSafeStudentReportFileName(fileName: string, type: StudentReportFileType) {
  const name = fileName.split(/[\\/]/).pop()?.replace(/[\x00-\x1f\x7f]/g, "").trim();
  if (!name || name.length > 255 || !name.toLowerCase().endsWith(`.${extensions[type]}`)) return null;
  return name;
}

function hasDocxStructure(buffer: Buffer) {
  // A DOCX is a ZIP with these two required Office Open XML parts.
  const minEocdSize = 22;
  const searchStart = Math.max(0, buffer.length - minEocdSize - 0xffff);
  let eocd = -1;
  for (let offset = buffer.length - minEocdSize; offset >= searchStart; offset--) {
    if (buffer.readUInt32LE(offset) === 0x06054b50 && offset + minEocdSize + buffer.readUInt16LE(offset + 20) === buffer.length) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0 || buffer.readUInt16LE(eocd + 4) !== 0 || buffer.readUInt16LE(eocd + 6) !== 0) return false;

  const entryCount = buffer.readUInt16LE(eocd + 10);
  const directorySize = buffer.readUInt32LE(eocd + 12);
  const directoryOffset = buffer.readUInt32LE(eocd + 16);
  if (entryCount === 0xffff || directorySize === 0xffffffff || directoryOffset === 0xffffffff
    || directoryOffset + directorySize > eocd) return false;

  let offset = directoryOffset;
  const directoryEnd = directoryOffset + directorySize;
  let contentTypes: string | null = null;
  let wordDocument: string | null = null;
  for (let index = 0; index < entryCount; index++) {
    if (offset + 46 > directoryEnd || buffer.readUInt32LE(offset) !== 0x02014b50) return false;
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const next = offset + 46 + nameLength + extraLength + commentLength;
    if (next > directoryEnd) return false;
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    if (name === "[Content_Types].xml" || name === "word/document.xml") {
      const flags = buffer.readUInt16LE(offset + 8);
      const method = buffer.readUInt16LE(offset + 10);
      const compressedSize = buffer.readUInt32LE(offset + 20);
      const uncompressedSize = buffer.readUInt32LE(offset + 24);
      const localOffset = buffer.readUInt32LE(offset + 42);
      if ((flags & 1) !== 0 || uncompressedSize > 1024 * 1024
        || localOffset + 30 > directoryOffset || buffer.readUInt32LE(localOffset) !== 0x04034b50) return false;
      const dataOffset = localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28);
      if (dataOffset + compressedSize > directoryOffset) return false;
      const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
      let data: Buffer;
      try {
        if (method === 0) data = compressed;
        else if (method === 8) data = inflateRawSync(compressed, { maxOutputLength: 1024 * 1024 });
        else return false;
      } catch {
        return false;
      }
      if (data.length !== uncompressedSize) return false;
      if (name === "[Content_Types].xml") contentTypes = data.toString("utf8");
      else wordDocument = data.toString("utf8");
    }
    offset = next;
  }
  return offset === directoryEnd
    && contentTypes?.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml") === true
    && wordDocument?.includes("wordprocessingml/2006/main") === true;
}

export function isValidStudentReportFile(buffer: Buffer, type: StudentReportFileType) {
  if (type === "PDF") return buffer.subarray(0, 5).equals(Buffer.from("%PDF-"));
  if (type === "DOC") {
    return buffer.subarray(0, oleHeader.length).equals(oleHeader)
      && buffer.includes(wordDocumentStream);
  }
  return buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
    && hasDocxStructure(buffer);
}
