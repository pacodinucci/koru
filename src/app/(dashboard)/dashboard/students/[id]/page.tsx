import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { updateStudentRecordStatusAction } from "@/modules/students/server/student.actions";
import { getStudentRecordForViewer, listStudentReportsForViewer } from "@/modules/students/server/students.repository";
import { admissionQuestionnaireSections, readQuestionnaireAnswers } from "@/modules/family-dashboard/lib/admission-questionnaire";
import { CreateStudentReportDialog } from "@/modules/teachers/components/create-student-report-dialog";
import { TeacherReportsTable } from "@/modules/teachers/components/teacher-reports-table";

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
  const user = await requirePermission("students.view");
  const { id } = await params;
  const [student, cmsPages] = await Promise.all([
    getStudentRecordForViewer(id, user),
    discoverPagesGroupRoutes(),
  ]);
  if (!student) notFound();

  let reportsAvailable = true;
  let reports: Awaited<ReturnType<typeof listStudentReportsForViewer>> = [];
  try {
    reports = await listStudentReportsForViewer(id, user);
  } catch (error) {
    console.error("[student-reports] No se pudieron cargar los reportes del expediente", error);
    reportsAvailable = false;
  }

  const guardian = student.guardians[0];
  const questionnaire = student.admissionQuestionnaire;
  const questionnaireAnswers = readQuestionnaireAnswers(questionnaire?.answers);
  const reportStudent = {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    group: { name: student.group.name },
  };
  const isTeacher = user.role === "TEACHER" || user.role === "ADMIN_TEACHER";
  return (
    <DashboardShell userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys} cmsPages={cmsPages.filter((page) => !page.isDynamic)} breadcrumbPage="Expediente del alumno">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button nativeButton={false} render={<Link href="/dashboard/students" />} variant="ghost" size="sm"><ArrowLeft /> Volver a alumnos</Button>
          {user.permissionKeys.includes("students.manage") ? <div className="flex flex-wrap gap-2">
            <form action={updateStudentRecordStatusAction}><input type="hidden" name="studentId" value={student.id} /><input type="hidden" name="recordStatus" value="NEEDS_CHANGES" /><Button type="submit" variant="outline" size="sm">Solicitar cambios</Button></form>
            <form action={updateStudentRecordStatusAction}><input type="hidden" name="studentId" value={student.id} /><input type="hidden" name="recordStatus" value="REVIEWED" /><Button type="submit" size="sm">Marcar revisada</Button></form>
          </div> : null}
        </div>
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle>{student.firstName} {student.lastName}</CardTitle>
            <Badge variant={student.recordStatus === "NEEDS_CHANGES" ? "destructive" : "secondary"}>{statusLabels[student.recordStatus]}</Badge>
          </CardHeader>
          <CardContent>
            <Accordion multiple defaultValue={[]}>
            <AccordionItem value="personal">
              <AccordionTrigger>Datos personales</AccordionTrigger>
              <AccordionContent><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Value label="Documento" value={[student.documentType, student.documentNumber].filter(Boolean).join(" ")} />
              <Value label="Fecha de nacimiento" value={student.birthDate.toLocaleDateString("es-AR")} />
              <Value label="Grupo" value={student.group.name} />
              <Value label="Última actualización" value={student.updatedAt.toLocaleString("es-AR")} />
              </dl></AccordionContent>
            </AccordionItem>
            <AccordionItem value="address">
              <AccordionTrigger>Domicilio</AccordionTrigger>
              <AccordionContent><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Value label="Calle y número" value={student.address?.streetAndNumber} /><Value label="Barrio / localidad" value={student.address?.neighborhood} /><Value label="Ciudad y provincia" value={student.address?.cityAndState} /><Value label="Código postal" value={student.address?.postalCode} />
              </dl></AccordionContent>
            </AccordionItem>
            <AccordionItem value="health">
              <AccordionTrigger>Salud</AccordionTrigger>
              <AccordionContent><p className="mb-3 text-xs text-muted-foreground">Información sensible: acceso exclusivo para personal autorizado.</p><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Value label="Sangre y Rh" value={student.medicalProfile?.bloodType} /><Value label="Alergias" value={student.medicalProfile?.knownAllergies} /><Value label="Condiciones médicas" value={student.medicalProfile?.medicalConditions} /><Value label="Medicación" value={student.medicalProfile?.regularMedications} /><Value label="Cobertura" value={student.medicalProfile?.hasHealthInsurance ? "Sí" : "No"} /><Value label="Institución / afiliación" value={student.medicalProfile?.insuranceProviderAndPolicy} />
              </dl></AccordionContent>
            </AccordionItem>
            <AccordionItem value="responsibles">
              <AccordionTrigger>Responsables y emergencias</AccordionTrigger>
              <AccordionContent><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Value label="Responsable principal" value={guardian?.fullName || guardian?.user?.name} /><Value label="Email" value={guardian?.email} /><Value label="Teléfono" value={guardian?.phone} />
              {student.responsibles.map((contact) => <Value key={contact.id} label={`Contacto secundario · ${contact.relationship}`} value={`${contact.fullName} · ${contact.phone}`} />)}
              </dl></AccordionContent>
            </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Accordion defaultValue={[]}>
              <AccordionItem value="questionnaire">
                <AccordionTrigger className="gap-3">
                  <span>Cuestionario de ingreso</span>
                  <Badge variant="secondary">{questionnaire?.submittedAt ? "Completado" : questionnaire ? "En progreso" : "Pendiente"}</Badge>
                </AccordionTrigger>
                <AccordionContent>
            {!questionnaire?.submittedAt ? <p className="text-sm text-muted-foreground">La familia todavía no envió el cuestionario. Las respuestas en borrador no se muestran.</p> : <>
              <p className="text-xs text-muted-foreground">Información sensible para acompañamiento pedagógico interno. Enviado el {questionnaire.submittedAt.toLocaleDateString("es-AR")}.</p>
              <section><h3 className="mb-3 font-semibold">Información general</h3><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Value label="Nombre completo" value={`${student.firstName} ${student.lastName}`} />
                <Value label="Fecha de nacimiento" value={student.birthDate.toLocaleDateString("es-AR")} />
                <Value label="Dirección" value={[student.address?.streetAndNumber, student.address?.neighborhood, student.address?.cityAndState].filter(Boolean).join(", ")} />
                <Value label="Teléfono de contacto" value={guardian?.phone} />
                <Value label="Correos de madre, padre o tutores" value={student.guardians.map((item) => item.email).join(", ")} />
                <Value label="Nombre de madre, padre o tutores" value={student.guardians.map((item) => item.fullName || item.user?.name).filter(Boolean).join(", ")} />
              </dl></section>
              {admissionQuestionnaireSections.map((section) => <section key={section.title} className="border-t pt-5">
                <h3 className="mb-3 font-semibold">{section.title}</h3>
                <dl className="grid gap-4 sm:grid-cols-2">{section.questions.map((question) => <Value key={question.key} label={question.label} value={questionnaireAnswers[question.key]} />)}</dl>
              </section>)}
            </>}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Accordion defaultValue={[]}>
              <AccordionItem value="reports">
                <AccordionTrigger>Reportes</AccordionTrigger>
                <AccordionContent>
                  {isTeacher ? (
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        Podés cambiar la visibilidad de los reportes que creaste.
                      </p>
                      <CreateStudentReportDialog students={[reportStudent]} fixedStudent={reportStudent} />
                    </div>
                  ) : null}
                  {!reportsAvailable ? (
                    <p role="status" className="text-sm text-muted-foreground">Los reportes no están disponibles en este momento.</p>
                  ) : (
                    <TeacherReportsTable
                      reports={reports.map((report) => ({
                        ...report,
                        teacher: { displayName: report.teacher.displayName },
                        createdAt: report.createdAt.toISOString(),
                        student: reportStudent,
                        canManageVisibility: isTeacher && report.teacher.userId === user.id,
                      }))}
                      students={[reportStudent]}
                      fixedStudent={reportStudent}
                    />
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
