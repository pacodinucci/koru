import { notFound } from "next/navigation";

import { requireRole } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { TeacherAgreementForm } from "@/modules/follow-up-agreements/components/teacher-agreement-form";
import { getTeacherAgreementScope, getTeacherDraftAgreement } from "@/modules/follow-up-agreements/server/agreements.repository";

export default async function EditFollowUpAgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["TEACHER", "ADMIN_TEACHER"]);
  const [{ id }, pages, scope] = await Promise.all([params, discoverPagesGroupRoutes(), getTeacherAgreementScope(user.id)]);
  if (!scope) notFound();
  const agreement = await getTeacherDraftAgreement(scope.teacherId, id);
  if (!agreement) notFound();

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={pages.filter((page) => !page.isDynamic)}
      breadcrumbPage="Editar borrador"
    >
      <TeacherAgreementForm
        students={scope.students}
        draft={{
          id: agreement.id,
          title: agreement.title,
          body: agreement.body,
          attachmentFileName: agreement.attachmentFileName,
          studentIds: agreement.students.map((item) => item.studentId),
        }}
      />
    </DashboardShell>
  );
}
