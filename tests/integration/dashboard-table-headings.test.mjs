import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const paths = [
  "src/modules/teachers/views/teacher-reports-view.tsx",
  "src/modules/teachers/views/dashboard-teacher-reports-view.tsx",
  "src/modules/teachers/views/dashboard-teacher-follow-up-agreements-view.tsx",
  "src/app/(dashboard)/dashboard/mis-acuerdos-seguimiento/page.tsx",
];

for (const path of paths) {
  test(`${path} keeps a standalone Alumnos-sized page heading`, () => {
    const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const headings = [];
    const ancestors = [];
    function visit(node) {
      if (ts.isJsxElement(node)) {
        if (node.openingElement.tagName.getText(source) === "h1") {
          headings.push(node);
          assert.equal(ancestors.some((tag) => ["Card", "CardContent", "Table"].includes(tag)), false);
        }
        ancestors.push(node.openingElement.tagName.getText(source));
        ts.forEachChild(node, visit);
        ancestors.pop();
      } else {
        ts.forEachChild(node, visit);
      }
    }
    visit(source);
    assert.equal(headings.length, 1);
    const className = headings[0].openingElement.attributes.properties.find((attr) => attr.name?.getText(source) === "className");
    assert.ok(className?.initializer && ts.isStringLiteral(className.initializer));
    assert.match(className.initializer.text, /\btext-2xl\b/);
    assert.match(className.initializer.text, /\bfont-semibold\b/);
  });
}
