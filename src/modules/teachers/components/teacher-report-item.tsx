import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { StudentReportBody } from "@/modules/teachers/components/student-report-body";

export type TeacherReport = {
  id: string;
  type: "TEXT" | "PDF" | "DOC" | "DOCX";
  title: string;
  body: string | null;
  fileName: string | null;
  visibleToFamily: boolean;
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
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{report.type === "TEXT" ? "Texto" : report.type}</Badge>
          <Badge variant="secondary">{report.visibleToFamily ? "Visible para la familia" : "Solo docentes"}</Badge>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{report.teacher.displayName} · {new Date(report.createdAt).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</p>
      {report.type === "TEXT" ? (
        <StudentReportBody body={report.body} />
      ) : (
        <a className="mt-3 inline-flex items-center gap-1 text-sm text-primary underline" href={`/api/student-reports/${report.id}/download`} target="_blank" rel="noopener noreferrer">
          <FileText className="size-4" /> Abrir {report.fileName || report.type}
        </a>
      )}
    </li>
  );
}
