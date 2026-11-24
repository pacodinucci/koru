"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema, type ContactValues } from "@/modules/contact/contact.schema";
import { CmsPageEditableCopy } from "@/modules/cms/components/cms-page-editable-copy";
import type { LandingPreviewBindings, LandingTextMap } from "@/modules/landing/types/landing-text";

type ContactoViewProps = {
  textMap: LandingTextMap;
} & Pick<LandingPreviewBindings, "previewMode" | "selectedContentSlotId" | "onSelectContentSlot">;

export function ContactoView({ textMap, previewMode, selectedContentSlotId, onSelectContentSlot }: ContactoViewProps) {
  const editable = { page: "contacto" as const, textMap, previewMode, selectedContentSlotId, onSelectContentSlot };
  const content = (key: string, fallback: string) => textMap[key]?.trim() || fallback;
  const contactItems = [
    { label: "Dirección", value: <CmsPageEditableCopy as="span" slotId="contact.address" {...editable} /> },
    { label: "Teléfono", value: <CmsPageEditableCopy as="span" slotId="contact.phone" {...editable} />, href: "tel:+528100000000" },
    { label: "Correo", value: <CmsPageEditableCopy as="span" slotId="contact.email" {...editable} />, href: `mailto:${content("contact.email", "contacto@koruosa.com")}` },
  ];
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      nombre: "",
      email: "",
      telefono: "",
      mensaje: "",
    },
  });

  const onSubmit = async (values: ContactValues) => {
    setSent(false);
    setSubmitError(null);

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const result = (await response.json().catch(() => null)) as
      | { ok: boolean; message?: string }
      | null;

    if (!response.ok || !result?.ok) {
      setSubmitError(result?.message ?? "No pudimos enviar tu mensaje.");
      return;
    }

    setSent(true);
    form.reset();
  };

  const fieldClassName = "h-11 rounded-none border-0 border-b border-black/50 bg-transparent px-0 shadow-none focus-visible:border-[var(--complement-800)] focus-visible:ring-0";

  return (
    <main
      className="mx-auto w-full max-w-7xl px-6 py-12 md:px-10 md:py-16 lg:px-14 lg:py-20"
      style={{ fontFamily: "var(--font-montserrat)" }}
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] lg:gap-14 xl:gap-20">
        <section aria-labelledby="contact-heading" className="min-w-0">
          <h1 id="contact-heading" className="text-4xl leading-tight tracking-tight md:text-5xl" style={{ fontFamily: "var(--font-roboto-condensed)" }}>
            <CmsPageEditableCopy as="span" slotId="contact.title" {...editable} />
          </h1>

          <dl className="mt-6 space-y-3 text-sm md:text-base">
            {contactItems.map((item) => (
              <div key={item.label} className="grid gap-1 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-4">
                <dt className="font-medium text-[var(--complement-800)]">{item.label}</dt>
                <dd className="min-w-0 break-words text-black/75">
                  {item.href ? (
                    <a href={item.href} className="underline decoration-black/20 underline-offset-4 transition hover:decoration-black/70">
                      {item.value}
                    </a>
                  ) : item.value}
                </dd>
              </div>
            ))}
          </dl>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-12 grid gap-x-7 gap-y-7 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" placeholder="Tu nombre" className={fieldClassName} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono (opcional)</FormLabel>
                    <FormControl>
                      <Input type="tel" autoComplete="tel" placeholder="+52 ..." className={fieldClassName} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" placeholder="tu@ejemplo.com" className={fieldClassName} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mensaje"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Escribe un mensaje</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="¿En qué te podemos ayudar?"
                        className="min-h-28 resize-y rounded-none border-0 border-b border-black/50 bg-transparent px-0 py-3 shadow-none focus-visible:border-[var(--complement-800)] focus-visible:ring-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
                <Button type="submit" disabled={form.formState.isSubmitting} className="h-11 rounded-full px-7">
                  {form.formState.isSubmitting ? "Enviando..." : "Enviar mensaje"}
                </Button>
                <a
                  href={`mailto:${content("contact.email", "contacto@koruosa.com")}`}
                  className="text-sm text-[var(--complement-800)] underline underline-offset-4 transition hover:text-[var(--complement-900)]"
                >
                  <CmsPageEditableCopy as="span" slotId="contact.directEmailCta" {...editable} />
                </a>
              </div>
            </form>
          </Form>
          <div aria-live="polite">
            {sent ? <p className="mt-5 text-sm text-green-700">¡Gracias! Recibimos tu mensaje.</p> : null}
            {submitError ? <p className="mt-5 text-sm text-red-700">{submitError}</p> : null}
          </div>
        </section>

        <aside aria-label="Bolsa de trabajo" className="border-t border-black/25 pt-10 lg:mt-28 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0 xl:pl-16">
          <Link
            href="/unete-al-equipo"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--complement-800)] px-6 py-3 text-base font-medium text-[var(--complement-800)] transition hover:bg-[var(--complement-800)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--complement-800)]"
          >
            <CmsPageEditableCopy as="span" slotId="contact.teamCta" {...editable} />
          </Link>
          <h2 className="mt-8 text-2xl leading-tight tracking-tight md:text-3xl" style={{ fontFamily: "var(--font-roboto-condensed)" }}>
            Crezcamos juntos
          </h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-black/70">
            ¿Te gustaría ser parte de KORU? Déjanos tu CV para nuestra bolsa de trabajo y cuéntanos cómo te gustaría sumarte al equipo.
          </p>
        </aside>
      </div>
    </main>
  );
}
