import { AdminPageEditView } from "@/modules/admin/views/admin-page-edit-view";

type AdminPageEditPageProps = {
  searchParams?: Promise<{
    slug?: string;
    saved?: string;
  }>;
};

export default async function AdminPageEditPage({ searchParams }: AdminPageEditPageProps) {
  const resolved = searchParams ? await searchParams : undefined;
  const slug = resolved?.slug ?? "/";
  const saved = resolved?.saved === "1";

  return <AdminPageEditView slug={slug} saved={saved} />;
}
