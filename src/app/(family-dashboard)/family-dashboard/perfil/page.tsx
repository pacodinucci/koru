import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { FamilyDashboardHeader } from "@/modules/family-dashboard/components/family-dashboard-header";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";
import { requireFamilyDashboardAccess } from "@/modules/family-dashboard/server/family-dashboard-access";
import { getFamilyProfile } from "@/modules/family-dashboard/server/family-profile.repository";
import { FamilyProfileForm } from "@/modules/family-dashboard/views/family-profile-form";

export default async function FamilyProfilePage() {
  const { viewer, familyUser } = await requireFamilyDashboardAccess();
  const profile = await getFamilyProfile(familyUser.id);

  return <SidebarProvider><FamilySidebar userName={viewer.name} userEmail={viewer.email} /><SidebarInset><FamilyDashboardHeader title="Tu perfil" /><main className="p-4 sm:p-6"><FamilyProfileForm initialProfile={{ streetAndNumber: profile?.streetAndNumber ?? "", neighborhood: profile?.neighborhood ?? "", cityAndState: profile?.cityAndState ?? "", postalCode: profile?.postalCode ?? "" }} /></main></SidebarInset></SidebarProvider>;
}
