import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export type TeacherReport = {
  id: string;
  type: "TEXT" | "PDF";
  title: string;
  body: string | null;
  fileName: string | null;
  createdAt: string;
  teacher: { displayName: string };
};

export function TeacherReportItem({ report, student }: {
  report: TeacherReport;
  student?: { firstName: string; lastName: string; group: { name: string } };
}) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-medium text-slate-900">{report.title}</h3>
          {student ? <p className="mt-1 text-sm text-slate-600">{student.lastName}, {student.firstName} · {student.group.name}</p> : null}
        </div>
        <Badge variant="outline">{report.type === "PDF" ? "PDF" : "Texto"}</Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{report.teacher.displayName} · {new Date(report.createdAt).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</p>
      {report.type === "TEXT" ? (
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{report.body}</p>
      ) : (
        <a className="mt-3 inline-flex items-center gap-1 text-sm text-primary underline" href={`/api/student-reports/${report.id}/download`} target="_blank" rel="noopener noreferrer">
          <FileText className="size-4" /> Abrir {report.fileName || "PDF"}
        </a>
      )}
    </li>
  );
}
