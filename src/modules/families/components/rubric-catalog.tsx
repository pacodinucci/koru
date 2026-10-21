"use client";

import { PencilIcon, PlusIcon } from "lucide-react";
import { useActionState, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createBillingRubricAction, updateBillingRubricAction } from "@/modules/families/server/rubrics.actions";

export type RubricCatalogItem = { id: string; name: string; amount: string; isActive: boolean };

const initialState = { message: null as string | null };
const currency = (amount: string) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(amount));
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-AR").trim();

function RubricForm({ rubric }: { rubric?: RubricCatalogItem }) {
  const [state, formAction, pending] = useActionState(rubric ? updateBillingRubricAction : createBillingRubricAction, initialState);

  return (
    <form action={formAction} aria-label={rubric ? `Editar ${rubric.name}` : "Crear rubro"} aria-busy={pending} className="space-y-4">
      {rubric ? <input type="hidden" name="rubricId" value={rubric.id} /> : null}
      <fieldset disabled={pending} className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">Nombre del rubro
          <Input name="name" defaultValue={rubric?.name ?? ""} minLength={2} maxLength={120} placeholder="Ej.: Materiales" required autoFocus />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">Importe total
          <Input name="amount" type="number" defaultValue={rubric?.amount ?? ""} min="0.01" step="0.01" placeholder="0,00" required />
        </label>
      </fieldset>
      {state.message ? <p role="status" className="text-sm text-slate-700">{state.message}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Guardando..." : rubric ? "Guardar cambios" : "Crear rubro"}</Button>
    </form>
  );
}

function RubricDialog({ rubric }: { rubric?: RubricCatalogItem }) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger render={rubric
        ? <Button type="button" variant="ghost" size="icon-sm" aria-label={`Editar ${rubric.name}`} />
        : <Button type="button" className="w-full sm:w-auto" />}>
        {rubric ? <PencilIcon /> : <><PlusIcon />Nuevo rubro</>}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="font-montserrat md:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle style={{ fontFamily: "var(--font-montserrat)" }}>{rubric ? "Editar rubro" : "Nuevo rubro"}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Cargá el nombre y el importe total. Las cuotas y el mes se eligen al asignarlo a un alumno.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>{open ? <RubricForm rubric={rubric} /> : null}</ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export function RubricCatalog({ rubrics, canManage }: { rubrics: RubricCatalogItem[]; canManage: boolean }) {
  const [search, setSearch] = useState("");
  const query = normalize(search);
  const filteredRubrics = query ? rubrics.filter((rubric) => normalize(rubric.name).includes(query)) : rubrics;

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input type="search" aria-label="Buscar rubros por nombre" placeholder="Buscar rubro por nombre" value={search} onChange={(event) => setSearch(event.target.value)} className="sm:max-w-sm" />
        {canManage ? <RubricDialog /> : null}
      </div>
      <p className="text-sm text-slate-600">El catálogo define el importe total. Las cuotas y el mes se eligen al agregar cada rubro a un alumno. Los cambios no modifican las asignaciones existentes.</p>
      <div className="min-w-0 rounded-xl border border-slate-200">
        <Table aria-label="Rubros" className="min-w-[560px]">
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Importe total</TableHead>
              <TableHead>Estado</TableHead>
              {canManage ? <TableHead className="w-16 text-right"><span className="sr-only">Acciones</span></TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRubrics.map((rubric) => (
              <TableRow key={rubric.id}>
                <TableCell className="font-medium">{rubric.name}</TableCell>
                <TableCell>{currency(rubric.amount)}</TableCell>
                <TableCell><Badge variant={rubric.isActive ? "success" : "muted"}>{rubric.isActive ? "Activo" : "Inactivo"}</Badge></TableCell>
                {canManage ? <TableCell className="text-right"><RubricDialog rubric={rubric} /></TableCell> : null}
              </TableRow>
            ))}
            {!filteredRubrics.length ? <TableRow><TableCell colSpan={canManage ? 4 : 3} className="py-10 text-center text-slate-600">{rubrics.length ? "No encontramos rubros con ese nombre." : "Todavía no hay rubros cargados."}</TableCell></TableRow> : null}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-slate-600" role="status">{filteredRubrics.length} de {rubrics.length} rubros</p>
    </div>
  );
}
