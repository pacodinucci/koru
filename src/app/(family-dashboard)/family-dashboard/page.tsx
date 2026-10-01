import Link from "next/link";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { FamilyDashboardHeader } from "@/modules/family-dashboard/components/family-dashboard-header";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";
import { requireFamilyDashboardAccess } from "@/modules/family-dashboard/server/family-dashboard-access";
import { getFamilyProfile } from "@/modules/family-dashboard/server/family-profile.repository";
import { listFamilyStudentRecords } from "@/modules/family-dashboard/server/family-student-record.repository";
import { FamilyResponsiblesPanel } from "@/modules/family-dashboard/views/family-responsibles-panel";
import { FamilyStudentOnboarding } from "@/modules/family-dashboard/views/family-student-onboarding";
import { FamilyUpcomingEvents } from "@/modules/family-dashboard/views/family-upcoming-events";
import { listUpcomingVisibleEventsForUser } from "@/modules/dashboard/server/calendar.repository";
import { buildFamilyResponsibles } from "@/modules/families/lib/family-responsibles";
import { listStudentGroups } from "@/modules/students/server/students.repository";

export default async function FamilyDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const { viewer, familyUser } = await requireFamilyDashboardAccess();
  const [students, upcomingEvents, groups, familyProfile, family, familyUsers] = await Promise.all([
    familyUser.familyId ? listFamilyStudentRecords(familyUser.familyId) : Promise.resolve([]),
    listUpcomingVisibleEventsForUser(familyUser.id, familyUser.role),
    listStudentGroups(),
    getFamilyProfile(familyUser.id),
    familyUser.familyId ? prisma.family.findUnique({ where: { id: familyUser.familyId }, select: { name: true } }) : null,
    familyUser.familyId ? prisma.user.findMany({ where: { familyId: familyUser.familyId }, select: { id: true, name: true, email: true }, orderBy: { createdAt: "asc" } }) : Promise.resolve([]),
  ]);

  const studentItems = students.map((student) => ({
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    documentType: student.documentType,
    documentNumber: student.documentNumber,
    birthDate: student.birthDate.toISOString(),
    groupId: student.groupId,
    recordStatus: student.recordStatus,
    recordStep: student.recordStep,
    updatedAt: student.updatedAt.toISOString(),
    group: student.group,
    address: student.address,
    medicalProfile: student.medicalProfile,
    guardians: student.guardians.map((guardian) => ({
      userId: guardian.userId,
      fullName: guardian.fullName,
      phone: guardian.phone,
      relationship: guardian.relationship,
    })),
    responsibles: student.responsibles,
  }));

  const responsibleItems = buildFamilyResponsibles(familyUsers, students, familyUser.id);

  const dashboardContent = (
    <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
      <FamilyUpcomingEvents events={upcomingEvents} />
      <FamilyResponsiblesPanel
        students={students.map((student) => ({
          id: student.id,
          fullName: `${student.firstName} ${student.lastName}`,
        }))}
        responsibles={responsibleItems}
      />
    </div>
  );

  return (
    <SidebarProvider>
      <FamilySidebar userName={viewer.name} userEmail={viewer.email} />
      <SidebarInset>
        <FamilyDashboardHeader title="Inicio" />
        <main className="space-y-6 p-4 sm:p-6">
          {students.length === 0 ? (
            <Card className="mx-auto max-w-xl text-center">
              <CardHeader>
                <CardTitle>Empecemos por registrar a tu hijo/a</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Completá la carpeta integral para que podamos acompañar su recorrido en Koru.
                </p>
                <Button nativeButton={false} render={<Link href="/family-dashboard/registro-alumno" />}>
                  Registrar a mi hijo/a
                </Button>
              </CardContent>
            </Card>
          ) : (
            <FamilyStudentOnboarding
              key={view === "dashboard" ? "dashboard" : "onboarding"}
              userName={viewer.name} familyLastName={family?.name ?? ""}
              groups={groups.map((group) => ({
                id: group.id,
                name: group.name,
                ageRange: group.ageRange,
              }))}
              students={studentItems}
              dashboardContent={dashboardContent}
              familyAddress={familyProfile ? {
                streetAndNumber: familyProfile.streetAndNumber,
                neighborhood: familyProfile.neighborhood,
                cityAndState: familyProfile.cityAndState,
                postalCode: familyProfile.postalCode,
              } : undefined}
              startOnDashboard={view === "dashboard"}
            />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
