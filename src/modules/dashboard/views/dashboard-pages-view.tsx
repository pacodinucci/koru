import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { DashboardShellLegacy } from "@/modules/dashboard/components/dashboard-shell-legacy";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { signOutAction } from "@/modules/auth/server/auth-actions";

export async function DashboardPagesView() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const pages = await discoverPagesGroupRoutes();

  return (
    <DashboardShellLegacy
      userEmail={session.user.email}
      currentPath="/dashboard/pages"
      breadcrumbPage="CMS / Pages"
      onSignOut={signOutAction}
    >
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Pages</h1>
        <p className="mt-2 text-sm text-slate-600">
          Rutas detectadas dentro de <code>src/app/(pages)</code>. Cada una se
          puede abrir para editar su contenido base en el CMS.
        </p>

        <div className="mt-5 space-y-2">
          {pages.map((page) => (
            <div
              key={page.slug}
              className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate font-mono text-sm text-slate-700">
                {page.slug}
              </span>
              {page.isDynamic ? (
                <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                  Dinamica
                </span>
              ) : null}
              <Link
                href={`/dashboard/pages/edit?slug=${encodeURIComponent(page.slug)}`}
                className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Editar
              </Link>
            </div>
          ))}
        </div>
      </div>
    </DashboardShellLegacy>
  );
}


