"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { convertCandidateFamilyAction, type CreateFamilyState } from "@/modules/families/server/families.actions";

const initialState: CreateFamilyState = { status: "idle", message: null };
function ConvertButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="sm" variant="outline" disabled={pending}>{pending ? "Convirtiendo…" : "Convertir en familia"}</Button>;
}

export function ConvertCandidateFamily({ familyId }: { familyId: string }) {
  const [state, action] = useActionState(convertCandidateFamilyAction, initialState);
  return <form action={action} className="grid gap-2">
    <input type="hidden" name="familyId" value={familyId} />
    {state.status !== "success" && <ConvertButton />}
    {state.message && <p className="max-w-64 text-sm" role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
  </form>;
}
