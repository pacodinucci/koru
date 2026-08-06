"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type SubmitState = "idle" | "sending" | "sent" | "error";

type CvUploadResult =
  | { ok: true; url: string }
  | { ok: false; error?: string };

const MAX_CV_SIZE = 10 * 1024 * 1024;
const ALLOWED_CV_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function validateCv(file: File | null) {
  if (!file) return "Adjuntá tu CV en PDF, DOC o DOCX.";

  if (!ALLOWED_CV_TYPES.has(file.type)) {
    return "El CV debe ser un archivo PDF, DOC o DOCX.";
  }

  if (file.size > MAX_CV_SIZE) {
    return "El CV no puede superar los 10MB.";
  }

  return null;
}

async function uploadCv(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/uploads/team-cv", {
    method: "POST",
    body: formData,
  });

  const result = (await response.json().catch(() => null)) as CvUploadResult | null;

  if (!response.ok || !result?.ok) {
    const message = result && !result.ok ? result.error : undefined;
    throw new Error(message ?? "No pudimos subir el CV.");
  }

  return result.url;
}

export function TeamApplicationForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const nombre = String(formData.get("nombre") ?? "");
    const email = String(formData.get("email") ?? "");
    const telefono = String(formData.get("telefono") ?? "");
    const area = String(formData.get("area") ?? "");
    const mensaje = String(formData.get("mensaje") ?? "");
    const cv = formData.get("cv");
    const cvFile = cv instanceof File && cv.size > 0 ? cv : null;
    const cvError = validateCv(cvFile);

    if (cvError || !cvFile) {
      setState("error");
      setError(cvError);
      return;
    }

    let cvUrl: string;

    try {
      cvUrl = await uploadCv(cvFile);
    } catch (uploadError) {
      setState("error");
      setError(uploadError instanceof Error ? uploadError.message : "No pudimos subir el CV.");
      return;
    }

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        email,
        telefono,
        mensaje: `Postulación para unirse al equipo KORU.

Área de interés: ${area || "No especificada"}
CV: ${cvUrl}

${mensaje}`,
      }),
    });

    const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;

    if (!response.ok || !result?.ok) {
      setState("error");
      setError(result?.message ?? "No pudimos enviar tu mensaje.");
      return;
    }

    form.reset();
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
      <label className="grid gap-2 text-sm text-black/70">
        <span className="font-medium text-black">CV</span>
        <input
          name="cv"
          type="file"
          required
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-black/5 file:px-3 file:py-1.5 file:text-sm file:font-medium focus:border-black/40"
        />
        <span>Adjuntá tu CV en PDF, DOC o DOCX. Máximo 10MB.</span>
      </label>
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
