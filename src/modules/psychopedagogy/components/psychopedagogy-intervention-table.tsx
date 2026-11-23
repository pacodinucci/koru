"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PsychopedagogyProfileDTO } from "../lib/profile-contract";
import { interventionFields } from "./psychopedagogy-profile-fields";

export function PsychopedagogyInterventionTable({ profile }: { profile: PsychopedagogyProfileDTO }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = profile.interventions.find((entry) => entry.id === selectedId);
  if (selected) {
    const date = selected.entryDate.slice(0, 10);
    return <article className="space-y-4 px-6 py-4" aria-label={selected.title}>
      <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId(null)}>Volver a la tabla</Button>
      <div className="space-y-1">
        <h3 className="break-words font-semibold text-primary">{selected.title}</h3>
        <p className="text-sm text-muted-foreground"><time dateTime={date}>{date.split("-").reverse().join("/")}</time></p>
      </div>
      <h4 className="font-semibold">Informe psicopedagógico</h4>
      <dl className="space-y-4">{interventionFields.map(([name, label]) => <div key={name}>
        <dt className="text-sm font-medium">{label}</dt>
        <dd className="whitespace-pre-wrap break-words text-sm text-slate-700">{selected[name]}</dd>
      </div>)}</dl>
    </article>;
  }
  return <div className="mx-6 min-w-0 overflow-x-auto bg-background">
    <Table className="w-full table-fixed">
      <caption className="sr-only">Intervenciones del alumno</caption>
      <TableHeader><TableRow><TableHead className="w-28">Fecha</TableHead><TableHead>Título</TableHead></TableRow></TableHeader>
      <TableBody>
        {profile.interventions.length ? profile.interventions.map((entry) => {
          const date = entry.entryDate.slice(0, 10);
          return <TableRow key={entry.id}>
            <TableCell className="align-top"><time dateTime={date}>{date.split("-").reverse().join("/")}</time></TableCell>
            <TableCell className="whitespace-pre-wrap break-words align-top font-medium">
              <button type="button" className="text-left text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring" onClick={() => setSelectedId(entry.id)}>{entry.title}</button>
            </TableCell>
          </TableRow>;
        }) : <TableRow><TableCell colSpan={2} className="py-8 text-center text-muted-foreground">Todavía no hay intervenciones registradas.</TableCell></TableRow>}
      </TableBody>
    </Table>
  </div>;
}
