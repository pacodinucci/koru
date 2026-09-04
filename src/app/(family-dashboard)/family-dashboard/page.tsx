import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireRole } from "@/modules/auth/server/auth-guards";
import { FamilyDashboardHeader } from "@/modules/family-dashboard/components/family-dashboard-header";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";
import { getFamilyProfile } from "@/modules/family-dashboard/server/family-profile.repository";
import { listFamilyStudentRecords } from "@/modules/family-dashboard/server/family-student-record.repository";
import { FamilyResponsiblesPanel } from "@/modules/family-dashboard/views/family-responsibles-panel";
import { FamilyStudentOnboarding } from "@/modules/family-dashboard/views/family-student-onboarding";
import { FamilyUpcomingEvents } from "@/modules/family-dashboard/views/family-upcoming-events";
import { listUpcomingVisibleEventsForUser } from "@/modules/dashboard/server/calendar.repository";
import { listStudentGroups } from "@/modules/students/server/students.repository";

export default async function FamilyDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const user = await requireRole(["PARENT"], "/dashboard?error=forbidden");
  const [students, upcomingEvents, groups, familyProfile] = await Promise.all([
    user.familyId ? listFamilyStudentRecords(user.familyId) : Promise.resolve([]),
    listUpcomingVisibleEventsForUser(user.id, user.role),
    listStudentGroups(),
    getFamilyProfile(user.id),
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

  const guardianResponsibles = new Map<string, {
    id: string;
    studentNames: string[];
    fullName: string;
    relationship: string;
    phone: string;
    canPickup: boolean;
    emergencyContact: boolean;
    hasUser: boolean;
    isCurrentUser: boolean;
  }>();

  for (const student of students) {
    const studentName = [student.firstName, student.lastName].join(" ");
    for (const guardian of student.guardians) {
      const key = guardian.userId ?? guardian.email;
      const existing = guardianResponsibles.get(key);
      if (existing) {
        existing.studentNames.push(studentName);
        existing.canPickup ||= guardian.canPickup;
        existing.emergencyContact ||= guardian.emergencyContact;
        continue;
      }

      guardianResponsibles.set(key, {
        id: "guardian-" + guardian.id,
        studentNames: [studentName],
        fullName: guardian.fullName ?? guardian.email,
        relationship: guardian.relationship,
        phone: guardian.phone ?? "Sin teléfono",
        canPickup: guardian.canPickup,
        emergencyContact: guardian.emergencyContact,
        hasUser: Boolean(guardian.userId),
        isCurrentUser: guardian.userId === user.id,
      });
    }
  }

  const responsibleItems = [
    ...guardianResponsibles.values(),
    ...students.flatMap((student) => student.responsibles.map((responsible) => ({
      id: responsible.id,
      studentNames: [[student.firstName, student.lastName].join(" ")],
      fullName: responsible.fullName,
      relationship: responsible.relationship,
      phone: responsible.phone,
      canPickup: responsible.canPickup,
      emergencyContact: responsible.emergencyContact,
      hasUser: false,
      isCurrentUser: false,
    }))),
  ];

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
      <FamilySidebar userName={user.name} userEmail={user.email} />
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
              userName={user.name} familyLastName=""
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