"use client";

import { Fragment, useState, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export type DashboardSearchableRow = {
  id: string;
  searchText: string;
  content: ReactNode;
  mobileContent?: ReactNode;
};

type DashboardSearchableTableProps = {
  searchId: string;
  searchPlaceholder: string;
  header: ReactNode;
  rows: DashboardSearchableRow[];
  columnCount: number;
  emptyMessage: string;
  noResultsMessage?: string;
  tableClassName?: string;
};

// Rows may be server-rendered slots: forms and server actions stay owned by the
// calling view. Search metadata must contain only text already visible in a row.
export function DashboardSearchableTable({
  searchId,
  searchPlaceholder,
  header,
  rows,
  columnCount,
  emptyMessage,
  noResultsMessage = "No encontramos resultados para esta búsqueda.",
  tableClassName,
}: DashboardSearchableTableProps) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const visible = rows.filter((row) => row.searchText.toLowerCase().includes(query));
  const hasMobileCards = rows.some((row) => row.mobileContent !== undefined);
  const emptyText = rows.length === 0 ? emptyMessage : noResultsMessage;

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="w-full min-w-0 space-y-1 lg:w-64 lg:shrink-0">
          <label htmlFor={searchId} className="text-sm text-slate-600">Buscar</label>
          <Input
            id={searchId}
            type="search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-0"
          />
        </div>
      </div>
      <Card size="sm" className="min-w-0 bg-white">
        <CardContent className="min-w-0">
          {hasMobileCards ? (
            <div className="space-y-3 md:hidden">
              {visible.length ? visible.map((row) => <Fragment key={row.id}>{row.mobileContent}</Fragment>) : (
                <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
              )}
            </div>
          ) : null}
          <div className={hasMobileCards ? "hidden md:block" : undefined}>
            <Table className={tableClassName}>
              {header}
              <TableBody>
                {visible.length ? visible.map((row) => <Fragment key={row.id}>{row.content}</Fragment>) : (
                  <TableRow>
                    <TableCell colSpan={columnCount} className="py-8 text-center text-muted-foreground">{emptyText}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
