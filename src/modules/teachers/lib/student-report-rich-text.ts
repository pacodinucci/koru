export const RICH_REPORT_PREFIX = "koru-report-rich-v1:";

type ReportNodeType =
  | "doc" | "paragraph" | "heading" | "bulletList" | "orderedList"
  | "listItem" | "blockquote" | "text" | "hardBreak";
type ReportMarkType = "bold" | "italic" | "strike";

export type ReportRichNode = {
  type: ReportNodeType;
  text?: string;
  content?: ReportRichNode[];
  marks?: { type: ReportMarkType }[];
  attrs?: { level: 2 | 3 };
};

const containerTypes = new Set<ReportNodeType>([
  "doc", "paragraph", "heading", "bulletList", "orderedList", "listItem", "blockquote",
]);
const markTypes = new Set<ReportMarkType>(["bold", "italic", "strike"]);

function normalizeNode(value: unknown, depth: number, count: { value: number }): ReportRichNode | null {
  if (!value || typeof value !== "object" || depth > 12 || ++count.value > 500) return null;
  const node = value as Record<string, unknown>;
  const type = node.type;
  if (type === "text") {
    if (typeof node.text !== "string") return null;
    const marks = node.marks;
    if (marks !== undefined && !Array.isArray(marks)) return null;
    const normalizedMarks: { type: ReportMarkType }[] = [];
    for (const mark of (marks ?? []) as unknown[]) {
      if (!mark || typeof mark !== "object") return null;
      const markType = (mark as Record<string, unknown>).type;
      if (!markTypes.has(markType as ReportMarkType)) return null;
      normalizedMarks.push({ type: markType as ReportMarkType });
    }
    return { type, text: node.text, ...(normalizedMarks.length ? { marks: normalizedMarks } : {}) };
  }
  if (type === "hardBreak") return { type };
  if (!containerTypes.has(type as ReportNodeType)) return null;
  if (node.content !== undefined && !Array.isArray(node.content)) return null;
  const content: ReportRichNode[] = [];
  for (const child of (node.content ?? []) as unknown[]) {
    const normalized = normalizeNode(child, depth + 1, count);
    if (!normalized) return null;
    content.push(normalized);
  }
  if (type === "heading") {
    const level = (node.attrs as { level?: unknown } | undefined)?.level;
    if (level !== 2 && level !== 3) return null;
    return { type, attrs: { level }, content };
  }
  return { type: type as ReportNodeType, content };
}

function getPlainText(node: ReportRichNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  return (node.content ?? []).map(getPlainText).join(" ");
}

export function parseStudentReportRichText(body: string): ReportRichNode | null {
  if (!body.startsWith(RICH_REPORT_PREFIX)) return null;
  try {
    const node = normalizeNode(JSON.parse(body.slice(RICH_REPORT_PREFIX.length)), 0, { value: 0 });
    return node?.type === "doc" ? node : null;
  } catch {
    return null;
  }
}

export function normalizeStudentReportBody(body: string): string | null {
  if (!body.startsWith(RICH_REPORT_PREFIX)) {
    const plain = body.trim();
    return plain && plain.length <= 10000 ? plain : null;
  }
  const node = parseStudentReportRichText(body);
  if (!node || !getPlainText(node).trim()) return null;
  const normalized = RICH_REPORT_PREFIX + JSON.stringify(node);
  return normalized.length <= 10000 ? normalized : null;
}
