import Link from "next/link";

import { signInAction } from "@/modules/auth/server/auth-actions";

type SignInViewProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export async function SignInView({ searchParams }: SignInViewProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Ingreso admin</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Accede al dashboard para administrar contenido.
      </p>

      {params.error ? (
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}

      <form action={signInAction} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-ring/40 transition focus:ring-2"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-ring/40 transition focus:ring-2"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Entrar
        </button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Primera vez en el proyecto?{" "}
        <Link className="font-medium text-foreground underline" href="/sign-up">
          Crear usuario inicial
        </Link>
      </p>
    </main>
  );
}
