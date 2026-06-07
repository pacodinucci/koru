"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useToast } from "@/components/ui/toast";

type BlogEventToastProps = {
  ok?: string;
  error?: string;
  comment?: string;
};

export function BlogEventToast({ ok, error, comment }: BlogEventToastProps) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (ok) {
      toast(ok, "success");
    }

    if (error) {
      toast(error, "error");
    }

    if (comment === "ok") {
      toast("Comentario publicado correctamente.", "success");
    }

    if (comment === "error") {
      toast("No pudimos enviar tu comentario. Revisá los datos.", "error");
    }

    if (!ok && !error && !comment) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("ok");
    params.delete("error");
    params.delete("comment");

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [comment, error, ok, pathname, router, searchParams, toast]);

  return null;
}
