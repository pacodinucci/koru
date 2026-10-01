"use client";

import { useState } from "react";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import type { FamilyResponsibleItem } from "@/modules/families/lib/family-responsibles";

export type FamilyResponsibleDetails = Pick<
  FamilyResponsibleItem,
  "id" | "fullName" | "relationship" | "phone" | "studentNames" | "canPickup" | "emergencyContact" | "hasUser" | "source"
>;

const relationshipLabels: Record<string, string> = {
  MOTHER: "Madre",
  FATHER: "Padre",
  TUTOR: "Tutor/a",
  GUARDIAN: "Responsable",
  OTHER: "Otro",
};

function relationshipLabel(relationship: string) {
  return relationshipLabels[relationship] ?? "Parentesco no especificado";
}

export function FamilyResponsiblesList({ responsibles }: { responsibles: FamilyResponsibleDetails[] }) {
  const [selected, setSelected] = useState<FamilyResponsibleDetails | null>(null);

  if (!responsibles.length) {
    return <p className="text-sm text-slate-600">Todavía no hay responsables registrados.</p>;
  }

  return (
    <>
      <ul className="space-y-2">
        {responsibles.map((responsible) => (
          <li key={responsible.id}>
            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 p-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => setSelected(responsible)}
            >
              <span className="block font-medium">{responsible.fullName}</span>
              <span className="block text-sm text-slate-600">{relationshipLabel(responsible.relationship)}</span>
            </button>
          </li>
        ))}
      </ul>

      <ResponsiveDialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <ResponsiveDialogContent className="font-montserrat md:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle style={{ fontFamily: "var(--font-montserrat)" }}>{selected?.fullName}</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          {selected ? (
            <ResponsiveDialogBody>
              <dl className="space-y-4 text-sm">
                <div><dt className="font-medium text-slate-600">Parentesco</dt><dd>{relationshipLabel(selected.relationship)}</dd></div>
                <div><dt className="font-medium text-slate-600">Teléfono</dt><dd>{selected.phone}</dd></div>
                <div><dt className="font-medium text-slate-600">Hij@s vinculados</dt><dd>{selected.studentNames.length ? selected.studentNames.join(", ") : "Sin hij@s vinculados"}</dd></div>
                <div><dt className="font-medium text-slate-600">Puede retirarlos</dt><dd>{selected.source === "family-user" ? "No informado" : selected.canPickup ? "Sí" : "No"}</dd></div>
                <div><dt className="font-medium text-slate-600">Contacto de emergencia</dt><dd>{selected.source === "family-user" ? "No informado" : selected.emergencyContact ? "Sí" : "No"}</dd></div>
                <div><dt className="font-medium text-slate-600">Usuario vinculado</dt><dd>{selected.hasUser ? "Sí" : "No"}</dd></div>
              </dl>
            </ResponsiveDialogBody>
          ) : null}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
