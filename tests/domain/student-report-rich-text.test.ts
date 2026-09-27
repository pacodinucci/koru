import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeStudentReportBody,
  parseStudentReportRichText,
  RICH_REPORT_PREFIX,
} from "../../src/modules/teachers/lib/student-report-rich-text";

test("conserva reportes de texto anteriores", () => {
  assert.equal(normalizeStudentReportBody("  Un reporte previo  "), "Un reporte previo");
  assert.equal(parseStudentReportRichText("Un reporte previo"), null);
});

test("normaliza contenido WYSIWYG permitido", () => {
  const input = RICH_REPORT_PREFIX + JSON.stringify({
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Avances" }] },
      { type: "paragraph", content: [{ type: "text", text: "Muy bien", marks: [{ type: "bold" }] }] },
      { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Lectura" }] }] }] },
    ],
  });
  const normalized = normalizeStudentReportBody(input);
  assert.ok(normalized);
  const document = parseStudentReportRichText(normalized);
  assert.equal(document?.content?.[0]?.attrs?.level, 2);
  assert.deepEqual(document?.content?.[1]?.content?.[0]?.marks, [{ type: "bold" }]);
});

test("rechaza contenido vacío o nodos peligrosos", () => {
  assert.equal(normalizeStudentReportBody(RICH_REPORT_PREFIX + JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] })), null);
  assert.equal(normalizeStudentReportBody(RICH_REPORT_PREFIX + JSON.stringify({ type: "doc", content: [{ type: "image", attrs: { src: "https://example.com" } }] })), null);
  assert.equal(normalizeStudentReportBody(RICH_REPORT_PREFIX + JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hola", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }] })), null);
});
