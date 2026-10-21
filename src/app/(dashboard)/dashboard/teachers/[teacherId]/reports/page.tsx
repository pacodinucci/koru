import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardTeacherReportsView } from "@/modules/teachers/views/dashboard-teacher-reports-view";

export const maxDuration = 60;

export default async function DashboardTeacherReportsPage({ params }: { params: Promise<{ teacherId: string }> }) {
  const user = await requireRole(["SUPERADMIN"]);
  const { teacherId } = await params;
  const teacher = await prisma.teacherProfile.findUnique({
    where: { id: teacherId },
    select: { id: true, displayName: true },
  });
  if (!teacher) notFound();

  const cmsPages = (await discoverPagesGroupRoutes()).filter((page) => !page.isDynamic);
  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={cmsPages}
      breadcrumbPage="Reportes del docente"
    >
      <DashboardTeacherReportsView teacherId={teacher.id} teacherName={teacher.displayName} />
    </DashboardShell>
  );
}
