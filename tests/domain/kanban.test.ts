import assert from "node:assert/strict";
import test from "node:test";
import { parseDueDate, statusSchema } from "../../src/modules/kanban/domain/kanban-validation";

test("kanban permite Sin color y conserva la validación hexadecimal y de nombre", () => {
  for (const color of ["", "#123abc", "#ABCDEF"]) {
    const parsed = statusSchema.safeParse({ name: "  Columna  ", color });
    assert.equal(parsed.success, true);
    if (parsed.success) assert.deepEqual(parsed.data, { name: "Columna", color });
  }
  for (const color of ["red", "#abc", "#1234567", " #123abc", " "]) assert.equal(statusSchema.safeParse({ name: "Columna", color }).success, false);
  for (const name of [" ", "x".repeat(81)]) assert.equal(statusSchema.safeParse({ name, color: "" }).success, false);
});

test("kanban acepta fechas de formulario e ISO y permite quitar el vencimiento", () => {
  assert.equal(parseDueDate("2024-02-29")?.toISOString(), "2024-02-29T00:00:00.000Z");
  assert.equal(parseDueDate("2026-10-20T12:30:00.000Z")?.toISOString(), "2026-10-20T12:30:00.000Z");
  for (const value of [undefined, null, ""]) assert.equal(parseDueDate(value), null);
});

test("kanban rechaza fechas normalizadas o ambiguas y horarios inexistentes", () => {
  for (const value of ["2025-02-29", "2024-02-30", "2024-00-01", "2024-13-01", "2024-01-00", "2024-01-32", "2024-02-30T00:00:00Z", "2024-01-01T24:00:00Z", "2024-01-01T00:60:00Z", "2024-01-01T00:00:60Z", "2024-01-01T12:00", "01/02/2024", "ayer"]) {
    assert.throws(() => parseDueDate(value), { message: "Indicá una fecha de vencimiento válida." });
  }
});
