"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { instrumentKindLabels, type PsychopedagogyProfileDTO } from "../lib/profile-contract";

export function PsychopedagogyInstrumentTable({ profile }: { profile: PsychopedagogyProfileDTO }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = profile.instruments.find((entry) => entry.id === selectedId);
  if (selected) {
    const date = selected.entryDate.slice(0, 10);
    return <article className="space-y-4 px-6 py-4" aria-label={selected.name}>
      <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId(null)}>Volver a la tabla</Button>
      <h3 className="break-words font-semibold text-primary">{selected.name}</h3>
      <dl className="space-y-4">
        <div><dt className="text-sm font-medium">Fecha</dt><dd className="text-sm text-muted-foreground"><time dateTime={date}>{date.split("-").reverse().join("/")}</time></dd></div>
        <div><dt className="text-sm font-medium">Tipo</dt><dd className="text-sm text-slate-700">{selected.kind ? instrumentKindLabels[selected.kind] : "Sin clasificar"}</dd></div>
        <div><dt className="text-sm font-medium">Texto</dt><dd className="whitespace-pre-wrap break-words text-sm text-slate-700">{selected.body}</dd></div>
      </dl>
    </article>;
  }
  return <div className="mx-6 min-w-0 overflow-x-auto bg-background">
    <Table className="w-full table-fixed">
      <caption className="sr-only">Instrumentos del alumno</caption>
      <TableHeader><TableRow><TableHead className="w-28">Fecha</TableHead><TableHead className="w-32">Tipo</TableHead><TableHead>Nombre</TableHead></TableRow></TableHeader>
      <TableBody>
        {profile.instruments.length ? profile.instruments.map((entry) => {
          const date = entry.entryDate.slice(0, 10);
          return <TableRow key={entry.id}>
            <TableCell className="align-top"><time dateTime={date}>{date.split("-").reverse().join("/")}</time></TableCell>
            <TableCell className="whitespace-normal break-words align-top">{entry.kind ? instrumentKindLabels[entry.kind] : "Sin clasificar"}</TableCell>
            <TableCell className="whitespace-pre-wrap break-words align-top font-medium">
              <button type="button" className="text-left text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring" onClick={() => setSelectedId(entry.id)}>{entry.name}</button>
            </TableCell>
          </TableRow>;
        }) : <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Todavía no hay instrumentos registrados.</TableCell></TableRow>}
      </TableBody>
    </Table>
  </div>;
}
