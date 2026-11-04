"use client";

import { LinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function BlogCopyLinkButton({ slug }: { slug: string }) {
  const { toast } = useToast();

  async function copyLink() {
    try {
      const url = new URL(`/blog/${encodeURIComponent(slug)}`, window.location.origin);
      url.searchParams.set("share", crypto.randomUUID());
      await navigator.clipboard.writeText(url.toString());
      toast("Enlace copiado.", "success");
    } catch {
      toast("No pudimos copiar el enlace.", "error");
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={copyLink}
      aria-label="Copiar enlace del post"
      title="Copiar enlace para WhatsApp"
    >
      <LinkIcon aria-hidden="true" />
    </Button>
  );
}
