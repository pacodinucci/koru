import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { prisma } from "@/lib/prisma";
import { FamilyDashboardHeader } from "@/modules/family-dashboard/components/family-dashboard-header";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";
import { requireFamilyDashboardAccess } from "@/modules/family-dashboard/server/family-dashboard-access";

export default async function FamilyAdmissionQuestionnairePage() {
  const { viewer, familyUser } = await requireFamilyDashboardAccess();
  const students = familyUser.familyId ? await prisma.student.findMany({
    where: { familyId: familyUser.familyId },
    orderBy: [{ createdAt: "asc" }],
    select: { id: true, firstName: true, lastName: true, admissionQuestionnaire: { select: { submittedAt: true, updatedAt: true } } },
  }) : [];

  return (
    <SidebarProvider>
      <FamilySidebar userName={viewer.name} userEmail={viewer.email} />
      <SidebarInset>
        <FamilyDashboardHeader title="Cuestionario de ingreso" />
        <main className="space-y-4 p-4 sm:p-6">
          <p className="text-sm text-muted-foreground">Un cuestionario por cada niño/a, separado de su expediente.</p>
          {students.length === 0 ? <Card><CardContent className="p-6 text-sm text-muted-foreground">Primero registrá a tu hijo/a desde Inicio.</CardContent></Card> : students.map((student) => {
            const status = student.admissionQuestionnaire?.submittedAt ? "Completado" : student.admissionQuestionnaire ? "En progreso" : "Pendiente";
            return <Card key={student.id}>
              <CardHeader className="flex-row items-center justify-between gap-3"><CardTitle>{student.firstName} {student.lastName}</CardTitle><Badge variant="secondary">{status}</Badge></CardHeader>
              <CardContent><Button nativeButton={false} render={<Link href={`/family-dashboard/cuestionario-ingreso/${student.id}`} />} size="sm">{status === "Pendiente" ? "Comenzar" : "Ver cuestionario"}</Button></CardContent>
            </Card>;
          })}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
