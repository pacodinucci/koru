import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { FamilyDashboardHeader } from "@/modules/family-dashboard/components/family-dashboard-header";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";
import { requireFamilyDashboardAccess } from "@/modules/family-dashboard/server/family-dashboard-access";
import { listFamilyStudentRecords } from "@/modules/family-dashboard/server/family-student-record.repository";
import { FamilyStudentMedicalSection, FamilyStudentPersonalSection } from "@/modules/family-dashboard/views/family-student-editable-sections";
import { listStudentGroups } from "@/modules/students/server/students.repository";

const statusLabels = {
  DRAFT: "En progreso",
  SUBMITTED: "Pendiente de revisión",
  REVIEWED: "Revisada",
  NEEDS_CHANGES: "Requiere cambios",
} as const;

function Value({ label, value }: { label: string; value?: string | null }) {
  return <div><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 text-sm">{value || "No informado"}</dd></div>;
}

export default async function FamilyStudentRecordPage() {
  const { viewer, familyUser } = await requireFamilyDashboardAccess();
  const [students, groups] = await Promise.all([
    familyUser.familyId ? listFamilyStudentRecords(familyUser.familyId) : Promise.resolve([]),
    listStudentGroups(),
  ]);

  return (
    <SidebarProvider>
      <FamilySidebar userName={viewer.name} userEmail={viewer.email} />
      <SidebarInset>
        <FamilyDashboardHeader title="Expedientes" />
        <main className="space-y-4 p-4 sm:p-6">
          {students.length === 0 ? (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">Primero registrá a tu hijo/a desde Inicio.</CardContent></Card>
          ) : students.map((student) => {
            const guardian = student.guardians[0];
            return (
              <Card key={student.id}>
                <CardHeader className="flex-row items-center justify-between gap-3">
                  <CardTitle>{student.firstName} {student.lastName}</CardTitle>
                  <Badge variant="secondary">{statusLabels[student.recordStatus]}</Badge>
                </CardHeader>
                <CardContent className="space-y-5">
                  <section>
                    <FamilyStudentPersonalSection
                      details={{
                        studentId: student.id,
                        documentType: student.documentType,
                        documentNumber: student.documentNumber,
                        birthDate: student.birthDate.toISOString(),
                        groupId: student.groupId,
                        groupName: student.group.name,
                        primaryGuardianName: guardian?.fullName ?? null,
                      }}
                      groups={groups.map((group) => ({ id: group.id, name: group.name }))}
                    />
                  </section>
                  <Separator />
                  <section>
                    <h2 className="mb-3 font-semibold">Domicilio</h2>
                    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Value label="Calle y número" value={student.family?.streetAndNumber} />
                      <Value label="Barrio / localidad" value={student.family?.neighborhood} />
                      <Value label="Ciudad y provincia" value={student.family?.cityAndState} />
                      <Value label="Código postal" value={student.family?.postalCode} />
                    </dl>
                  </section>
                  <Separator />
                  <section>
                    <FamilyStudentMedicalSection details={{
                      studentId: student.id,
                      bloodType: student.medicalProfile?.bloodType ?? null,
                      knownAllergies: student.medicalProfile?.knownAllergies ?? null,
                      medicalConditions: student.medicalProfile?.medicalConditions ?? null,
                      regularMedications: student.medicalProfile?.regularMedications ?? null,
                      hasHealthInsurance: student.medicalProfile?.hasHealthInsurance ?? false,
                      insuranceProviderAndPolicy: student.medicalProfile?.insuranceProviderAndPolicy ?? null,
                    }} />
                  </section>
                  <Separator />
                  <section>
                    <h2 className="mb-3 font-semibold">Contactos</h2>
                    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Value label="Contacto principal" value={guardian?.fullName} />
                      <Value label="Teléfono principal" value={guardian?.phone} />
                      <Value label="Contacto secundario" value={student.responsibles[0]?.fullName} />
                      <Value label="Parentesco" value={student.responsibles[0]?.relationship} />
                      <Value label="Teléfono secundario" value={student.responsibles[0]?.phone} />
                    </dl>
                  </section>
                </CardContent>
              </Card>
            );
          })}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
