"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function CashExpenseAttachmentUpload({ reportId }: { reportId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setMessage("Subiendo…");
    const data = new FormData(); data.set("reportId", reportId); data.set("file", file);
    const response = await fetch("/api/uploads/cash-expense-attachments", { method: "POST", body: data });
    const result = await response.json() as { ok: boolean; error?: string };
    setMessage(result.ok ? "Adjunto agregado." : result.error ?? "No se pudo adjuntar.");
    if (result.ok) { if (inputRef.current) inputRef.current.value = ""; router.refresh(); }
  }
  return <div className="flex items-center gap-2"><input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="max-w-48 text-xs" /><Button type="button" size="sm" variant="outline" onClick={upload}>Adjuntar</Button>{message ? <span className="text-xs text-slate-500">{message}</span> : null}</div>;
}