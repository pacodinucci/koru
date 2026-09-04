import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/auth/server/auth-guards";
import { FamilyDashboardHeader } from "@/modules/family-dashboard/components/family-dashboard-header";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";
import { listFamilyStudentRecords } from "@/modules/family-dashboard/server/family-student-record.repository";
import { FamilyStudentOnboarding } from "@/modules/family-dashboard/views/family-student-onboarding";
import { listStudentGroups } from "@/modules/students/server/students.repository";

export default async function FamilyStudentRegistrationPage() {
  const user = await requireRole(["PARENT"], "/dashboard?error=forbidden");
  const [students, groups, family, invitation] = await Promise.all([
    listFamilyStudentRecords(user.id),
    listStudentGroups(),
    user.familyId ? prisma.family.findUnique({ where: { id: user.familyId }, select: { name: true } }) : null,
    prisma.userInvitation.findUnique({ where: { email: user.email }, select: { family: { select: { name: true } } } }),
  ]);
  return <SidebarProvider><FamilySidebar userName={user.name} userEmail={user.email} /><SidebarInset><FamilyDashboardHeader title="Registro de alumno" /><main className="p-4 sm:p-6"><FamilyStudentOnboarding userName={user.name} familyLastName={family?.name ?? invitation?.family?.name ?? ""} groups={groups.map((group) => ({ id: group.id, name: group.name, ageRange: group.ageRange }))} students={students.map((student) => ({ ...student, birthDate: student.birthDate.toISOString(), updatedAt: student.updatedAt.toISOString(), guardians: student.guardians.map((guardian) => ({ fullName: guardian.fullName, phone: guardian.phone, relationship: guardian.relationship })) }))} /></main></SidebarInset></SidebarProvider>;
}