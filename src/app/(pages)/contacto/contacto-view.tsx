"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
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

  return (
    <main
      className="mx-auto w-full max-w-7xl px-6 pb-16 pt-10 md:px-10 md:pt-12 lg:px-14 lg:pt-12"
      style={{ fontFamily: "var(--font-montserrat)" }}
    >
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <section className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:block">
            <h1 className="max-w-sm text-4xl leading-[0.95] tracking-tight md:text-5xl">
              <CmsPageEditableCopy as="span" slotId="contact.title" {...editable} />
            </h1>
            <Link
              href="/unete-al-equipo"
              className="inline-flex w-fit items-center rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5 lg:mt-6"
            >
              <CmsPageEditableCopy as="span" slotId="contact.teamCta" {...editable} />
            </Link>
          </div>

          <dl className="space-y-4">
            {contactItems.map((item, index) => (
              <div
                key={item.label}
                className={`rounded-2xl px-5 py-4 ${
                  index % 2 === 0 ? "bg-[#f7f6f1]" : "bg-[#f7f0e5]"
                }`}
              >
                <dt className="font-semibold text-[var(--complement-800)]">{item.label}</dt>
                <dd className="mt-1 text-base text-black/75 md:text-lg">
                  {item.href ? (
                    <a href={item.href} className="underline underline-offset-4">
                      {item.value}
                    </a>
                  ) : (
                    item.value
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <a
            href={`mailto:${content("contact.email", "contacto@koruosa.com")}`}
            className="inline-flex text-base font-medium text-[var(--complement-800)] underline underline-offset-4 transition hover:text-[var(--complement-900)]"
          >
            <CmsPageEditableCopy as="span" slotId="contact.directEmailCta" {...editable} />
          </a>
        </section>

        <section className="lg:pt-24">
          <Card>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu nombre" {...field} />
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
                          <Input type="email" placeholder="tu@ejemplo.com" {...field} />
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
                          <Input placeholder="+52 ..." {...field} />
                        </FormControl>
                        <FormDescription>Solo si prefieres que te llamemos.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mensaje"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensaje</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="¿En qué te podemos ayudar?"
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    Enviar
                  </Button>
                </form>
              </Form>

              {sent ? (
                <p className="mt-4 text-sm text-green-700">
                  ¡Gracias! Recibimos tu mensaje.
                </p>
              ) : null}
              {submitError ? <p className="mt-4 text-sm text-red-700">{submitError}</p> : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
