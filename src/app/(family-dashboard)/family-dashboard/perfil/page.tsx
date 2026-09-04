import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireRole } from "@/modules/auth/server/auth-guards";
import { FamilyDashboardHeader } from "@/modules/family-dashboard/components/family-dashboard-header";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";
import { getFamilyProfile } from "@/modules/family-dashboard/server/family-profile.repository";
import { FamilyProfileForm } from "@/modules/family-dashboard/views/family-profile-form";

export default async function FamilyProfilePage() {
  const user = await requireRole(["PARENT"], "/family-dashboard?error=forbidden");
  const profile = await getFamilyProfile(user.id);

  return (
    <SidebarProvider>
      <FamilySidebar userName={user.name} userEmail={user.email} />
      <SidebarInset>
        <FamilyDashboardHeader title="Tu perfil" />
        <main className="p-4 sm:p-6">
          <FamilyProfileForm initialProfile={{
            streetAndNumber: profile?.streetAndNumber ?? "",
            neighborhood: profile?.neighborhood ?? "",
            cityAndState: profile?.cityAndState ?? "",
            postalCode: profile?.postalCode ?? "",
          }} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}