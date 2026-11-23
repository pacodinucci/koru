import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("kanban options user foreign keys use the mapped user table", () => {
  const sql = readFileSync(
    new URL(
      "../../prisma/migrations/20261022180000_kanban_column_options/migration.sql",
      import.meta.url,
    ),
    "utf8",
  );

  for (const table of ["KanbanStatusWatch", "KanbanNotification"]) {
    assert.ok(sql.includes(
      `ALTER TABLE "${table}" ADD CONSTRAINT "${table}_userId_fkey"\n` +
      `  FOREIGN KEY ("userId") REFERENCES "user"("id") ` +
      `ON DELETE CASCADE ON UPDATE CASCADE;`,
    ));
  }

  assert.doesNotMatch(sql, /REFERENCES "User"/);
});
