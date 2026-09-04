import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { prisma } from "@/lib/prisma";
import { getAllCmsImagePages } from "@/modules/cms/content-page-config";
import { uploadImageToCloudinary } from "@/modules/media/server/cloudinary-images";

async function prepareCmsImage(localPath: string) {
  const source = await readFile(localPath);
  if (source.byteLength <= 9 * 1024 * 1024) return source;
  return sharp(source)
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

export async function initializeAllCmsImages() {
  const initializedBySlug = new Map<string, Set<string>>();

  for (const page of getAllCmsImagePages()) {
    if (!page.images.length) continue;
    const existing = await prisma.cmsImageEntry.findMany({
      where: { pageSlug: page.slug, key: { in: page.images.map((image) => image.key) } },
      select: { key: true },
    });
    const existingKeys = new Set(existing.map((entry) => entry.key));

    for (const image of page.images) {
      if (existingKeys.has(image.key)) continue;
      const localPath = path.join(process.cwd(), "public", image.defaultSrc.replace(/^\//, ""));
      const uploaded = await uploadImageToCloudinary(
        await prepareCmsImage(localPath),
        "CMS",
        { publicId: `koru/cms/${page.slug.replace(/^\//, "root").replaceAll("/", "--")}/${image.key.replaceAll(".", "-")}` },
      );
      await prisma.cmsImageEntry.create({ data: {
        pageSlug: page.slug, key: image.key,
        draftUrl: uploaded.url, draftPublicId: uploaded.publicId,
        draftCropX: 50, draftCropY: 50, draftZoom: 1, draftFitMode: "COVER", draftFrameSize: "NORMAL",
        publishedUrl: uploaded.url, publishedPublicId: uploaded.publicId,
        publishedCropX: 50, publishedCropY: 50, publishedZoom: 1, publishedFitMode: "COVER", publishedFrameSize: "NORMAL",
      }});
      const initialized = initializedBySlug.get(page.slug) ?? new Set<string>();
      initialized.add(image.key); initializedBySlug.set(page.slug, initialized);
    }
  }

  return Object.fromEntries([...initializedBySlug.entries()].map(([slug, keys]) => [slug, [...keys]]));
}
