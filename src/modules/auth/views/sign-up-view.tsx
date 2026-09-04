import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";

import { AuthSplitShell } from "@/modules/auth/components/auth-split-shell";
import { signUpAction, signUpGoogleAction } from "@/modules/auth/server/auth-actions";
import { GOOGLE_INVITATION_COOKIE } from "@/modules/auth/lib/google-invitation-flow";

type SignUpViewProps = {
  searchParams: Promise<{
    token?: string;
    error?: string;
  }>;
};

export async function SignUpView({ searchParams }: SignUpViewProps) {
  const params = await searchParams;
  const invitationToken = params.token ?? (await cookies()).get(GOOGLE_INVITATION_COOKIE)?.value ?? "";

  return (
    <AuthSplitShell
      title="Crea tu usuario"
      description="Completa tus datos para acceder al espacio privado de Koru."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link
            className="font-semibold text-[var(--complement-900)] underline underline-offset-4"
            href="/sign-in"
          >
            Iniciar sesión
          </Link>
        </>
      }
    >
      {params.error ? (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {params.error}
        </div>
      ) : null}

      <form action={signUpGoogleAction} className="mb-5">
        <input type="hidden" name="invitationToken" value={invitationToken} />
        <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#dce4b8] bg-white px-4 text-sm font-semibold text-[#2f3716] transition hover:bg-[#f7f9ef]">
          <span>Continuar con</span><Image src="/assets/google.svg" alt="Google" width={16} height={16} />
        </button>
      </form>
      <div className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#8b9472]"><span className="h-px flex-1 bg-[#dce4b8]" />o<span className="h-px flex-1 bg-[#dce4b8]" /></div>      <form action={signUpAction} className="space-y-5">
        <input type="hidden" name="invitationToken" value={invitationToken} />
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-semibold text-[#2f3716]">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            className="h-12 w-full rounded-2xl border border-[#dce4b8] bg-white px-4 text-sm text-[#1f2610] outline-none transition placeholder:text-[#98a278] focus:border-[var(--complement-700)] focus:ring-4 focus:ring-[var(--complement-700)]/20"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-[#2f3716]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue=""
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
        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-semibold text-[#2f3716]"
          >
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
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
          Crear usuario
        </button>
      </form>
    </AuthSplitShell>
  );
}
