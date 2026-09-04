import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireRole } from "@/modules/auth/server/auth-guards";
import { FamilyDashboardHeader } from "@/modules/family-dashboard/components/family-dashboard-header";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";
import { listFamilyStudentRecords } from "@/modules/family-dashboard/server/family-student-record.repository";

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
  const user = await requireRole(["PARENT"], "/dashboard?error=forbidden");
  const students = await listFamilyStudentRecords(user.id);

  return (
    <SidebarProvider>
      <FamilySidebar userName={user.name} userEmail={user.email} />
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
                    <h2 className="mb-3 font-semibold">Datos personales</h2>
                    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Value label="Documento" value={[student.documentType, student.documentNumber].filter(Boolean).join(" ")} />
                      <Value label="Fecha de nacimiento" value={student.birthDate.toLocaleDateString("es-AR")} />
                      <Value label="Grupo" value={student.group.name} />
                      <Value label="Responsable principal" value={guardian?.fullName} />
                    </dl>
                  </section>
                  <Separator />
                  <section>
                    <h2 className="mb-3 font-semibold">Domicilio</h2>
                    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Value label="Calle y número" value={student.address?.streetAndNumber} />
                      <Value label="Barrio / localidad" value={student.address?.neighborhood} />
                      <Value label="Ciudad y provincia" value={student.address?.cityAndState} />
                      <Value label="Código postal" value={student.address?.postalCode} />
                    </dl>
                  </section>
                  <Separator />
                  <section>
                    <h2 className="mb-3 font-semibold">Salud</h2>
                    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Value label="Sangre y Rh" value={student.medicalProfile?.bloodType} />
                      <Value label="Alergias" value={student.medicalProfile?.knownAllergies} />
                      <Value label="Condiciones médicas" value={student.medicalProfile?.medicalConditions} />
                      <Value label="Medicación" value={student.medicalProfile?.regularMedications} />
                      <Value label="Cobertura" value={student.medicalProfile?.hasHealthInsurance ? "Sí" : "No"} />
                      <Value label="Institución / afiliación" value={student.medicalProfile?.insuranceProviderAndPolicy} />
                    </dl>
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