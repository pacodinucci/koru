"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signUpSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
});

function getErrorPath(basePath: string, message: string) {
  const params = new URLSearchParams({ error: message });
  return `${basePath}?${params.toString()}`;
}

export async function signInAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(getErrorPath("/sign-in", "Datos de acceso invalidos."));
  }

  try {
    await auth.api.signInEmail({
      headers: await headers(),
      body: parsed.data,
    });
  } catch {
    redirect(getErrorPath("/sign-in", "Email o password incorrectos."));
  }

  redirect("/admin");
}

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(getErrorPath("/sign-up", "Revisa los datos del formulario."));
  }

  try {
    await auth.api.signUpEmail({
      headers: await headers(),
      body: parsed.data,
    });
  } catch {
    redirect(
      getErrorPath("/sign-up", "No pudimos crear el usuario. Intenta de nuevo."),
    );
  }

  redirect("/admin");
}

export async function signOutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect("/sign-in");
}
