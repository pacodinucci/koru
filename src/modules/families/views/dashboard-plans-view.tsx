import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PlansDataTable } from "@/modules/families/components/plans-data-table";
import { listPlansForAdmin } from "@/modules/families/server/families.repository";

export async function DashboardPlansView({ canManage }: { canManage: boolean }) {
  const plans = await listPlansForAdmin();

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-montserrat)] text-2xl font-semibold text-slate-900">Planes</h1>
          <p className="mt-1 text-sm text-slate-600">Consultá y administrá la cuota básica y los rubros eventuales de cada plan.</p>
        </div>
        {canManage ? (
          <Button nativeButton={false} render={<Link href="/dashboard/families/plans/new" />}>
            <Plus /> Nuevo plan
          </Button>
        ) : null}
      </div>
      <PlansDataTable canManage={canManage} plans={plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        annualFee: plan.annualFee.toString(),
        installmentCount: plan.installmentCount,
        startMonth: plan.startMonth,
        discountPercent: plan.discountPercent.toString(),
        eventualItemsCount: plan.eventualChargeItems.length,
      }))} />
    </div>
  );
}
