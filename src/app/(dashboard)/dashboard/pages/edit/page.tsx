import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { discoverPagesGroupRoutes, getEditableCmsPage } from "@/modules/admin/server/cms-pages.repository";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { saveDashboardPageAction } from "@/modules/dashboard/server/dashboard-pages.actions";

type DashboardPagesEditPageProps = {
  searchParams?: Promise<{
    slug?: string;
    saved?: string;
  }>;
};

export default async function DashboardPagesEditPage({
  searchParams,
}: DashboardPagesEditPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const resolved = searchParams ? await searchParams : undefined;
  const slug = resolved?.slug ?? "/";
  const saved = resolved?.saved === "1";
  const page = await getEditableCmsPage(slug);
  const cmsPages = await discoverPagesGroupRoutes();

  return (
    <DashboardShell
      userEmail={session.user.email}
      cmsPages={cmsPages}
      breadcrumbPage={`Pages / ${slug}`}
      showPanelToggle
      panelDefaultOpen
    >
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Editar pagina</h1>
            <p className="mt-1 font-mono text-sm text-slate-600">{slug}</p>
          </div>
          <Link
            href={slug}
            target="_blank"
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver publica
          </Link>
        </div>

        {saved ? (
          <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Cambios guardados.
          </p>
        ) : null}

        <form action={saveDashboardPageAction} className="space-y-4">
          <input type="hidden" name="slug" value={page.slug} />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800">Titulo</label>
            <input
              name="title"
              defaultValue={page.title}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800">Estado</label>
            <select
              name="status"
              defaultValue={page.status}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800">SEO title</label>
            <input
              name="seoTitle"
              defaultValue={page.seoTitle}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800">SEO description</label>
            <textarea
              name="seoDescription"
              defaultValue={page.seoDescription}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800">Contenido base</label>
            <textarea
              name="content"
              defaultValue={page.content}
              rows={12}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Guardar cambios
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}
