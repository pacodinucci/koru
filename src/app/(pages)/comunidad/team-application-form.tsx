"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type SubmitState = "idle" | "sending" | "sent" | "error";

export function TeamApplicationForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError(null);

    const formData = new FormData(event.currentTarget);
    const nombre = String(formData.get("nombre") ?? "");
    const email = String(formData.get("email") ?? "");
    const telefono = String(formData.get("telefono") ?? "");
    const area = String(formData.get("area") ?? "");
    const mensaje = String(formData.get("mensaje") ?? "");

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        email,
        telefono,
        mensaje: `Postulación para unirse al equipo KORU.\n\nÁrea de interés: ${area || "No especificada"}\n\n${mensaje}`,
      }),
    });

    const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;

    if (!response.ok || !result?.ok) {
      setState("error");
      setError(result?.message ?? "No pudimos enviar tu mensaje.");
      return;
    }

    event.currentTarget.reset();
    setState("sent");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-black/10 bg-white/70 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="nombre"
          required
          placeholder="Nombre"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/40"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Correo electrónico"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/40"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="telefono"
          placeholder="Teléfono"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/40"
        />
        <input
          name="area"
          placeholder="Área de interés"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/40"
        />
      </div>
      <textarea
        name="mensaje"
        required
        placeholder="Contanos brevemente sobre tu experiencia y por qué querés sumarte."
        className="min-h-28 rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/40"
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="inline-flex w-fit items-center rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "sending" ? "Enviando..." : "Enviar postulación"}
      </button>
      {state === "sent" ? <p className="text-sm text-green-700">¡Gracias! Recibimos tu mensaje.</p> : null}
      {state === "error" ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
