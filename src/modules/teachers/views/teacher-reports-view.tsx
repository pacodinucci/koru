import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CreateStudentReportDialog } from "@/modules/teachers/components/create-student-report-dialog";
import { TeacherReportsTable } from "@/modules/teachers/components/teacher-reports-table";
import { listTeacherOwnedReports } from "@/modules/teachers/server/student-reports.repository";
import { listTeacherHomeData } from "@/modules/teachers/server/teachers.repository";

export async function TeacherReportsView({ userId }: { userId: string }) {
  const [reports, { students }] = await Promise.all([
    listTeacherOwnedReports(userId),
    listTeacherHomeData(userId),
  ]);

  return (
    <div className="space-y-5 [font-family:var(--font-montserrat)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Reportes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tus reportes por alumno. Sólo los que compartís son visibles para su familia.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button nativeButton={false} render={<Link href="/dashboard/acuerdos-seguimiento" />} variant="outline">
            Ir a Acuerdos de seguimiento
          </Button>
          <CreateStudentReportDialog students={students} />
        </div>
      </div>
      <TeacherReportsTable
        reports={reports.map((report) => ({ ...report, createdAt: report.createdAt.toISOString() }))}
        students={students}
      />
    </div>
  );
}
