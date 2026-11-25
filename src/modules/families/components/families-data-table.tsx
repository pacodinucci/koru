"use client";

import Link from "next/link";
import { ConvertCandidateFamily } from "./convert-candidate-family";

import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type FamilyListItem = {
  id: string;
  name: string;
  kind?: "FAMILY" | "CANDIDATE";
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  rubricsCount: number;
  balance: string;
  usersCount: number;
  studentsCount: number;
};

const labels = {
  ACTIVE: "Activa",
  SUSPENDED: "Suspendida",
  INACTIVE: "Inactiva",
} as const;
const statusBadgeVariants: Record<FamilyListItem["status"], "success" | "warning" | "muted"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  INACTIVE: "muted",
};
const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});
const columnHelper = createColumnHelper<typeof features, FamilyListItem>();

function currency(value: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(Number(value));
}

function rowRubricSummary(family: FamilyListItem) {
  return family.rubricsCount ? `${family.rubricsCount} ${family.rubricsCount === 1 ? "rubro asignado" : "rubros asignados"}` : "Sin rubros asignados";
}

export function FamiliesDataTable({
  families,
  initialSearch = "",
  onManage,
}: {
  families: FamilyListItem[];
  initialSearch?: string;
  onManage?: (familyId: string) => void;
}) {
  const [globalFilter, setGlobalFilter] = useState(initialSearch);
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("name", {
          header: "Familia",
          cell: (info) => <div className="flex items-center gap-2"><Link className="font-medium text-slate-900 hover:underline" href={`/dashboard/families/${info.row.original.id}`}>{info.getValue()}</Link>{info.row.original.kind === "CANDIDATE" && <Badge variant="warning">Candidata</Badge>}</div>,
        }),
        columnHelper.display({
          id: "members",
          header: "Integrantes",
          cell: ({ row }) => `${row.original.usersCount} usuarios · ${row.original.studentsCount} alumnos`,
        }),
        columnHelper.accessor("rubricsCount", {
          header: "Rubros asignados",
          cell: (info) => rowRubricSummary(info.row.original),
          enableGlobalFilter: false,
        }),
        columnHelper.accessor("status", {
          header: "Estado",
          cell: (info) => <Badge variant={statusBadgeVariants[info.getValue()]}>{labels[info.getValue()]}</Badge>,
          enableGlobalFilter: false,
        }),
        columnHelper.accessor("balance", {
          header: "Saldo",
          cell: (info) => {
            const balance = Number(info.getValue());
            return <span className={balance > 0 ? "font-medium text-amber-700" : "font-medium text-emerald-700"}>{currency(info.getValue())}</span>;
          },
          enableGlobalFilter: false,
        }),
        columnHelper.display({
          id: "manage",
          header: "",
          cell: ({ row }) => <div className="flex items-center gap-2">{onManage && <Button type="button" size="sm" variant="outline" onClick={() => onManage(row.original.id)}>Gestionar</Button>}{row.original.kind === "CANDIDATE" && <ConvertCandidateFamily familyId={row.original.id} />}</div>,
        }),
      ]),
    [onManage],
  );
  const table = useTable({
    columns,
    data: families,
    features,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });
  const pageCount = table.getPageCount();

  return (
    <div className="min-w-0 space-y-3">
      <div aria-label="Buscar y filtrar familias" className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="w-full min-w-0 space-y-1 lg:w-64 lg:shrink-0">
          <label htmlFor="families-search" className="text-sm text-slate-600">Buscar</label>
          <Input
            id="families-search"
            type="search"
            value={globalFilter}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            placeholder="Buscar familia por nombre"
            className="min-w-0"
          />
        </div>
        <div className="ml-auto min-w-0 max-w-full space-y-1">
          <p className="text-sm text-slate-600">{table.getPrePaginatedRowModel().rows.length} familias</p>
        </div>
      </div>
      <div className="min-w-0 overflow-x-auto rounded-xl border border-slate-200 bg-white p-3">
        <Table className="min-w-[840px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => <TableHead key={header.id}>{header.isPlaceholder ? null : <table.FlexRender header={header} />}</TableHead>)}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-slate-600">No encontramos familias con ese nombre.</TableCell></TableRow> : null}
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => <TableCell key={cell.id}><table.FlexRender cell={cell} /></TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <span>Página {table.state.pagination.pageIndex + 1} de {pageCount}</span>
        <div className="flex items-center gap-2">
          <select aria-label="Filas por página" className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={table.state.pagination.pageSize} onChange={(event) => table.setPageSize(Number(event.target.value))}>
            {[10, 20, 50].map((size) => <option key={size} value={size}>{size} por página</option>)}
          </select>
          <Button type="button" size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Anterior</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Siguiente</Button>
        </div>
      </div>
    </div>
  );
}
