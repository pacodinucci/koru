import { ArrowLeft, SaveIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requirePermission } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { PlanDeleteButton } from "@/modules/families/components/plan-delete-button";
import { calculatePlanDiscount } from "@/modules/families/lib/plan-discounts";
import { createPlanEventualChargeItemAction, updatePlanAction, updatePlanEventualChargeItemAction } from "@/modules/families/server/families.actions";
import { getPlanForAdmin } from "@/modules/families/server/families.repository";

export default async function PlanDetailPage({ params }: { params: Promise<{ planId: string }> }) {
  const user = await requirePermission("families.view");
  const { planId } = await params;
  const [plan, cmsPages] = await Promise.all([getPlanForAdmin(planId), discoverPagesGroupRoutes()]);
  if (!plan) notFound();
  const canManage = user.permissionKeys.includes("families.manage");

  return (
    <DashboardShell userEmail={user.email} userRole={user.role} userPermissions={user.permissionKeys}
      cmsPages={cmsPages.filter((page) => !page.isDynamic)} breadcrumbPage={plan.name}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/families/plans" />}>
            <ArrowLeft /> Volver a planes
          </Button>
          {canManage ? <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/dashboard/families/plans/new?from=${plan.id}`} />}>
            Crear otro a partir de este
          </Button> : null}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>Los cambios afectan cargos futuros; los cargos ya emitidos no se modifican.</CardDescription>
            {canManage ? <CardAction><PlanDeleteButton plan={{ id: plan.id, name: plan.name }} /></CardAction> : null}
          </CardHeader>
          <CardContent className="space-y-5">
            {canManage ? (
              <form action={updatePlanAction} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_140px_auto] md:items-end">
                <input type="hidden" name="planId" value={plan.id} />
                <label className="grid gap-1 text-sm font-medium text-slate-700">Nombre
                  <Input name="name" defaultValue={plan.name} maxLength={120} required />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">Cuota básica mensual
                  <Input name="basicMonthlyFee" type="number" min="0.01" step="0.01" defaultValue={plan.basicMonthlyFee.toString()} required />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">Descuento (%)
                  <Input name="discountPercent" type="number" min="0" max="100" step="0.01" defaultValue={plan.discountPercent.toString()} required />
                </label>
                <Button type="submit">Guardar plan</Button>
              </form>
            ) : (
              <div className="flex flex-wrap gap-6 text-sm">
                <div><span className="text-muted-foreground">Cuota básica mensual</span><p className="font-medium">{plan.basicMonthlyFee.toNumber().toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</p></div>
                <div><span className="text-muted-foreground">Descuento</span><p className="font-medium">{plan.discountPercent.toString()} %</p></div>
              </div>
            )}
            <p className="text-sm text-slate-600">Cuota mensual actual con descuento: {Number(calculatePlanDiscount(plan.basicMonthlyFee.toString(), plan.discountPercent.toString()).netAmount).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</p>
            <section className="space-y-3 border-t border-slate-200 pt-4">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="font-medium text-slate-900">Rubros eventuales</h2>
                <p className="text-sm text-slate-600">Se aplican desde la ficha financiera de una familia y se cobran en la cantidad de cuotas indicada.</p>
              </div>
              {canManage ? (
                <form action={createPlanEventualChargeItemAction} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_130px_130px_auto] md:items-end">
                  <input type="hidden" name="planId" value={plan.id} />
                  <label className="grid gap-1 text-sm font-medium text-slate-700">Concepto<Input name="name" required placeholder="Ej.: Materiales" /></label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">Importe total sugerido<Input name="suggestedAmount" type="number" min="0.01" step="0.01" required /></label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">Descuento (%)<Input name="discountPercent" type="number" min="0" max="100" step="0.01" defaultValue="0" required /></label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">Cuotas<Input name="installmentCount" type="number" min="1" max="120" step="1" defaultValue="1" required /></label>
                  <Button type="submit" variant="outline">Agregar rubro</Button>
                </form>
              ) : null}
              {plan.eventualChargeItems.length ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200" role="table" aria-label="Rubros eventuales del plan">
                  <div className="min-w-[900px]">
                    <div className="grid grid-cols-[minmax(0,1fr)_180px_120px_110px_160px_44px] items-center gap-3 bg-slate-100/70 px-3 py-2 text-sm font-medium text-slate-700" role="row">
                      <span role="columnheader">Concepto</span>
                      <span role="columnheader">Importe total sugerido</span>
                      <span role="columnheader">Descuento (%)</span>
                      <span role="columnheader">Cuotas</span>
                      <span role="columnheader">Total con descuento</span>
                      <span role="columnheader" className="sr-only">Acciones</span>
                    </div>
                    <div role="rowgroup">
                      {plan.eventualChargeItems.map((item, index) => canManage ? (
                        <form key={item.id} role="row" action={updatePlanEventualChargeItemAction} className={`grid grid-cols-[minmax(0,1fr)_180px_120px_110px_160px_44px] items-center gap-3 border-t border-slate-200 px-3 py-2 ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                          <input type="hidden" name="planId" value={plan.id} /><input type="hidden" name="itemId" value={item.id} />
                          <div role="cell"><Input aria-label={`Concepto de ${item.name}`} name="name" defaultValue={item.name} required /></div>
                          <div role="cell"><Input aria-label={`Importe total sugerido de ${item.name}`} name="suggestedAmount" type="number" min="0.01" step="0.01" defaultValue={item.suggestedAmount.toString()} required /></div>
                          <div role="cell"><Input aria-label={`Descuento porcentual de ${item.name}`} name="discountPercent" type="number" min="0" max="100" step="0.01" defaultValue={item.discountPercent.toString()} required /></div>
                          <div role="cell"><Input aria-label={`Cuotas de ${item.name}`} name="installmentCount" type="number" min="1" max="120" step="1" defaultValue={item.installmentCount} required /></div>
                          <span role="cell">{Number(calculatePlanDiscount(item.suggestedAmount.toString(), item.discountPercent.toString()).netAmount).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</span>
                          <div role="cell"><Button type="submit" variant="outline" size="icon-sm" aria-label={`Guardar rubro ${item.name}`} title={`Guardar rubro ${item.name}`}><SaveIcon /></Button></div>
                        </form>
                      ) : (
                        <div key={item.id} role="row" className={`grid grid-cols-[minmax(0,1fr)_180px_120px_110px_160px_44px] items-center gap-3 border-t border-slate-200 px-3 py-3 text-sm ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                          <span role="cell" className="font-medium">{item.name}</span>
                          <span role="cell">{item.suggestedAmount.toNumber().toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</span>
                          <span role="cell">{item.discountPercent.toString()} %</span>
                          <span role="cell">{item.installmentCount}</span>
                          <span role="cell">{Number(calculatePlanDiscount(item.suggestedAmount.toString(), item.discountPercent.toString()).netAmount).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</span>
                          <span role="cell" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : <p className="text-sm text-slate-600">Todavía no hay rubros eventuales.</p>}
            </section>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
