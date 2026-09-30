import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { prisma } from "@/lib/prisma";
import { FamilyDashboardHeader } from "@/modules/family-dashboard/components/family-dashboard-header";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";
import { readQuestionnaireAnswers } from "@/modules/family-dashboard/lib/admission-questionnaire";
import { requireFamilyDashboardAccess } from "@/modules/family-dashboard/server/family-dashboard-access";
import { AdmissionQuestionnaireForm } from "@/modules/family-dashboard/views/admission-questionnaire-form";

export default async function FamilyAdmissionQuestionnaireStudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { viewer, familyUser } = await requireFamilyDashboardAccess();
  const { studentId } = await params;
  const student = familyUser.familyId ? await prisma.student.findFirst({
    where: { id: studentId, familyId: familyUser.familyId },
    select: {
      id: true, firstName: true, lastName: true, birthDate: true,
      address: { select: { streetAndNumber: true, neighborhood: true, cityAndState: true } },
      guardians: { select: { fullName: true, email: true, phone: true }, orderBy: [{ isPrimary: "desc" }] },
      admissionQuestionnaire: { select: { answers: true, submittedAt: true } },
    },
  }) : null;
  if (!student) notFound();

  return <SidebarProvider>
    <FamilySidebar userName={viewer.name} userEmail={viewer.email} />
    <SidebarInset>
      <FamilyDashboardHeader title="Cuestionario de ingreso" />
      <main className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6">
        <Button nativeButton={false} render={<Link href="/family-dashboard/cuestionario-ingreso" />} variant="ghost" size="sm">Volver a mis hijos/as</Button>
        <h1 className="text-xl font-semibold">{student.firstName} {student.lastName}</h1>
        <Card>
          <CardHeader><CardTitle>Información general</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">Estos datos provienen del expediente. Si necesitás corregirlos, hacelo allí.</p>
            <p><strong>Nombre completo:</strong> {student.firstName} {student.lastName}</p>
            <p><strong>Fecha de nacimiento:</strong> {student.birthDate.toLocaleDateString("es-AR")}</p>
            <p><strong>Dirección:</strong> {[student.address?.streetAndNumber, student.address?.neighborhood, student.address?.cityAndState].filter(Boolean).join(", ") || "No informada"}</p>
            <p><strong>Teléfono de contacto:</strong> {student.guardians[0]?.phone || "No informado"}</p>
            <p><strong>Correos de madre, padre o tutores:</strong> {student.guardians.map((guardian) => guardian.email).join(", ") || "No informados"}</p>
            <p><strong>Nombre de madre, padre o tutores:</strong> {student.guardians.map((guardian) => guardian.fullName).filter(Boolean).join(", ") || "No informado"}</p>
          </CardContent>
        </Card>
        <AdmissionQuestionnaireForm studentId={student.id} initialAnswers={readQuestionnaireAnswers(student.admissionQuestionnaire?.answers)} submittedAt={student.admissionQuestionnaire?.submittedAt?.toISOString() ?? null} />
      </main>
    </SidebarInset>
  </SidebarProvider>;
}
