"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { isDashboardRole } from "@/modules/auth/roles";
import { GOOGLE_INVITATION_COOKIE, GOOGLE_INVITATION_COOKIE_MAX_AGE_SECONDS } from "@/modules/auth/lib/google-invitation-flow";
import { hashInvitationToken } from "@/modules/users/server/user-invitation-token";
import {
  requirePendingUserInvitationByEmail,
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
    invitationToken: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

function getSafeReturnTo(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}
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

  if (user && isDashboardRole(user.role)) {
    return "/dashboard";
  }

  return "/family-dashboard";
}

export async function signInAction(formData: FormData) {
  const returnTo = getSafeReturnTo(formData.get("returnTo"));
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

  redirect(returnTo ?? (await getPostAuthRedirect(parsed.data.email)));
}

export async function signInGoogleAction(formData: FormData) {
  const returnTo = getSafeReturnTo(formData.get("returnTo"));
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    redirect(getErrorPath("/sign-in", "Google no esta configurado."));
  }

  const callback = new URL("/auth/redirect", env.BETTER_AUTH_URL);
  if (returnTo) callback.searchParams.set("returnTo", returnTo);
  const callbackURL = callback.toString();

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

export async function signUpGoogleAction(formData: FormData) {
  const token = formData.get("invitationToken");
  if (typeof token !== "string" || !token) redirect(getErrorPath("/sign-up", "La invitacion no es valida o vencio."));
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) redirect(getErrorPath("/sign-up", "Google no esta configurado."));

  const invitation = await prisma.userInvitation.findFirst({ where: { tokenHash: hashInvitationToken(token) }, select: { email: true } });
  if (!invitation || !(await requirePendingUserInvitationByEmail(invitation.email, token).catch(() => null))) redirect(getErrorPath("/sign-up", "La invitacion no es valida o vencio."));
  if (await prisma.user.findUnique({ where: { email: normalizeInvitationEmail(invitation.email) }, select: { id: true } })) redirect(getErrorPath("/sign-in", "Esta invitacion ya tiene una cuenta. Inicia sesion con Google."));

  (await cookies()).set(GOOGLE_INVITATION_COOKIE, encodeURIComponent(token), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: GOOGLE_INVITATION_COOKIE_MAX_AGE_SECONDS });
  const callbackURL = new URL("/auth/redirect", env.BETTER_AUTH_URL).toString();
  let result: { url?: string };
  try { result = await auth.api.signInSocial({ headers: await headers(), body: { provider: "google", callbackURL, newUserCallbackURL: callbackURL, errorCallbackURL: new URL("/sign-up?error=google_cancelled", env.BETTER_AUTH_URL).toString(), requestSignUp: true, loginHint: invitation.email } }); }
  catch { redirect(getErrorPath("/sign-up", "No pudimos iniciar el registro con Google.")); }
  if (!result.url) redirect(getErrorPath("/sign-up", "No pudimos iniciar el registro con Google."));
  redirect(result.url);
}
export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    invitationToken: formData.get("invitationToken"),
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
  const invitation = await requirePendingUserInvitationByEmail(normalizedEmail, parsed.data.invitationToken).catch(() => null);

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
        invitationToken: parsed.data.invitationToken,
      } as NonNullable<Parameters<typeof auth.api.signUpEmail>[0]>["body"],
    });
  } catch {
    redirect(
      getErrorPath("/sign-up", "No pudimos crear el usuario. Intenta de nuevo."),
    );
  }

  try {
    await reconcileUserInvitationAfterSignup(normalizedEmail, parsed.data.invitationToken);
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

