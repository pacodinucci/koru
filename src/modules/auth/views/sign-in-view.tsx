import Link from "next/link";
import Image from "next/image";

import { AuthSplitShell } from "@/modules/auth/components/auth-split-shell";
import {
  signInAction,
  signInGoogleAction,
} from "@/modules/auth/server/auth-actions";

type SignInViewProps = {
  searchParams: Promise<{
    error?: string;
    returnTo?: string;
  }>;
};

export async function SignInView({ searchParams }: SignInViewProps) {
  const params = await searchParams;
  const error = getAuthErrorMessage(params.error);
  const returnTo = params.returnTo?.startsWith("/") && !params.returnTo.startsWith("//")
    ? params.returnTo
    : undefined;

  return (
    <AuthSplitShell
      title="Ingresa a tu cuenta"
      description="Accede al espacio privado de Koru para gestionar contenido y acompañar a la comunidad."
      footer={
        <>
          ¿No tienes usuario?{" "}
          <Link
            className="font-semibold text-[var(--complement-900)] underline underline-offset-4"
            href="/sign-up"
          >
            Crear usuario
          </Link>
        </>
      }
    >
      {error ? (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      <form action={signInGoogleAction}>
        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
        <button
          type="submit"
          className="mb-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#dce4b8] bg-white px-4 text-sm font-semibold text-[#2f3716] transition hover:bg-[#f7f9ef]"
        >
          <span className="inline-flex items-center gap-2 leading-none">
            <span>Continuar con</span>
            <Image
              src="/assets/google.svg"
              alt=""
              width={16}
              height={16}
              aria-hidden="true"
              className="block h-4 w-4"
            />
          </span>
        </button>
      </form>

      <div className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#8b9472]">
        <span className="h-px flex-1 bg-[#dce4b8]" />
        o
        <span className="h-px flex-1 bg-[#dce4b8]" />
      </div>

      <form action={signInAction} className="space-y-5">
        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-[#2f3716]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="h-12 w-full rounded-2xl border border-[#dce4b8] bg-white px-4 text-sm text-[#1f2610] outline-none transition placeholder:text-[#98a278] focus:border-[var(--complement-700)] focus:ring-4 focus:ring-[var(--complement-700)]/20"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-[#2f3716]"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="h-12 w-full rounded-2xl border border-[#dce4b8] bg-white px-4 text-sm text-[#1f2610] outline-none transition placeholder:text-[#98a278] focus:border-[var(--complement-700)] focus:ring-4 focus:ring-[var(--complement-700)]/20"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--complement-900)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--complement-800)]"
        >
          Entrar
        </button>
      </form>
    </AuthSplitShell>
  );
}

function getAuthErrorMessage(error?: string) {
  if (!error) {
    return null;
  }

  const messages: Record<string, string> = {
    unauthorized_email: "Tu email no esta autorizado para crear un usuario.",
    signup_disabled: "Tu email no esta autorizado para crear un usuario.",
    unable_to_create_user: "No pudimos crear el usuario con Google.",
  };

  return messages[error] ?? error.replaceAll("_", " ");
}
