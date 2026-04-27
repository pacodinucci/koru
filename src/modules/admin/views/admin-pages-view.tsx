import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AdminDashboardShell } from "@/modules/admin/components/admin-dashboard-shell";
import { signOutAction } from "@/modules/auth/server/auth-actions";

export async function AdminPagesView() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <AdminDashboardShell
      userEmail={session.user.email}
      currentPath="/admin/pages"
      breadcrumbPage="CMS / Pages"
      onSignOut={signOutAction}
    >
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Pages</h1>
        <p className="mt-2 text-sm text-slate-600">
          Gestion de paginas del CMS. Esta vista queda lista para conectar el
          listado y las acciones de edicion.
        </p>
      </div>
    </AdminDashboardShell>
  );
}
