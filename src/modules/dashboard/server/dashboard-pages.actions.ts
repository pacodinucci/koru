"use server";

import { redirect } from "next/navigation";
import { PageStatus } from "@prisma/client";

import { saveEditableCmsPage } from "@/modules/dashboard/server/cms-pages.repository";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function saveDashboardPageAction(formData: FormData) {
  const slug = getString(formData, "slug").trim();
  const title = getString(formData, "title").trim();
  const statusRaw = getString(formData, "status");
  const seoTitle = getString(formData, "seoTitle").trim();
  const seoDescription = getString(formData, "seoDescription").trim();
  const content = getString(formData, "content").trim();

  if (!slug) {
    redirect("/dashboard/pages/edit?error=missing_slug");
  }

  const status =
    statusRaw === PageStatus.PUBLISHED || statusRaw === PageStatus.ARCHIVED
      ? statusRaw
      : PageStatus.DRAFT;

  await saveEditableCmsPage({
    slug,
    title: title || "Untitled page",
    status,
    seoTitle,
    seoDescription,
    content,
  });

  redirect(`/dashboard/pages/edit?slug=${encodeURIComponent(slug)}&saved=1`);
}

