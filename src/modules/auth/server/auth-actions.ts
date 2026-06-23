"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
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

const signUpSchema = z
  .object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

function getErrorPath(basePath: string, message: string) {
  const params = new URLSearchParams({ error: message });
  return `${basePath}?${params.toString()}`;
}

async function getPostAuthRedirect(email: string) {
  const normalizedEmail = normalizeInvitationEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { role: true },
  });

  if (user?.role === "ADMIN" || user?.role === "TEACHER") {
    return "/dashboard";
  }

  return "/family-dashboard";
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

  redirect(await getPostAuthRedirect(parsed.data.email));
}

export async function signInGoogleAction() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    redirect(getErrorPath("/sign-in", "Google no esta configurado."));
  }

  const callbackURL = `${env.BETTER_AUTH_URL}/auth/redirect`;

  let result: { url?: string };

  try {
    result = await auth.api.signInSocial({
      headers: await headers(),
      body: {
        provider: "google",
        callbackURL,
        newUserCallbackURL: callbackURL,
        errorCallbackURL: `${env.BETTER_AUTH_URL}/sign-in`,
      },
    });
  } catch {
    redirect(getErrorPath("/sign-in", "No pudimos iniciar sesion con Google."));
  }

  if (!result.url) {
    redirect(getErrorPath("/sign-in", "No pudimos iniciar sesion con Google."));
  }

  redirect(result.url);
}

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const hasPasswordMismatch = parsed.error.issues.some((issue) =>
      issue.path.includes("confirmPassword"),
    );

    redirect(
      getErrorPath(
        "/sign-up",
        hasPasswordMismatch
          ? "Las contraseñas no coinciden."
          : "Revisa los datos del formulario.",
      ),
    );
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
        name: parsed.data.name,
        email: normalizedEmail,
        password: parsed.data.password,
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

  redirect(await getPostAuthRedirect(normalizedEmail));
}

export async function signOutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect("/sign-in");
}

