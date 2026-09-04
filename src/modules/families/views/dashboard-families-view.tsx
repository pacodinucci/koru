import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreateFamilyDialog } from "@/modules/families/components/create-family-dialog";
import { FamiliesDataTable } from "@/modules/families/components/families-data-table";
import { listFamiliesForAdmin } from "@/modules/families/server/families.repository";

export async function DashboardFamiliesView({ query = "" }: { query?: string }) {
  const families = await listFamiliesForAdmin();
  const tableFamilies = families.map((family) => ({ id: family.id, name: family.name, status: family.status, planId: family.planId, plan: family.plan ? { id: family.plan.id, name: family.plan.name, monthlyFee: family.plan.monthlyFee.toString(), isActive: family.plan.isActive } : null, balance: family.balance, usersCount: family._count.users, studentsCount: family._count.students }));
  return <div className="flex w-full flex-col gap-4"><div><h1 className="font-[family-name:var(--font-montserrat)] text-2xl font-semibold text-slate-900">Familias</h1><p className="mt-1 text-sm text-slate-600">Consultá y administrá la información de cada familia.</p></div><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end"><Button variant="outline" nativeButton={false} render={<Link href="/dashboard/families/plans" />}>Planes</Button><CreateFamilyDialog /></div>{families.length === 0 ? <Card className="rounded-2xl border-dashed"><CardContent className="py-10 text-center text-sm text-slate-600">Todavía no hay familias creadas.</CardContent></Card> : <FamiliesDataTable families={tableFamilies} initialSearch={query} />}</div>;
}