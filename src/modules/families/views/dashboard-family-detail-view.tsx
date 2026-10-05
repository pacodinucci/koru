import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FamilyFinancialCard } from "@/modules/families/components/family-financial-card";
import { FamilyResponsiblesList } from "@/modules/families/components/family-responsibles-list";
import { buildFamilyResponsibles } from "@/modules/families/lib/family-responsibles";
import { calculatePlanDiscount } from "@/modules/families/lib/plan-discounts";
import { assignPlanToStudentAction } from "@/modules/families/server/families.actions";
import { getFamilyFinancialRecord } from "@/modules/families/server/family-financial.repository";
import { listPlansForAdmin } from "@/modules/families/server/families.repository";

function currency(value: string | number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(value));
}

export async function DashboardFamilyDetailView({ familyId, canManagePayments, canWaive }: { familyId: string; canManagePayments: boolean; canWaive: boolean }) {
  const [family, plans] = await Promise.all([getFamilyFinancialRecord(familyId).catch(() => null), listPlansForAdmin()]);
  if (!family) notFound();
  const balance = family.accountEntries.reduce((total, entry) => total + Number(entry.amount), 0);
  const financialFamily = {
    id: family.id,
    name: family.name,
    balance: balance.toFixed(2),
    eventualChargeItems: Array.from(new Map(family.students.flatMap((student) => student.plan?.eventualChargeItems ?? []).map((item) => [item.id, { id: item.id, name: item.name, suggestedAmount: item.suggestedAmount.toString(), discountPercent: item.discountPercent.toString(), installmentCount: item.installmentCount }])).values()),
    entries: family.accountEntries.map((entry) => ({
      id: entry.id, type: entry.type, amount: entry.amount.toString(), grossAmount: entry.grossAmount?.toString() ?? null, discountAmount: entry.discountAmount?.toString() ?? null, description: entry.description, occurredAt: entry.occurredAt.toISOString(),
      payment: entry.payment ? { id: entry.payment.id, method: entry.payment.method, reference: entry.payment.reference, status: entry.payment.status, receipt: entry.payment.receipt ? { id: entry.payment.receipt.id, status: entry.payment.receipt.status, pdfUrl: entry.payment.receipt.pdfUrl, number: entry.payment.receipt.number } : null } : null,
    })),
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
      <div><Button variant="outline" nativeButton={false} render={<Link href="/dashboard/families" />}>Volver a Familias</Button><h1 className="mt-4 font-[family-name:var(--font-montserrat)] text-2xl font-semibold text-slate-900">{family.name}</h1><p className="mt-1 text-sm text-slate-600">Ficha integral de la familia.</p></div>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Usuarios</CardTitle></CardHeader><CardContent className="space-y-2">{family.users.length ? family.users.map((user) => <div key={user.id} className="rounded-lg border border-slate-200 p-3"><p className="font-medium">{user.name || "Sin nombre"}</p><p className="text-sm text-slate-600">{user.email}</p></div>) : <p className="text-sm text-slate-600">Todavía no hay usuarios vinculados.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Responsables</CardTitle></CardHeader><CardContent><FamilyResponsiblesList responsibles={responsibles} /></CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Hij@s</CardTitle></CardHeader><CardContent className="space-y-2">{family.students.length ? family.students.map((student) => <div key={student.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"><div><p className="font-medium">{student.lastName}, {student.firstName}</p><p className="text-sm text-slate-600">{student.group.name}</p></div><form action={assignPlanToStudentAction} className="flex flex-wrap items-end gap-2"><input type="hidden" name="familyId" value={family.id} /><input type="hidden" name="studentId" value={student.id} /><label className="grid gap-1 text-sm font-medium text-slate-700">Plan asignado<select name="planId" defaultValue={student.planId ?? ""} className="h-9 min-w-56 rounded-md border border-input bg-background px-3 text-sm" required><option value="" disabled>Seleccionar plan</option>{plans.filter((plan) => plan.isActive || plan.id === student.planId).map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {currency(calculatePlanDiscount(plan.basicMonthlyFee.toString(), plan.discountPercent.toString()).netAmount)}{plan.discountPercent.isZero() ? "" : ` (${plan.discountPercent}% desc.)`}</option>)}</select></label><Button type="submit">Guardar plan</Button></form></div>) : <p className="text-sm text-slate-600">Todavía no hay hij@s registrados.</p>}</CardContent></Card>
    <FamilyFinancialCard family={financialFamily} eventualChargeItems={financialFamily.eventualChargeItems} canManagePayments={canManagePayments} canWaive={canWaive} />
  </div>;
}
