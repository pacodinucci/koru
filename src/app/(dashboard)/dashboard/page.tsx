import { redirect } from "next/navigation";

import type { PermissionKey } from "@/modules/auth/permissions/permission-catalog";
import { requireDashboardUser } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { TeacherHomeView } from "@/modules/teachers/views/teacher-home-view";

const destinations: Array<[PermissionKey, string]> = [
  ["content.view", "/dashboard/diseno"],
  ["blog.view", "/dashboard/blog"],
  ["calendar.view", "/dashboard/calendar"],
  ["cash-fund.view", "/dashboard/caja-chica"],
  ["inventory.view", "/dashboard/inventario"],
  ["documents.view", "/dashboard/documentos"],
  ["families.view", "/dashboard/families"],
  ["students.view", "/dashboard/students"],
  ["exams.view", "/dashboard/exams"],
  ["users.view", "/dashboard/users"],
  ["roles.view", "/dashboard/roles"],
];

export default async function DashboardPage() {
  const user = await requireDashboardUser();
  if (user.role === "SUPERADMIN") {
    redirect("/dashboard/administracion");
  }
  if (user.role === "TEACHER" || user.role === "ADMIN_TEACHER") {
    const cmsPages = (await discoverPagesGroupRoutes()).filter((page) => !page.isDynamic);
    return (
      <DashboardShell userEmail={user.email} userRole={user.role} userPermissions={user.permissionKeys} cmsPages={cmsPages} breadcrumbPage="Inicio">
        <TeacherHomeView user={user} />
      </DashboardShell>
    );
  }
  const destination = destinations.find(([permission]) =>
    user.permissionKeys.includes(permission),
  );
  redirect(destination?.[1] ?? "/?error=dashboard_without_sections");
}
