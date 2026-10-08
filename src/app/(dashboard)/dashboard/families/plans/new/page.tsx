import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePermission } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { CreatePlanForm } from "@/modules/families/components/create-plan-form";
import { listPlansForAdmin } from "@/modules/families/server/families.repository";

export default async function NewPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await requirePermission("families.manage");
  const [plans, cmsPages] = await Promise.all([
    listPlansForAdmin(),
    discoverPagesGroupRoutes(),
  ]);
  const { from } = await searchParams;
  const source = plans.find((plan) => plan.id === from);

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={cmsPages.filter((page) => !page.isDynamic)}
      breadcrumbPage="Nuevo plan"
    >
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/dashboard/families/plans" />}
        >
          <ArrowLeft /> Volver a planes
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Nuevo plan</CardTitle>
            <CardDescription>
              Empezá desde cero o tomá un plan existente como base. El original
              no se modifica.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form
              action="/dashboard/families/plans/new"
              method="get"
              className="flex flex-wrap items-end gap-2"
            >
              <label className="grid w-full gap-1 text-sm font-medium text-slate-700 md:w-1/4">
                Utilizar plan existente como base
                <select
                  name="from"
                  defaultValue={source?.id ?? ""}
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Desde cero</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit" variant="outline">
                Cargar base
              </Button>
            </form>
            {source ? (
              <p className="text-sm text-muted-foreground">
                Se copiaron la cuota y los rubros activos de «{source.name}».
                Podés cambiar cualquier dato antes de crear el nuevo plan.
              </p>
            ) : null}
            <CreatePlanForm
              key={source?.id ?? "empty"}
              initialName={source ? `${source.name.slice(0, 112)} (copia)` : ""}
              initialFee={source?.annualFee.toString() ?? ""}
              initialInstallmentCount={source?.installmentCount ?? 12}
              initialStartMonth={source?.startMonth ?? 1}
              initialDiscountPercent={source?.discountPercent.toString() ?? "0"}
              initialItems={
                source?.eventualChargeItems
                  .filter((item) => item.isActive)
                  .map((item) => ({
                    name: item.name,
                    suggestedAmount: item.suggestedAmount.toString(),
                    discountPercent: item.discountPercent.toString(),
                    installmentCount: item.installmentCount.toString(),
                    startMonth: item.startMonth.toString(),
                  })) ?? []
              }
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
