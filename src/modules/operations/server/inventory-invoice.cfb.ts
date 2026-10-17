import "server-only";

import { SpreadsheetError } from "@/modules/operations/server/inventory-invoice.archive";

/** Validate legacy CFB allocation/directory graphs before the installed parser follows them. */
export function preflightCfb(data: Buffer, message: string): void {
  const invalid = (): never => { throw new SpreadsheetError(message); };
  const sectorSize = 1 << data.readUInt16LE(30);
  const sectorCount = data.length / sectorSize - 1;
  if (data.readUInt16LE(26) !== (sectorSize === 512 ? 3 : 4) || data.readUInt16LE(32) !== 6
    || data.readUInt32LE(56) !== 4096) invalid();
  // A 4 MiB CFB fits in the header's 109 FAT pointers; extended DIFAT is unsupported.
  if (data.readUInt32LE(72) !== 0 || ![0xfffffffe, 0xffffffff].includes(data.readUInt32LE(68))) invalid();
  const fatCount = data.readUInt32LE(44);
  if (!fatCount || fatCount > 109) invalid();
  const sector = (id: number): Buffer => {
    if (id < 0 || id >= sectorCount) return invalid();
    return data.subarray((id + 1) * sectorSize, (id + 2) * sectorSize);
  };
  const fatIds = Array.from({ length: fatCount }, (_, i) => data.readInt32LE(76 + i * 4));
  if (new Set(fatIds).size !== fatCount) invalid();
  const fatBytes = Buffer.concat(fatIds.map(sector));
  if (fatBytes.length < sectorCount * 4) invalid();
  const fat = Array.from({ length: sectorCount }, (_, i) => fatBytes.readInt32LE(i * 4));
  validateGraph(fat, invalid);
  const chain = (start: number, table: number[]): number[] => {
    const ids: number[] = [];
    for (let id = start; id >= 0; id = table[id]) {
      if (id >= table.length || ids.length >= table.length) return invalid();
      ids.push(id);
    }
    if (ids.length && table[ids[ids.length - 1]] !== -2) invalid();
    return ids;
  };
  const directoryIds = chain(data.readInt32LE(48), fat);
  if (!directoryIds.length || directoryIds.length * sectorSize > 128 * 128) invalid();
  const directory = Buffer.concat(directoryIds.map(sector));
  const entries = Array.from({ length: directory.length / 128 }, (_, i) => {
    const offset = i * 128;
    const type = directory[offset + 66];
    const nameLength = directory.readUInt16LE(offset + 64);
    if (type && (nameLength < 2 || nameLength > 64 || nameLength % 2 !== 0)) invalid();
    if (![0, 2, 5].includes(type) || (type === 5 && i !== 0)) invalid();
    const size = directory.readUInt32LE(offset + 120);
    if (type && (directory.readUInt32LE(offset + 124) !== 0 || size > 4 * 1024 * 1024)) invalid();
    return {
      type, size, start: directory.readInt32LE(offset + 116),
      left: directory.readInt32LE(offset + 68), right: directory.readInt32LE(offset + 72), child: directory.readInt32LE(offset + 76),
    };
  });
  if (entries[0].type !== 5) invalid();
  const visited = new Set<number>();
  const visit = (id: number): void => {
    if (id === -1) return;
    if (id < 0 || id >= entries.length || visited.has(id) || entries[id].type === 0) invalid();
    visited.add(id);
    const entry = entries[id];
    if (entry.type === 2 && entry.child !== -1) invalid();
    visit(entry.left); visit(entry.right); visit(entry.child);
  };
  visit(0);
  if (entries.some((entry, i) => entry.type !== 0 && !visited.has(i))) invalid();
  const miniFatIds = chain(data.readInt32LE(60), fat);
  if (miniFatIds.length !== data.readUInt32LE(64)) invalid();
  const miniBytes = Buffer.concat(miniFatIds.map(sector));
  const miniCount = Math.ceil(entries[0].size / 64);
  if (miniCount * 4 > miniBytes.length) invalid();
  const miniFat = Array.from({ length: miniCount }, (_, i) => miniBytes.readInt32LE(i * 4));
  validateGraph(miniFat, invalid);
  let total = 0;
  for (const [i, entry] of entries.entries()) {
    if (!entry.type) continue;
    total += entry.size;
    if (total > 8 * 1024 * 1024) invalid();
    if (!entry.size) continue;
    const mini = i !== 0 && entry.size < 4096;
    const ids = chain(entry.start, mini ? miniFat : fat);
    if (ids.length !== Math.ceil(entry.size / (mini ? 64 : sectorSize))) invalid();
  }
}

function validateGraph(table: number[], invalid: () => never): void {
  const done = new Set<number>();
  for (let start = 0; start < table.length; start++) {
    if (done.has(start)) continue;
    const active = new Set<number>();
    for (let id = start; id >= 0 && !done.has(id); id = table[id]) {
      if (id >= table.length || active.has(id) || table[id] < -4) invalid();
      active.add(id);
    }
    for (const id of active) done.add(id);
  }
}
