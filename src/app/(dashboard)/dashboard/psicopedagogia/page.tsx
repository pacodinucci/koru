import { requireRole } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { PsychopedagogyView } from "@/modules/psychopedagogy/views/psychopedagogy-view";

export default async function PsychopedagogyPage() {
  const user = await requireRole(["PSYCHOPEDAGOGY_TEACHER", "SUPERADMIN"]);
  const cmsPages = (await discoverPagesGroupRoutes()).filter((page) => !page.isDynamic);
  return (
    <DashboardShell userEmail={user.email} userRole={user.role} userPermissions={user.permissionKeys}
      cmsPages={cmsPages} breadcrumbPage="Psicopedagogía">
      <PsychopedagogyView userId={user.id} readOnly={user.role === "SUPERADMIN"} />
    </DashboardShell>
  );
}
