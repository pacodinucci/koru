"use client";

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

export default function ContactoPage() {
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
      className="mx-auto w-full max-w-7xl px-6 py-16 md:px-10 lg:px-14"
      style={{ fontFamily: "var(--font-montserrat)" }}
    >
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl tracking-tight md:text-5xl">Contacto</h1>
        <p className="mt-3 text-black/75">Escríbenos y te responderemos a la brevedad.</p>

        <Card className="mt-8">
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

            {sent ? <p className="mt-4 text-sm text-green-700">¡Gracias! Recibimos tu mensaje.</p> : null}
            {submitError ? <p className="mt-4 text-sm text-red-700">{submitError}</p> : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
