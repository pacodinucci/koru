"use server";

import { z } from "zod";

import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import {
  getCmsDraftTextMap,
  getCmsDraftTextMapBySlug,
  publishCmsPageTextMap,
  publishCmsTextMap,
  saveCmsPageDraftTextMap,
  saveCmsDraftTextMap,
} from "@/modules/cms/server/cms-text.repository";

const cmsTextMapSchema = z.record(z.string(), z.string());

export async function saveCmsDraftAction(payload: unknown) {
  const parsed = cmsTextMapSchema.safeParse(payload);

  if (!parsed.success) {
    return { ok: false as const, message: "Invalid payload." };
  }

  await saveCmsDraftTextMap(parsed.data);

  return { ok: true as const, message: "Draft saved." };
}

export async function publishCmsAction(payload: unknown) {
  const parsed = cmsTextMapSchema.safeParse(payload);

  if (!parsed.success) {
    return { ok: false as const, message: "Invalid payload." };
  }

  await publishCmsTextMap(parsed.data);

  return { ok: true as const, message: "Published successfully." };
}

export async function saveCmsPageDraftAction(slug: string, payload: unknown) {
  const parsed = cmsTextMapSchema.safeParse(payload);

  if (!parsed.success) {
    return { ok: false as const, message: "Invalid payload." };
  }

  await saveCmsPageDraftTextMap(slug, parsed.data);

  return { ok: true as const, message: "Draft saved." };
}

export async function publishCmsPageAction(slug: string, payload: unknown) {
  const parsed = cmsTextMapSchema.safeParse(payload);

  if (!parsed.success) {
    return { ok: false as const, message: "Invalid payload." };
  }

  await publishCmsPageTextMap(slug, parsed.data);

  return { ok: true as const, message: "Published successfully." };
}

export async function publishAllCmsPagesAction() {
  const baseDraft = await getCmsDraftTextMap();
  await publishCmsTextMap(baseDraft);

  const pages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic && page.slug !== "/",
  );

  await Promise.all(
    pages.map(async (page) => {
      const draft = await getCmsDraftTextMapBySlug(page.slug);
      await publishCmsPageTextMap(page.slug, draft);
    }),
  );

  return { ok: true as const, message: "Global publish completed." };
}

