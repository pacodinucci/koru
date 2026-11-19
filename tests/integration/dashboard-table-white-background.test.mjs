import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const paths = [
  "src/modules/dashboard/components/dashboard-searchable-table.tsx",
  "src/modules/students/components/dashboard-students-client.tsx",
  "src/modules/teachers/components/dashboard-teachers-client.tsx",
  "src/modules/families/components/families-data-table.tsx",
  "src/modules/families/components/rubric-catalog.tsx",
  "src/modules/psychopedagogy/components/psychopedagogy-client.tsx",
  "src/modules/contacts/views/contacts-list.tsx",
  "src/modules/documents/components/dashboard-documents-view.tsx",
  "src/modules/blog/views/dashboard-blog-view.tsx",
  "src/modules/users/views/dashboard-users-view.tsx",
  "src/modules/mailing/views/dashboard-mailing-view.tsx",
  "src/modules/operations/views/cash-fund-dashboard-view.tsx",
  "src/modules/operations/views/inventory-dashboard-view.tsx",
  "src/modules/teachers/components/teacher-reports-table.tsx",
  "src/modules/teachers/components/teacher-profile-reports-table.tsx",
  "src/modules/follow-up-agreements/components/teacher-agreements-client.tsx",
  "src/modules/follow-up-agreements/components/teacher-follow-up-agreements-client.tsx",
];

for (const path of paths) {
  test(`${path} gives every listing table an opaque white surface`, () => {
    const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let tables = 0;
    function visit(node, surfaces = []) {
      if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === "DashboardSearchableTable") {
        tables++;
        assert.ok(source.statements.some((statement) => ts.isImportDeclaration(statement)
          && statement.moduleSpecifier.text === "@/modules/dashboard/components/dashboard-searchable-table"
          && statement.importClause?.namedBindings?.getText(source).includes("DashboardSearchableTable")), "delegated table uses the white searchable-table component checked by this suite");
      }
      if (ts.isJsxElement(node)) {
        const opening = node.openingElement;
        const tag = opening.tagName.getText(source);
        const attr = opening.attributes.properties.find((prop) => prop.name?.getText(source) === "className");
        const classes = attr?.initializer && ts.isStringLiteral(attr.initializer) ? attr.initializer.text.split(/\s+/) : [];
        if (tag === "Table") {
          tables++;
          assert.ok(surfaces.some((surface) => surface === "white" || surface === "card"), "table inherits a white Card or explicitly white container, not the dashboard background");
        }
        const surface = classes.includes("bg-white") ? "white" : tag === "Card" ? "card" : null;
        ts.forEachChild(node, (child) => visit(child, surface ? [...surfaces, surface] : surfaces));
      } else {
        ts.forEachChild(node, (child) => visit(child, surfaces));
      }
    }
    visit(source);
    assert.ok(tables > 0);
  });
}

test("existing Card surfaces are white in the dashboard theme", () => {
  assert.match(readFileSync("src/components/ui/card.tsx", "utf8"), /\bbg-card\b/);
  const css = readFileSync("src/app/globals.css", "utf8");
  const root = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(root, /--card:\s*#ffffff\s*;/);
});
