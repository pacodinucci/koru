"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PsychopedagogyProfileDTO } from "../lib/profile-contract";

export function PsychopedagogyFollowupTable({ profile, tab }: {
  profile: PsychopedagogyProfileDTO;
  tab: "observations" | "accompaniments";
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const accompaniments = tab === "accompaniments";
  const entries = accompaniments ? profile.accompaniments : profile.observations;
  const selected = entries.find((entry) => entry.id === selectedId);
  if (selected) {
    const date = selected.entryDate.slice(0, 10);
    return <article className="space-y-4 px-6 py-4" aria-label={selected.title}>
      <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId(null)}>Volver a la tabla</Button>
      <div className="space-y-1">
        <h3 className="break-words font-semibold text-primary">{selected.title}</h3>
        <p className="text-sm text-muted-foreground"><time dateTime={date}>{date.split("-").reverse().join("/")}</time>
          {"kind" in selected ? ` · ${selected.kind === "FAMILY" ? "Familiar" : "Individual"}` : null}
        </p>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm">{selected.body}</p>
    </article>;
  }
  return <div className="mx-6 min-w-0 overflow-x-auto bg-background">
    <Table className="w-full table-fixed">
      <caption className="sr-only">{accompaniments ? "Acompañamientos del alumno" : "Bitácoras de observación del alumno"}</caption>
      <TableHeader><TableRow>
        <TableHead className="w-28">Fecha</TableHead>
        {accompaniments ? <TableHead className="w-28">Tipo</TableHead> : null}
        <TableHead>Título</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {entries.length ? entries.map((entry) => {
          const date = entry.entryDate.slice(0, 10);
          return <TableRow key={entry.id}>
            <TableCell className="align-top"><time dateTime={date}>{date.split("-").reverse().join("/")}</time></TableCell>
            {accompaniments ? <TableCell className="align-top">{"kind" in entry && entry.kind === "FAMILY" ? "Familiar" : "Individual"}</TableCell> : null}
            <TableCell className="whitespace-pre-wrap break-words align-top font-medium">
              <button type="button" className="text-left text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring" onClick={() => setSelectedId(entry.id)}>{entry.title}</button>
            </TableCell>
          </TableRow>;
        }) : <TableRow><TableCell colSpan={accompaniments ? 3 : 2} className="py-8 text-center text-muted-foreground">
          {accompaniments ? "Todavía no hay acompañamientos registrados." : "Este alumno todavía no tiene observaciones."}
        </TableCell></TableRow>}
      </TableBody>
    </Table>
  </div>;
}
