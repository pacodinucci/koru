import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createPlanAction, updatePlanAction } from "@/modules/families/server/families.actions";
import { listPlansForAdmin } from "@/modules/families/server/families.repository";

export async function DashboardPlansView() {
  const plans = await listPlansForAdmin();

  return <div className="flex w-full flex-col gap-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="font-[family-name:var(--font-montserrat)] text-2xl font-semibold text-slate-900">Planes</h1><p className="mt-1 text-sm text-slate-600">Definí las cuotas mensuales que se aplicarán a cargos futuros.</p></div><Button variant="outline" nativeButton={false} render={<Link href="/dashboard/families" />}>Volver a Familias</Button></div>
    <Card className="w-full rounded-2xl border-slate-200"><CardHeader><CardTitle>Nuevo plan</CardTitle><CardDescription>La cuota no modifica cargos ya generados.</CardDescription></CardHeader><CardContent><form action={createPlanAction} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]"><Input name="name" required placeholder="Nombre del plan"/><Input name="monthlyFee" type="number" min="1" step="0.01" required placeholder="Cuota mensual"/><Button type="submit">Crear plan</Button></form></CardContent></Card>
    <Card className="w-full rounded-2xl border-slate-200"><CardHeader><CardTitle>Planes disponibles</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead className="border-b text-left text-xs text-slate-600"><tr><th className="px-3 py-2 font-medium">Nombre</th><th className="px-3 py-2 font-medium">Cuota mensual</th><th className="px-3 py-2 font-medium">Estado</th><th className="px-3 py-2 text-right font-medium">Acción</th></tr></thead><tbody>{plans.length === 0 ? <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-600">Todavía no hay planes creados.</td></tr> : plans.map((plan) => <tr key={plan.id} className="border-b last:border-0"><td colSpan={4} className="p-0"><form action={updatePlanAction} className="grid grid-cols-[minmax(0,1fr)_220px_140px_auto] items-center gap-3 px-3 py-3"><input type="hidden" name="planId" value={plan.id}/><Input name="name" defaultValue={plan.name} required/><Input name="monthlyFee" type="number" min="1" step="0.01" defaultValue={plan.monthlyFee.toString()} required/><select name="isActive" defaultValue={plan.isActive ? "true" : "false"} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="true">Activo</option><option value="false">Inactivo</option></select><Button type="submit" variant="outline">Guardar</Button></form></td></tr>)}</tbody></table></div></CardContent></Card>
  </div>;
}