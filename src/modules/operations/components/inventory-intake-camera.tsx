"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { canvasJpeg } from "@/modules/operations/components/inventory-intake-files";

function cameraError(cause: unknown): string {
  const name = cause instanceof Error ? cause.name : (cause as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError") return "No hay permiso para usar la cámara. Habilitalo en el navegador o usá una alternativa.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No se encontró una cámara disponible. Podés elegir un archivo.";
  if (name === "NotReadableError") return "La cámara está ocupada o no se puede abrir. Cerrá otras aplicaciones o elegí un archivo.";
  return "No se pudo abrir la cámara. Usá la captura nativa o elegí un archivo.";
}

export function InventoryIntakeCamera({ active, onCapture, onCancel, onChooseFile }: {
  active: boolean;
  onCapture: (file: File) => void | Promise<void>;
  onCancel: () => void;
  onChooseFile: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const native = useRef<HTMLInputElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const capturing = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  function stop() {
    generation.current += 1;
    const current = stream.current;
    stream.current = null;
    current?.getTracks().forEach((track) => track.stop());
    if (video.current) video.current.srcObject = null;
  }

  useEffect(() => {
    if (!active) return;
    const request = ++generation.current;
    setStatus("loading");
    setError("");
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("La cámara en vivo requiere HTTPS y un navegador compatible. Usá la captura nativa o elegí un archivo.");
      setStatus("error");
      return stop;
    }
    void navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false }).then((media) => {
      if (request !== generation.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      if (video.current) video.current.srcObject = media;
      setStatus("ready");
    }).catch((cause: unknown) => {
      if (request !== generation.current) return;
      setError(cameraError(cause));
      setStatus("error");
    });
    return stop;
  }, [active]);

  async function capture() {
    if (capturing.current || status !== "ready") return;
    const element = video.current;
    if (!element?.videoWidth || !element.videoHeight) {
      setError("La cámara todavía no está lista. Esperá la vista previa e intentá de nuevo.");
      return;
    }
    capturing.current = true;
    const request = generation.current;
    try {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 2400 / Math.max(element.videoWidth, element.videoHeight));
      canvas.width = Math.round(element.videoWidth * scale);
      canvas.height = Math.round(element.videoHeight * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No se pudo capturar la foto. Usá la captura nativa o elegí un archivo.");
      context.drawImage(element, 0, 0, canvas.width, canvas.height);
      const blob = await canvasJpeg(canvas, 0.92);
      if (request !== generation.current) return;
      stop();
      setStatus("loading");
      await onCapture(new File([blob], "foto-ingreso.jpg", { type: "image/jpeg" }));
    } catch (cause) {
      if (request === generation.current) setError(cause instanceof Error ? cause.message : "No se pudo capturar la foto.");
    } finally {
      capturing.current = false;
    }
  }

  if (!active) return null;
  return <section className="grid gap-3" aria-label="Cámara del ingreso">
    <video ref={video} autoPlay muted playsInline className="max-h-80 w-full rounded bg-slate-950" aria-label="Vista previa de la cámara" />
    {status === "loading" ? <p role="status">Abriendo cámara…</p> : null}
    {error ? <p role="alert" className="text-sm text-amber-800">{error}</p> : null}
    <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={status !== "ready"} onClick={capture}>Capturar foto</Button>
      <Button type="button" variant="outline" onClick={() => { stop(); onCancel(); }}>Cancelar cámara</Button>
      <Button type="button" variant="outline" onClick={() => { stop(); native.current?.click(); }}>Usar cámara nativa del dispositivo</Button>
      <Button type="button" variant="outline" onClick={() => { stop(); onChooseFile(); }}>Elegir archivo en este dispositivo</Button>
    </div>
    <input ref={native} type="file" className="sr-only" tabIndex={-1} aria-label="Captura nativa alternativa" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" onChange={async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) { stop(); await onCapture(file); }
    }} />
  </section>;
}
