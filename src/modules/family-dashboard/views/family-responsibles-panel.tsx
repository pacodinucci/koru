"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFamilyStudentResponsibleAction } from "@/modules/family-dashboard/server/family-student-record.actions";

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
      const result = await createFamilyStudentResponsibleAction(form);
      if (!result.ok) {
        setError("Revisá los datos del responsable antes de guardar.");
        return;
      }
      setForm(initialForm);
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
        <Button type="button" size="sm" onClick={() => setIsOpen(true)} disabled={students.length === 0}>
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
                  <p className="text-xs text-slate-500">{responsible.relationship} · {responsible.studentNames.join(", ")}</p>
                  <p className="text-xs text-slate-500">{responsible.phone}</p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  {responsible.isCurrentUser ? <Badge className="bg-[var(--brand-600)]">Tu</Badge> : null}
                  <Badge variant="outline">{responsible.hasUser ? "Con usuario" : "Sin usuario"}</Badge>
                  {responsible.canPickup ? <Badge className="bg-[var(--brand-600)]">Retiro</Badge> : null}
                  {responsible.emergencyContact ? <Badge variant="secondary">Emergencia</Badge> : null}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="responsible-dialog-title">
          <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div>
              <h3 id="responsible-dialog-title" className="text-lg font-semibold text-slate-900">Agregar responsable</h3>
              <p className="mt-1 text-sm text-slate-500">No se crea una cuenta de usuario para esta persona.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="responsible-student">Aprendiz</Label>
              <select id="responsible-student" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={form.studentId} onChange={(event) => update("studentId", event.target.value)} required>
                <option value="">Seleccioná un aprendiz</option>
                {students.map((student) => <option key={student.id} value={student.id}>{student.fullName}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="responsible-name">Nombre completo</Label><Input id="responsible-name" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} required /></div>
            <div className="space-y-1.5"><Label htmlFor="responsible-relationship">Parentesco o vínculo</Label><Input id="responsible-relationship" value={form.relationship} onChange={(event) => update("relationship", event.target.value)} required /></div>
            <div className="space-y-1.5"><Label htmlFor="responsible-phone">Teléfono</Label><Input id="responsible-phone" type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} required /></div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" checked={form.canPickup} onChange={(event) => update("canPickup", event.target.checked)} /> Está autorizado/a para retirar al aprendiz</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" checked={form.emergencyContact} onChange={(event) => update("emergencyContact", event.target.checked)} /> Es contacto de emergencia</label>
            </div>
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} disabled={isPending}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Guardar responsable"}</Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
