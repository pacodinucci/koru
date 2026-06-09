import Link from "next/link";

import { AuthSplitShell } from "@/modules/auth/components/auth-split-shell";
import { signUpAction } from "@/modules/auth/server/auth-actions";

type SignUpViewProps = {
  searchParams: Promise<{
    email?: string;
    error?: string;
  }>;
};

export async function SignUpView({ searchParams }: SignUpViewProps) {
  const params = await searchParams;

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

      <form action={signUpAction} className="space-y-5">
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
            defaultValue={params.email ?? ""}
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
          Crear usuario
        </button>
      </form>
    </AuthSplitShell>
  );
}
