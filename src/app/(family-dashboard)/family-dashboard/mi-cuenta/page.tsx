import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { FamilyDashboardHeader } from "@/modules/family-dashboard/components/family-dashboard-header";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";
import { getFamilyAccountForUser } from "@/modules/family-dashboard/server/family-account.repository";
import { requireFamilyDashboardAccess } from "@/modules/family-dashboard/server/family-dashboard-access";
import { FamilyAccountView } from "@/modules/family-dashboard/views/family-account-view";

export default async function FamilyAccountPage() {
  const { viewer, familyUser } = await requireFamilyDashboardAccess();
  const account = await getFamilyAccountForUser(familyUser.id);

  return <SidebarProvider><FamilySidebar userName={viewer.name} userEmail={viewer.email}/><SidebarInset><FamilyDashboardHeader title="Mi cuenta"/><main className="p-4 sm:p-6"><FamilyAccountView account={account}/></main></SidebarInset></SidebarProvider>;
}
