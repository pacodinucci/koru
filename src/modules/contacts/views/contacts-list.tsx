"use client";

import { useEffect } from "react";
import { useStore } from "zustand";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SOURCE_LABELS, STATUS_LABELS } from "../contacts.domain";

import { useContactsModel } from "./contacts-store-provider";
const statusVariants = { NEW: "info", READ: "muted", REPLIED: "success" } as const;
// Keep the segmented treatment local: other dashboard tabs use a panel layout.
// S3: the segmented background blends with the sidebar option tint, active options stay white.
const filterListClass = "w-fit max-w-full items-center gap-1 rounded-lg bg-[color-mix(in_srgb,var(--brand-600)_14%,white)] p-1";
const filterTriggerClass = "min-h-7 flex-none rounded-md border-0 px-2.5 py-1 text-sm text-muted-foreground data-[active]:mb-0 data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm";

export function ContactsList() {
  const params = useSearchParams();
  const query = params.toString();
  const model = useContactsModel();
  const state = useStore(model.store);
  const { page, error, updating, stale } = state;
  const selected = new URLSearchParams(state.query);

  useEffect(() => {
    model.start(window.location.search.slice(1));
    return () => model.pause();
  }, [model]);
  useEffect(() => { model.sync(query); }, [model, query]);

  return (
    <div className="min-w-0 space-y-6">
      <h1 className="text-2xl font-semibold">Contactos</h1>
      <div className="min-w-0 space-y-3">
        <div aria-label="Buscar y filtrar contactos" className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <div className="w-full min-w-0 space-y-1 lg:w-64 lg:shrink-0">
            <label htmlFor="contacts-search" className="text-sm text-slate-600">Buscar</label>
            <Input id="contacts-search" name="q" aria-label="Buscar por nombre o correo" placeholder="Buscar por nombre o correo" maxLength={200} value={state.search} onChange={(event) => model.search(event.target.value)} type="search" className="min-w-0" />
          </div>
          <div aria-label="Filtros de contactos" className="ml-auto flex max-w-full flex-wrap items-end justify-end gap-x-4 gap-y-3">
          <div className="min-w-0 space-y-1">
            <p id="contacts-source-label" className="text-sm text-slate-600">Origen</p>
            <Tabs value={selected.get("source") ?? ""} onValueChange={(value) => model.filter("source", value)}>
              <TabsList aria-labelledby="contacts-source-label" className={filterListClass}>
                <TabsTrigger value="" className={filterTriggerClass}>Todos</TabsTrigger>
                {Object.entries(SOURCE_LABELS).map(([key, label]) => <TabsTrigger key={key} value={key} className={filterTriggerClass}>{label}</TabsTrigger>)}
              </TabsList>
            </Tabs>
          </div>
          <div className="min-w-0 space-y-1">
            <p id="contacts-status-label" className="text-sm text-slate-600">Estado</p>
            <Tabs value={selected.get("status") ?? ""} onValueChange={(value) => model.filter("status", value)}>
              <TabsList aria-labelledby="contacts-status-label" className={filterListClass}>
                <TabsTrigger value="" className={filterTriggerClass}>Todos</TabsTrigger>
                {Object.entries(STATUS_LABELS).map(([key, label]) => <TabsTrigger key={key} value={key} className={filterTriggerClass}>{label}</TabsTrigger>)}
              </TabsList>
            </Tabs>
          </div>
        </div>
        </div>
        <div className="flex min-h-5 flex-wrap items-center justify-between gap-2 text-sm text-slate-600" role="status" aria-live="polite">
          <span>{page ? `${page.total} contactos${stale ? " (resultados anteriores)" : ""}` : ""}</span>
          {page && updating ? <span>Actualizando…</span> : null}
        </div>
        {error ? <div role="alert" className="space-y-2"><p>{error}</p><Button variant="outline" onClick={() => model.retry()}>Reintentar</Button></div> : null}
        {!page && !error ? <p role="status">Cargando contactos…</p> : null}
        <section aria-label="Resultados de contactos" aria-busy={updating} className="min-w-0 space-y-3">
        {page ? <>
          <div className="min-w-0 rounded-xl border border-slate-200 bg-white">
            <Table className="min-w-[840px]">
              <caption className="sr-only">Contactos recibidos, del más reciente al más antiguo</caption>
              <TableHeader>
                <TableRow>{["Nombre", "Origen", "Correo / teléfono", "Recibido", "Estado", "Detalle"].map((label) => <TableHead key={label} scope="col">{label}</TableHead>)}</TableRow>
              </TableHeader>
              <TableBody>
                {page.items.length === 0 ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-slate-600">No hay contactos para estos filtros.</TableCell></TableRow> : page.items.map((row) => (
                  <TableRow key={`${row.source}:${row.id}`}>
                    <TableCell className="font-medium text-slate-900">{row.name || "Sin nombre"}</TableCell>
                    <TableCell>{SOURCE_LABELS[row.source]}</TableCell>
                    <TableCell>{row.email}<br /><span className="text-slate-600">{row.phone || "Sin teléfono"}</span></TableCell>
                    <TableCell>{new Date(row.receivedAt).toLocaleString("es-AR")}</TableCell>
                    <TableCell><Badge variant={statusVariants[row.status]}>{STATUS_LABELS[row.status]}</Badge></TableCell>
                    <TableCell><Link className="font-medium text-slate-900 hover:underline" href={`/dashboard/contactos/${row.source}/${encodeURIComponent(row.id)}?${state.resultQuery}`}>Ver detalle<span className="sr-only"> de {row.name}</span></Link></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <nav aria-label="Páginas de contactos" className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <span>Página {page.page} de {Math.max(1, Math.ceil(page.total / page.pageSize))}</span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => model.paginate(page.page - 1)} disabled={stale || updating || state.search !== (selected.get("q") ?? "") || page.page <= 1}>Anterior</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => model.paginate(page.page + 1)} disabled={stale || updating || state.search !== (selected.get("q") ?? "") || page.page * page.pageSize >= page.total}>Siguiente</Button>
            </div>
          </nav>
        </> : null}
        </section>
      </div>
    </div>
  );
}
