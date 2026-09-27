import type { ReactNode } from "react";

import {
  parseStudentReportRichText,
  RICH_REPORT_PREFIX,
  type ReportRichNode,
} from "@/modules/teachers/lib/student-report-rich-text";

function renderNode(node: ReportRichNode, key: number): ReactNode {
  if (node.type === "text") {
    let content: ReactNode = node.text ?? "";
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") content = <strong>{content}</strong>;
      if (mark.type === "italic") content = <em>{content}</em>;
      if (mark.type === "strike") content = <s>{content}</s>;
    }
    return <span key={key}>{content}</span>;
  }
  if (node.type === "hardBreak") return <br key={key} />;

  const children = node.content?.map(renderNode);
  switch (node.type) {
    case "doc": return <div key={key} className="mt-3 space-y-2 text-sm text-slate-800">{children}</div>;
    case "paragraph": return <p key={key}>{children}</p>;
    case "heading": return node.attrs?.level === 2
      ? <h2 key={key} className="text-base font-semibold">{children}</h2>
      : <h3 key={key} className="font-semibold">{children}</h3>;
    case "bulletList": return <ul key={key} className="list-disc space-y-1 pl-6">{children}</ul>;
    case "orderedList": return <ol key={key} className="list-decimal space-y-1 pl-6">{children}</ol>;
    case "listItem": return <li key={key}>{children}</li>;
    case "blockquote": return <blockquote key={key} className="border-l-2 pl-3 italic">{children}</blockquote>;
  }
}

export function StudentReportBody({ body }: { body: string | null }) {
  if (!body) return null;
  if (!body.startsWith(RICH_REPORT_PREFIX)) {
    return <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{body}</p>;
  }
  const document = parseStudentReportRichText(body);
  return document ? renderNode(document, 0) : <p className="mt-3 text-sm text-muted-foreground">No pudimos mostrar este reporte.</p>;
}
