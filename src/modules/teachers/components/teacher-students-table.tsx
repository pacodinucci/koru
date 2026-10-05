"use client";

import Link from "next/link";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type TeacherStudent = {
  id: string;
  firstName: string;
  lastName: string;
  group: { name: string };
};

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});
const columnHelper = createColumnHelper<typeof features, TeacherStudent>();

export function TeacherStudentsTable({ students }: { students: TeacherStudent[] }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const columns = useMemo(() => columnHelper.columns([
    columnHelper.accessor((student) => `${student.lastName} ${student.firstName} ${student.firstName} ${student.lastName}`, {
      id: "name",
      header: "Apellido y nombre",
      cell: ({ row }) => <Link className="font-medium text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" href={`/dashboard/students/${row.original.id}`}>{row.original.lastName}, {row.original.firstName}</Link>,
    }),
    columnHelper.accessor((student) => student.group.name, {
      id: "group",
      header: "Curso",
      enableGlobalFilter: false,
    }),
    columnHelper.display({
      id: "status",
      header: "Estado",
      cell: () => <Badge>Activo</Badge>,
    }),
  ]), []);
  const table = useTable({
    columns,
    data: students,
    features,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });
  const resultCount = table.getPrePaginatedRowModel().rows.length;
  const pageCount = Math.max(1, table.getPageCount());

  return <div className="min-w-0 space-y-3">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <Input
        type="search"
        aria-label="Buscar alumnos por nombre o apellido"
        value={globalFilter}
        onChange={(event) => {
          table.setPageIndex(0);
          table.setGlobalFilter(event.target.value);
        }}
        placeholder="Buscar por nombre o apellido"
        className="sm:max-w-sm"
      />
      <p className="text-sm text-slate-600" role="status">{resultCount} {resultCount === 1 ? "alumno" : "alumnos"}</p>
    </div>
    <div className="min-w-0 overflow-x-auto rounded-xl border border-slate-200">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => <TableHead key={header.id}>{header.isPlaceholder ? null : <table.FlexRender header={header} />}</TableHead>)}
          </TableRow>)}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">{students.length === 0 ? "No hay alumnos activos en tus cursos." : "No encontramos alumnos con esa búsqueda."}</TableCell></TableRow> : null}
          {table.getRowModel().rows.map((row) => <TableRow key={row.id}>
            {row.getAllCells().map((cell) => <TableCell key={cell.id}><table.FlexRender cell={cell} /></TableCell>)}
          </TableRow>)}
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
  </div>;
}
