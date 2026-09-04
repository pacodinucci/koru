"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveFamilyProfileAction } from "@/modules/family-dashboard/server/family-profile.actions";

type Profile = { streetAndNumber: string; neighborhood: string; cityAndState: string; postalCode: string };

export function FamilyProfileForm({ initialProfile }: { initialProfile: Profile }) {
  const [form, setForm] = useState(initialProfile);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const update = (key: keyof Profile, value: string) => setForm((current) => ({ ...current, [key]: value }));

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveFamilyProfileAction(form);
      setMessage(result.ok ? "Datos guardados." : "No pudimos guardar los datos.");
    });
  }

  return (
    <form onSubmit={submit} className="w-full max-w-xl space-y-4">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-lg font-semibold text-slate-900">Tu perfil familiar</h1>
        <p className="mt-1 text-sm text-slate-500">Este domicilio se autocompleta al registrar a un hijo y siempre puede modificarse en su ficha.</p>
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5"><Label htmlFor="street">Calle y número</Label><Input id="street" value={form.streetAndNumber} onChange={(event) => update("streetAndNumber", event.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="neighborhood">Barrio / localidad</Label><Input id="neighborhood" value={form.neighborhood} onChange={(event) => update("neighborhood", event.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="city">Municipio y provincia</Label><Input id="city" value={form.cityAndState} onChange={(event) => update("cityAndState", event.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="postal-code">Código postal</Label><Input id="postal-code" value={form.postalCode} onChange={(event) => update("postalCode", event.target.value)} /></div>
      </div>
      {message ? <p className="text-sm text-muted-foreground" role="status">{message}</p> : null}
      <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Guardar datos"}</Button>
    </form>
  );
}