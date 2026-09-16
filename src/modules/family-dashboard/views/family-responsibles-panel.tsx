"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from "@/components/ui/responsive-dialog";
import { createFamilyStudentResponsibleAction, updateFamilyResponsibleAction } from "@/modules/family-dashboard/server/family-student-record.actions";

type StudentOption = { id: string; fullName: string };
type ResponsibleItem = {
  id: string;
  studentNames: string[];
  fullName: string;
  relationship: string;
  phone: string;
  canPickup: boolean;
  emergencyContact: boolean;
  hasUser: boolean;
  isCurrentUser: boolean;
};

const initialForm = {
  studentId: "",
  fullName: "",
  relationship: "",
  phone: "",
  canPickup: false,
  emergencyContact: false,
};

export function FamilyResponsiblesPanel({
  students,
  responsibles,
}: {
  students: StudentOption[];
  responsibles: ResponsibleItem[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<ResponsibleItem | null>(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof typeof initialForm>(key: K, value: (typeof initialForm)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = editing ? await updateFamilyResponsibleAction({ id: editing.id, fullName: form.fullName, relationship: form.relationship, phone: form.phone, canPickup: form.canPickup, emergencyContact: form.emergencyContact }) : await createFamilyStudentResponsibleAction(form);
      if (!result.ok) {
        setError("Revisá los datos del responsable antes de guardar.");
        return;
      }
      setForm(initialForm);
      setEditing(null);
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Responsables</h2>
          <p className="text-xs text-slate-500">Personas vinculadas a tus hijos/as.</p>
        </div>
        <Button type="button" size="sm" onClick={() => { setEditing(null); setForm(initialForm); setError(null); setIsOpen(true); }} disabled={students.length === 0}>
          <Plus /> Agregar
        </Button>
      </div>

      {responsibles.length ? (
        <ul className="divide-y divide-slate-100">
          {responsibles.map((responsible) => (
            <li key={responsible.id} className="space-y-2 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{responsible.fullName}</p>
                  <p className="text-xs text-slate-500">{responsible.phone}</p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  {responsible.isCurrentUser ? <Badge className="bg-[var(--brand-600)]">Tu</Badge> : null}
                  <Badge variant="outline">{responsible.hasUser ? "Con usuario" : "Sin usuario"}</Badge>
                  {responsible.canPickup ? <Badge className="bg-[var(--brand-600)]">Retiro</Badge> : null}
                  {responsible.emergencyContact ? <Badge variant="secondary">Emergencia</Badge> : null}
                  <Button type="button" variant="ghost" size="icon" aria-label="Editar responsable" onClick={() => { setEditing(responsible); setForm({ studentId: "", fullName: responsible.fullName, relationship: responsible.relationship, phone: responsible.phone, canPickup: responsible.canPickup, emergencyContact: responsible.emergencyContact }); setIsOpen(true); }}><Pencil /></Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-6 text-sm text-slate-500">
          {students.length ? "Todavía no cargaste responsables adicionales." : "Registrá un alumno antes de cargar responsables."}
        </p>
      )}

      {isOpen ? (
        <ResponsiveDialog open={isOpen} onOpenChange={setIsOpen}>
          <ResponsiveDialogContent className="font-[family-name:var(--font-montserrat)] md:max-w-md">
            <form onSubmit={submit}>
              <ResponsiveDialogHeader><ResponsiveDialogTitle>{editing ? "Editar responsable" : "Agregar responsable"}</ResponsiveDialogTitle></ResponsiveDialogHeader>
              <ResponsiveDialogBody className="space-y-4">
            {!editing ? <p className="text-sm text-muted-foreground">Este responsable se vinculará a todos los hijos de la familia.</p> : null}
            <div className="space-y-1.5"><Label htmlFor="responsible-name">Nombre completo</Label><Input id="responsible-name" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} required /></div>
            <div className="space-y-1.5"><Label htmlFor="responsible-relationship">Rol en la familia</Label><select id="responsible-relationship" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={form.relationship} onChange={(event) => update("relationship", event.target.value)} required><option value="MOTHER">Madre</option><option value="FATHER">Padre</option><option value="TUTOR">Tutor/a</option><option value="GUARDIAN">Responsable</option><option value="OTHER">Otro</option></select></div>
            <div className="space-y-1.5"><Label htmlFor="responsible-phone">Teléfono</Label><Input id="responsible-phone" type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} required /></div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" checked={form.canPickup} onChange={(event) => update("canPickup", event.target.checked)} /> Está autorizado/a para retirar al aprendiz</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" checked={form.emergencyContact} onChange={(event) => update("emergencyContact", event.target.checked)} /> Es contacto de emergencia</label>
            </div>
                {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
              </ResponsiveDialogBody>
              <ResponsiveDialogFooter>
                <Button type="button" variant="secondary" onClick={() => { setIsOpen(false); setEditing(null); setForm(initialForm); }} disabled={isPending}>Cancelar</Button>
                <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : editing ? "Guardar cambios" : "Guardar responsable"}</Button>
              </ResponsiveDialogFooter>
            </form>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      ) : null}
    </section>
  );
}
