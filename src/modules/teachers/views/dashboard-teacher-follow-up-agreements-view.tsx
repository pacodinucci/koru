import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TeacherFollowUpAgreementsClient, type TeacherFollowUpAgreementRow } from "@/modules/follow-up-agreements/components/teacher-follow-up-agreements-client";
import { listTeacherFollowUpAgreements } from "@/modules/follow-up-agreements/server/teacher-follow-up-agreements.repository";

export async function DashboardTeacherFollowUpAgreementsView({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
  let agreements: TeacherFollowUpAgreementRow[] | null = null;
  try {
    // The repository already returns serialized, public rows (no storage URLs/ids).
    agreements = await listTeacherFollowUpAgreements(teacherId);
  } catch {
    // Keep repository/storage details on the server.
  }

  return (
    <div className="space-y-5 [font-family:var(--font-montserrat)]">
      <Button nativeButton={false} variant="ghost" size="sm" render={<Link href="/dashboard/teachers" />}>
        <ArrowLeft className="size-4" />Volver a docentes
      </Button>
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Acuerdos de seguimiento de {teacherName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Solo superadmin puede gestionar estos acuerdos. El docente accede únicamente a sus acuerdos publicados y puede dar su conformidad.</p>
      </div>
      {agreements === null ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>No pudimos cargar los acuerdos. Intentá de nuevo.</p>
          <Link href={`/dashboard/teachers/${encodeURIComponent(teacherId)}/follow-up-agreements`} className="mt-2 inline-block underline">Reintentar</Link>
        </div>
      ) : <TeacherFollowUpAgreementsClient agreements={agreements} mode="admin" teacherId={teacherId} />}
    </div>
  );
}
