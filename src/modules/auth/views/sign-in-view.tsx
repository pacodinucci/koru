import Link from "next/link";

import { AuthSplitShell } from "@/modules/auth/components/auth-split-shell";
import { signInAction } from "@/modules/auth/server/auth-actions";

type SignInViewProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export async function SignInView({ searchParams }: SignInViewProps) {
  const params = await searchParams;

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
      {params.error ? (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {params.error}
        </div>
      ) : null}

      <form action={signInAction} className="space-y-5">
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
