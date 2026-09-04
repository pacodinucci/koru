"use server";

import { z } from "zod";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { getCmsImageSlotsBySlug } from "@/modules/cms/content-page-config";
import {
  publishCmsImageMapWithClient,
  saveCmsDraftImage,
  type CmsImageMap,
} from "@/modules/cms/server/cms-image.repository";
import { publishCmsPageTextMapWithClient } from "@/modules/cms/server/cms-text.repository";

const imageValueSchema = z.object({
  url: z.string().url().refine((value) => {
    if (!env.CLOUDINARY_CLOUD_NAME) {
      return false;
    }

    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.pathname.startsWith(
        `/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/image/upload/`,
      )
    );
  }, "La imagen debe pertenecer al Cloudinary de Koru."),
  publicId: z.string().min(1).max(500).startsWith("koru/"),
  cropX: z.number().min(0).max(100),
  cropY: z.number().min(0).max(100),
  zoom: z.number().min(1).max(3),
  fitMode: z.enum(["COVER", "CONTAIN"]),
  frameSize: z.enum(["COMPACT", "NORMAL", "LARGE"]),
});

const imageMapSchema = z.record(z.string().min(1), imageValueSchema);
const textMapSchema = z.record(z.string(), z.string());

function getAllowedImageKeys(pageSlug: string) {
  const slots = getCmsImageSlotsBySlug(pageSlug);
  return slots.length ? new Set(slots.map((slot) => slot.key)) : null;
}

function hasOnlyAllowedImageKeys(
  imageMap: Record<string, unknown>,
  allowedKeys: Set<string> | null,
) {
  return (
    allowedKeys !== null &&
    Object.keys(imageMap).every((key) => allowedKeys.has(key))
  );
}

export async function saveCmsPageDraftImageAction(
  pageSlug: string,
  key: string,
  payload: unknown,
) {
  await requireAdmin();

  const parsed = imageValueSchema.safeParse(payload);
  const allowedKeys = getAllowedImageKeys(pageSlug);
  if (!parsed.success || !allowedKeys?.has(key)) {
    return { ok: false as const, message: "Imagen inválida." };
  }

  await saveCmsDraftImage(pageSlug, key, parsed.data);
  return { ok: true as const, message: "Borrador de imagen guardado." };
}

export async function publishCmsPageContentAction(
  pageSlug: string,
  textPayload: unknown,
  imagePayload: unknown,
) {
  await requireAdmin();

  const parsedText = textMapSchema.safeParse(textPayload);
  const parsedImages = imageMapSchema.safeParse(imagePayload);

  if (
    !parsedText.success ||
    !parsedImages.success ||
    !hasOnlyAllowedImageKeys(parsedImages.data, getAllowedImageKeys(pageSlug))
  ) {
    return { ok: false as const, message: "Contenido inválido." };
  }

  await prisma.$transaction(async (client) => {
    await publishCmsPageTextMapWithClient(client, pageSlug, parsedText.data);
    await publishCmsImageMapWithClient(
      client,
      pageSlug,
      parsedImages.data as CmsImageMap,
    );
  });

  return { ok: true as const, message: "Contenido publicado." };
}
