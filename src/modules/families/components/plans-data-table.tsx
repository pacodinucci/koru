"use client";

import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { PlanDeleteDialog } from "@/modules/families/components/plan-delete-dialog";
import { BILLING_MONTHS } from "@/modules/families/lib/annual-plan";
import { calculatePlanDiscount } from "@/modules/families/lib/plan-discounts";

type PlanListItem = {
  id: string;
  name: string;
  annualFee: string;
  installmentCount: number;
  startMonth: number;
  discountPercent: string;
  eventualItemsCount: number;
};

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

function normalize(value: string) {
  return value.toLocaleLowerCase("es-AR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function PlansDataTable({ plans, canManage }: { plans: PlanListItem[]; canManage: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<PlanListItem | null>(null);
  const query = normalize(search.trim());
  const filteredPlans = query ? plans.filter((plan) => normalize(plan.name).includes(query)) : plans;
  const pageCount = Math.max(1, Math.ceil(filteredPlans.length / pageSize));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const visiblePlans = filteredPlans.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPageIndex(0); }}
          placeholder="Buscar plan por nombre"
          aria-label="Buscar plan por nombre"
          className="sm:max-w-sm"
        />
        <p className="text-sm text-slate-600">{filteredPlans.length} {filteredPlans.length === 1 ? "plan" : "planes"}</p>
      </div>
      <div className="min-w-0 rounded-xl border border-slate-200">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Cuotas / inicio</TableHead><TableHead>Cuota anual</TableHead>
              <TableHead>Rubros eventuales</TableHead>
              {canManage ? <TableHead className="w-20 text-right">Acciones</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiblePlans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="py-10 text-center text-slate-600">
                  {plans.length === 0 ? "Todavía no hay planes creados." : "No encontramos planes con ese nombre."}
                </TableCell>
              </TableRow>
            ) : visiblePlans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/families/plans/${plan.id}`} className="text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                    {plan.name}
                  </Link>
                </TableCell>
                <TableCell>{plan.installmentCount} / {BILLING_MONTHS[plan.startMonth - 1]}</TableCell>
                <TableCell>{Number(plan.discountPercent) > 0 ? <div><span className="text-xs text-muted-foreground line-through">{currency.format(Number(plan.annualFee))}</span><p>{currency.format(Number(calculatePlanDiscount(plan.annualFee, plan.discountPercent).netAmount))} <span className="text-xs text-muted-foreground">({plan.discountPercent}% desc.)</span></p></div> : currency.format(Number(plan.annualFee))}</TableCell>
                <TableCell>{plan.eventualItemsCount}</TableCell>
                {canManage ? (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label={`Acciones para ${plan.name}`}><Ellipsis /></Button>} />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/families/plans/${plan.id}`)}><Pencil /> Editar</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setSelectedPlan(plan)}><Trash2 /> Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <span>Página {currentPage + 1} de {pageCount}</span>
        <div className="flex items-center gap-2">
          <select aria-label="Filas por página" className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPageIndex(0); }}>
            {[10, 20, 50].map((size) => <option key={size} value={size}>{size} por página</option>)}
          </select>
          <Button type="button" size="sm" variant="outline" onClick={() => setPageIndex(currentPage - 1)} disabled={currentPage === 0}>Anterior</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setPageIndex(currentPage + 1)} disabled={currentPage >= pageCount - 1}>Siguiente</Button>
        </div>
      </div>
      {selectedPlan ? <PlanDeleteDialog plan={selectedPlan} onClose={() => setSelectedPlan(null)} onDeleted={() => {
        setSelectedPlan(null);
        toast("Plan eliminado.", "success");
        router.refresh();
      }} /> : null}
    </div>
  );
}
