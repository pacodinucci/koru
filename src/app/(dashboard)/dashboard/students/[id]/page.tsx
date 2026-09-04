import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { updateStudentRecordStatusAction } from "@/modules/students/server/student.actions";
import { getStudentRecordForAdmin } from "@/modules/students/server/students.repository";

const statusLabels = {
  DRAFT: "En progreso",
  SUBMITTED: "Pendiente de revisión",
  REVIEWED: "Revisada",
  NEEDS_CHANGES: "Requiere cambios",
} as const;

function Value({ label, value }: { label: string; value?: string | null }) {
  return <div><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{value || "No informado"}</dd></div>;
}

export default async function DashboardStudentRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const { id } = await params;
  const [student, cmsPages] = await Promise.all([
    getStudentRecordForAdmin(id),
    discoverPagesGroupRoutes(),
  ]);
  if (!student) notFound();

  const guardian = student.guardians[0];
  return (
    <DashboardShell userEmail={user.email} cmsPages={cmsPages.filter((page) => !page.isDynamic)} breadcrumbPage="Expediente del alumno">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button nativeButton={false} render={<Link href="/dashboard/students" />} variant="ghost" size="sm"><ArrowLeft /> Volver a alumnos</Button>
          <div className="flex flex-wrap gap-2">
            <form action={updateStudentRecordStatusAction}><input type="hidden" name="studentId" value={student.id} /><input type="hidden" name="recordStatus" value="NEEDS_CHANGES" /><Button type="submit" variant="outline" size="sm">Solicitar cambios</Button></form>
            <form action={updateStudentRecordStatusAction}><input type="hidden" name="studentId" value={student.id} /><input type="hidden" name="recordStatus" value="REVIEWED" /><Button type="submit" size="sm">Marcar revisada</Button></form>
          </div>
        </div>
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle>{student.firstName} {student.lastName}</CardTitle>
            <Badge variant={student.recordStatus === "NEEDS_CHANGES" ? "destructive" : "secondary"}>{statusLabels[student.recordStatus]}</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <section><h2 className="mb-3 font-semibold">Datos personales</h2><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Value label="Documento" value={[student.documentType, student.documentNumber].filter(Boolean).join(" ")} />
              <Value label="Fecha de nacimiento" value={student.birthDate.toLocaleDateString("es-AR")} />
              <Value label="Grupo" value={student.group.name} />
              <Value label="Última actualización" value={student.updatedAt.toLocaleString("es-AR")} />
            </dl></section>
            <Separator />
            <section><h2 className="mb-3 font-semibold">Domicilio</h2><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Value label="Calle y número" value={student.address?.streetAndNumber} /><Value label="Barrio / localidad" value={student.address?.neighborhood} /><Value label="Ciudad y provincia" value={student.address?.cityAndState} /><Value label="Código postal" value={student.address?.postalCode} />
            </dl></section>
            <Separator />
            <section><h2 className="mb-1 font-semibold">Salud</h2><p className="mb-3 text-xs text-muted-foreground">Información sensible: acceso exclusivo para personal autorizado.</p><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Value label="Sangre y Rh" value={student.medicalProfile?.bloodType} /><Value label="Alergias" value={student.medicalProfile?.knownAllergies} /><Value label="Condiciones médicas" value={student.medicalProfile?.medicalConditions} /><Value label="Medicación" value={student.medicalProfile?.regularMedications} /><Value label="Cobertura" value={student.medicalProfile?.hasHealthInsurance ? "Sí" : "No"} /><Value label="Institución / afiliación" value={student.medicalProfile?.insuranceProviderAndPolicy} />
            </dl></section>
            <Separator />
            <section><h2 className="mb-3 font-semibold">Responsables y emergencias</h2><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Value label="Responsable principal" value={guardian?.fullName || guardian?.user?.name} /><Value label="Email" value={guardian?.email} /><Value label="Teléfono" value={guardian?.phone} />
              {student.responsibles.map((contact) => <Value key={contact.id} label={`Contacto secundario · ${contact.relationship}`} value={`${contact.fullName} · ${contact.phone}`} />)}
            </dl></section>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}