"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function FamilyConsentButton({ agreementId }: { agreementId: string }) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function consent() {
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/family/follow-up-agreements/${agreementId}/consent`, { method: "POST" });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error ?? "No pudimos registrar el consentimiento.");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos registrar el consentimiento."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-2 border-t pt-3">
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={busy} className="mt-1" />
        <span>Leí esta constancia y doy mi consentimiento en nombre de mi familia.</span>
      </label>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <Button type="button" disabled={!confirmed || busy} onClick={consent}>{busy ? "Registrando…" : "Dar consentimiento"}</Button>
    </div>
  );
}
