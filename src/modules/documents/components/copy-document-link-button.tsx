"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function CopyDocumentLinkButton({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
      setCopied(true);
      toast("Enlace copiado.", "success");
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      toast("No pudimos copiar el enlace.", "error");
    }
  }

  return (
    <Button type="button" variant="ghost" size="icon-sm" onClick={() => void copyLink()} aria-label={`Copiar enlace de ${title}`} title="Copiar enlace">
      {copied ? <Check /> : <Copy />}
    </Button>
  );
}
