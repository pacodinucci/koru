import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FamilyAdminActionsMenu } from "@/modules/families/components/family-admin-actions-menu";
import { FamilyFinancialCard } from "@/modules/families/components/family-financial-card";
import { FamilyResponsiblesList } from "@/modules/families/components/family-responsibles-list";
import { buildFamilyResponsibles } from "@/modules/families/lib/family-responsibles";
import { StudentRubricAssignmentForm } from "@/modules/families/components/student-rubric-assignment-form";
import { StudentRubricAssignmentEditor } from "@/modules/families/components/student-rubric-assignment-editor";
import { buildFamilyFinancialSummary } from "@/modules/families/lib/family-financial-summary";
import { getFamilyFinancialRecord } from "@/modules/families/server/family-financial.repository";
import { listBillingRubricsForAdmin, listStudentRubricAssignments } from "@/modules/families/server/rubrics.repository";

function currency(value: string | number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(value));
}

export async function DashboardFamilyDetailView({ familyId, canManageFamily, canManagePayments, canWaive }: { familyId: string; canManageFamily: boolean; canManagePayments: boolean; canWaive: boolean }) {
  const [family, rubrics, assignments] = await Promise.all([
    getFamilyFinancialRecord(familyId).catch(() => null),
    listBillingRubricsForAdmin(),
    listStudentRubricAssignments(familyId),
  ]);
  const rubricOptions = rubrics.map((rubric) => ({ id: rubric.id, name: rubric.name, amount: rubric.amount.toString(), isActive: rubric.isActive }));
  if (!family) notFound();
  const summary = buildFamilyFinancialSummary(family.accountEntries, family.eventualChargeSchedules);
  const normalizedById = new Map(summary.entries.map(entry => [entry.id, entry]));
  const financialFamily = {
    id: family.id,
    name: family.name,
    balance: summary.balance,
    pendingCharges: summary.pendingCharges,
    unallocatedCredits: summary.unallocatedCredits,
    futureCharges: summary.projectedCharges,
    // Rubrics are student assignments, not legacy PlanEventualChargeItem IDs.
    // An empty list keeps the financial card's manual free-charge flow available.
    eventualChargeItems: [],
    entries: family.accountEntries.map((entry) => {
      const normalized = normalizedById.get(entry.id)!;
      return {
      id: entry.id, isFuture: normalized.isFuture, type: entry.type, amount: entry.amount.toString(), grossAmount: entry.grossAmount?.toString() ?? null, discountAmount: entry.discountAmount?.toString() ?? null, description: entry.description, occurredAt: normalized.occurredAt.toISOString(),
      payment: entry.payment ? { id: entry.payment.id, method: entry.payment.method, reference: entry.payment.reference, status: entry.payment.status, receipt: entry.payment.receipt ? { id: entry.payment.receipt.id, status: entry.payment.receipt.status, pdfUrl: entry.payment.receipt.pdfUrl, number: entry.payment.receipt.number } : null } : null,
      };
    }),
  };
  const responsibles = buildFamilyResponsibles(family.users, family.students).map((responsible) => ({
    id: responsible.id,
    fullName: responsible.fullName,
    relationship: responsible.relationship,
    phone: responsible.phone,
    studentNames: responsible.studentNames,
    canPickup: responsible.canPickup,
    emergencyContact: responsible.emergencyContact,
    hasUser: responsible.hasUser,
    source: responsible.source,
  }));

  return <div className="flex w-full flex-col gap-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><Button nativeButton={false} render={<Link href="/dashboard/families" />} variant="ghost" size="sm"><ArrowLeft /> Volver a familias</Button><h1 className="mt-4 font-[family-name:var(--font-montserrat)] text-2xl font-semibold text-slate-900">{family.name}</h1><p className="mt-1 text-sm text-slate-600">Ficha integral de la familia.</p></div>
      {canManageFamily ? <FamilyAdminActionsMenu familyId={family.id} familyName={family.name} /> : null}
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Usuarios</CardTitle></CardHeader><CardContent className="space-y-2">{family.users.length ? family.users.map((user) => <div key={user.id} className="rounded-lg border border-slate-200 p-3"><p className="font-medium">{user.name || "Sin nombre"}</p><p className="text-sm text-slate-600">{user.email}</p></div>) : <p className="text-sm text-slate-600">Todavía no hay usuarios vinculados.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Responsables</CardTitle></CardHeader><CardContent><FamilyResponsiblesList responsibles={responsibles} /></CardContent></Card>
    </div>
    <Card>
      <CardHeader><CardTitle>Hij@s · Rubros por alumno</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {family.students.length ? <Accordion multiple defaultValue={family.students.map(student => student.id)} className="gap-4 [&_[data-slot=accordion-content]]:[--radix-accordion-content-height:var(--accordion-panel-height)] motion-reduce:[&_[data-slot=accordion-content]]:animate-none">{family.students.map((student) => {
          const studentAssignments = assignments.filter((assignment) => assignment.studentId === student.id);
          return (
            <AccordionItem key={student.id} value={student.id} render={<section />} aria-label={`Rubros de ${student.firstName} ${student.lastName}`} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <Link href={`/dashboard/students/${student.id}`} className="font-medium text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">{student.lastName}, {student.firstName}</Link>
                <AccordionTrigger aria-label={`Mostrar u ocultar rubros de ${student.firstName} ${student.lastName}`} className="items-center gap-3 py-1 text-slate-600 hover:no-underline">
                  <span>{student.group.name}</span>
                </AccordionTrigger>
              </div>
              <AccordionContent className="h-auto space-y-3 pt-3 pb-0 [&_a]:no-underline [&_p:not(:last-child)]:mb-0">
              {studentAssignments.length ? (
                <ul className="space-y-2">
                  {studentAssignments.map((assignment) => (
                    <li key={assignment.id} className="rounded-md bg-slate-50 p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{assignment.itemName}</p>
                        {canManageFamily && assignment.rubricId ? <StudentRubricAssignmentEditor familyId={family.id} studentId={student.id} rubrics={rubricOptions} assignment={{
                          id: assignment.id,
                          rubricId: assignment.rubricId,
                          itemName: assignment.itemName,
                          grossAmount: (assignment.grossAmount ?? assignment.totalAmount).toString(),
                          discountPercent: assignment.discountPercent?.toString() ?? "0",
                          installmentCount: assignment.installmentCount,
                          startPeriod: assignment.startPeriod.toISOString(),
                        }} /> : null}
                      </div>
                      <p className="text-slate-600">Bruto: {currency((assignment.grossAmount ?? assignment.totalAmount).toString())} · Descuento ({assignment.discountPercent?.toString() ?? "0"}%): {currency(assignment.discountAmount?.toString() ?? "0")} · Neto: {currency(assignment.totalAmount.toString())}</p>
                      <p className="text-slate-600">{assignment.installmentCount} {assignment.installmentCount === 1 ? "cuota" : "cuotas"} · {assignment.installmentCount === 1 ? "Mes de imputación" : "Desde"} {new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" }).format(assignment.startPeriod)}</p>
                      {assignment.cancelledFrom ? <p className="text-slate-600">Cancelado desde {new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" }).format(assignment.cancelledFrom)}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-600">Todavía no tiene rubros asignados.</p>}
              {canManageFamily ? <StudentRubricAssignmentForm familyId={family.id} studentId={student.id} rubrics={rubricOptions} /> : null}
              </AccordionContent>
            </AccordionItem>
          );
        })}</Accordion> : <p className="text-sm text-slate-600">Todavía no hay hij@s registrados.</p>}
      </CardContent>
    </Card>
    <FamilyFinancialCard family={financialFamily} eventualChargeItems={financialFamily.eventualChargeItems} canManagePayments={canManagePayments} canWaive={canWaive} />
  </div>;
}
