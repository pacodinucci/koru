import Link from "next/link";

import { signUpAction } from "@/modules/auth/server/auth-actions";

type SignUpViewProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export async function SignUpView({ searchParams }: SignUpViewProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Crear usuario admin</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Este paso es para bootstrap inicial del proyecto.
      </p>

      {params.error ? (
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}

      <form action={signUpAction} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-ring/40 transition focus:ring-2"
          />
        </div>
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
          Crear usuario
        </button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Ya tienes cuenta?{" "}
        <Link className="font-medium text-foreground underline" href="/sign-in">
          Ingresar
        </Link>
      </p>
    </main>
  );
}
