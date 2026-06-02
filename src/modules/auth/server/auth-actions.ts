"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  getPendingUserInvitationByEmail,
  normalizeInvitationEmail,
  reconcileUserInvitationAfterSignup,
  rollbackUserCreatedDuringFailedSignup,
} from "@/modules/users/server/users.repository";

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

  redirect("/family-dashboard");
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

  const normalizedEmail = normalizeInvitationEmail(parsed.data.email);
  const invitation = await getPendingUserInvitationByEmail(normalizedEmail);

  if (!invitation) {
    redirect(
      getErrorPath(
        "/sign-up",
        "Tu email no esta autorizado para crear un usuario.",
      ),
    );
  }

  try {
    await auth.api.signUpEmail({
      headers: await headers(),
      body: {
        ...parsed.data,
        email: normalizedEmail,
      },
    });
  } catch {
    redirect(
      getErrorPath("/sign-up", "No pudimos crear el usuario. Intenta de nuevo."),
    );
  }

  try {
    await reconcileUserInvitationAfterSignup(normalizedEmail);
  } catch {
    await rollbackUserCreatedDuringFailedSignup(normalizedEmail).catch(() => {
      // If rollback fails, keep the user-facing error generic and let admins reconcile.
    });

    redirect(
      getErrorPath(
        "/sign-up",
        "No pudimos completar la creacion del usuario. Intenta de nuevo o contacta a administracion.",
      ),
    );
  }

  redirect("/family-dashboard");
}

export async function signOutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect("/sign-in");
}

