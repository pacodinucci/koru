import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireRole } from "@/modules/auth/server/auth-guards";
import { FamilyDashboardHeader } from "@/modules/family-dashboard/components/family-dashboard-header";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";
import { getFamilyAccountForUser } from "@/modules/family-dashboard/server/family-account.repository";
import { FamilyAccountView } from "@/modules/family-dashboard/views/family-account-view";

export default async function FamilyAccountPage() {
  const user = await requireRole(["PARENT"], "/dashboard?error=forbidden");
  const account = await getFamilyAccountForUser(user.id);

  return <SidebarProvider><FamilySidebar userName={user.name} userEmail={user.email}/><SidebarInset><FamilyDashboardHeader title="Mi cuenta"/><main className="p-4 sm:p-6"><FamilyAccountView account={account}/></main></SidebarInset></SidebarProvider>;
}