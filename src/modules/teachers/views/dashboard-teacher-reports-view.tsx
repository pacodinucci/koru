import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { CreateTeacherReportDialog } from "@/modules/teachers/components/create-teacher-report-dialog";
import {
  TeacherProfileReportsTable,
  type TeacherProfileReportRow,
} from "@/modules/teachers/components/teacher-profile-reports-table";
import { listTeacherReports } from "@/modules/teachers/server/teacher-reports.repository";

export async function DashboardTeacherReportsView({
  teacherId,
  teacherName,
}: {
  teacherId: string;
  teacherName: string;
}) {
  let rows: TeacherProfileReportRow[] | null = null;
  try {
    const reports = await listTeacherReports(teacherId);
    // Private storage URLs and unselected repository fields must stay on the server.
    rows = reports.map((report) => ({
      id: report.id,
      title: report.title,
      content: report.content,
      fileName: report.fileName,
      fileMimeType: report.fileMimeType,
      hasFile: Boolean(report.fileUrl),
      createdAt: report.createdAt.toISOString(),
      visibleToTeacher: report.visibleToTeacher,
      authorName: report.author.name,
    }));
  } catch {
    // Do not expose repository/storage errors to the browser.
  }

  return (
    <div className="space-y-5 [font-family:var(--font-montserrat)]">
      <Button
        nativeButton={false}
        render={<Link href="/dashboard/teachers" />}
        variant="ghost"
        size="sm"
      >
        <ArrowLeft aria-hidden={true} /> Volver a docentes
      </Button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Reportes de {teacherName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Solo superadmin puede cargar y consultar estos reportes. La
            visibilidad para el docente se guarda para una habilitación futura;
            no le da acceso por ahora.
          </p>
        </div>
        <CreateTeacherReportDialog teacherId={teacherId} />
      </div>
      {rows === null ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p>No pudimos cargar los reportes. Intentá de nuevo.</p>
          <Link
            href={`/dashboard/teachers/${encodeURIComponent(teacherId)}/reports`}
            className="mt-2 inline-block underline"
          >
            Reintentar
          </Link>
        </div>
      ) : (
        <TeacherProfileReportsTable reports={rows} teacherName={teacherName} />
      )}
    </div>
  );
}
