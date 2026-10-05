"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { deletePlanAction } from "@/modules/families/server/plans.actions";

type PlanToDelete = { id: string; name: string };

export function PlanDeleteDialog({ plan, onClose, onDeleted }: {
  plan: PlanToDelete;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await deletePlanAction(plan.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onDeleted();
    } catch {
      setError("No pudimos eliminar el plan. Intentá nuevamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <ResponsiveDialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <ResponsiveDialogContent showCloseButton={!pending} className="md:w-[min(calc(100vw-2rem),28rem)] [font-family:var(--font-montserrat)] [&_*]:[font-family:var(--font-montserrat)]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Eliminar plan</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Esta acción no se puede deshacer.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-3">
          <p>Vas a eliminar definitivamente el plan <strong>{plan.name}</strong> y sus rubros. Si está asignado o alguno de sus rubros tiene cargos o cuotas programadas, no se eliminará.</p>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancelar</Button>
          <Button type="button" variant="destructive" disabled={pending} onClick={() => void confirmDelete()}>{pending ? "Eliminando…" : "Eliminar definitivamente"}</Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
