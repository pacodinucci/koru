import { requirePermission } from "@/modules/auth/server/auth-guards";
import { CalendarAreasAdminView } from "@/modules/calendar/views/calendar-areas-admin-view";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";

export default async function CalendarPermissionsPage() {
  const user = await requirePermission("calendar.permissions.manage");

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      breadcrumbPage="Permisos del calendario"
    >
      <CalendarAreasAdminView />
    </DashboardShell>
  );
}
