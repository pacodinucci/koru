import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { signOutAction } from "@/modules/auth/server/auth-actions";

export async function AdminHomeView() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-16 sm:px-10">
      <div className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
        Area administrativa protegida
      </div>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
        Bienvenido al dashboard
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
        Sesion activa como <span className="font-medium">{session.user.email}</span>
      </p>

      <div className="mt-8">
        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium transition hover:bg-muted"
          >
            Cerrar sesion
          </button>
        </form>
      </div>
    </main>
  );
}
