import { CreateStudentReportDialog } from "@/modules/teachers/components/create-student-report-dialog";
import { TeacherReportItem } from "@/modules/teachers/components/teacher-report-item";
import { listAssignedTeacherReports } from "@/modules/teachers/server/student-reports.repository";
import { listTeacherHomeData } from "@/modules/teachers/server/teachers.repository";

export async function TeacherReportsView({ userId }: { userId: string }) {
  const [reports, { students }] = await Promise.all([
    listAssignedTeacherReports(userId),
    listTeacherHomeData(userId),
  ]);

  return (
    <div className="space-y-5 [font-family:var(--font-montserrat)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Reportes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Reportes de los alumnos de tus cursos.</p>
        </div>
        <CreateStudentReportDialog students={students} />
      </div>
      {reports.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground">
          {students.length === 0 ? "Todavía no tenés alumnos asignados." : "Todavía no hay reportes cargados."}
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <TeacherReportItem
              key={report.id}
              report={{ ...report, createdAt: report.createdAt.toISOString() }}
              student={report.student}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
