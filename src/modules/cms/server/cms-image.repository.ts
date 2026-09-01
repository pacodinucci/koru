import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CmsImageValue = {
  url: string;
  publicId: string;
  cropX: number;
  cropY: number;
};

export type CmsImageMap = Record<string, CmsImageValue>;

type CmsImageRepositoryClient = Pick<Prisma.TransactionClient, "cmsImageEntry">;

function entriesToMap(
  entries: Array<{
    key: string;
    draftUrl: string;
    draftPublicId: string;
    publishedUrl: string | null;
    publishedPublicId: string | null;
    draftCropX: number;
    draftCropY: number;
    publishedCropX: number | null;
    publishedCropY: number | null;
  }>,
  mode: "draft" | "published",
): CmsImageMap {
  return Object.fromEntries(
    entries.flatMap((entry) => {
      if (mode === "draft") {
        return [[
          entry.key,
          {
            url: entry.draftUrl,
            publicId: entry.draftPublicId,
            cropX: entry.draftCropX,
            cropY: entry.draftCropY,
          },
        ]];
      }

      const url = entry.publishedUrl;
      const publicId = entry.publishedPublicId;
      return url && publicId
        ? [[
            entry.key,
            {
              url,
              publicId,
              cropX: entry.publishedCropX ?? 50,
              cropY: entry.publishedCropY ?? 50,
            },
          ]]
        : [];
    }),
  );
}

export async function getCmsDraftImageMapBySlug(
  pageSlug: string,
): Promise<CmsImageMap> {
  const entries = await prisma.cmsImageEntry.findMany({
    where: { pageSlug },
    orderBy: { key: "asc" },
  });

  return entriesToMap(entries, "draft");
}

export async function getCmsPublishedImageMapBySlug(
  pageSlug: string,
): Promise<CmsImageMap> {
  const entries = await prisma.cmsImageEntry.findMany({
    where: { pageSlug },
    orderBy: { key: "asc" },
  });

  return entriesToMap(entries, "published");
}

export async function saveCmsDraftImage(
  pageSlug: string,
  key: string,
  image: CmsImageValue,
) {
  await prisma.cmsImageEntry.upsert({
    where: { pageSlug_key: { pageSlug, key } },
    create: {
      pageSlug,
      key,
      draftUrl: image.url,
      draftPublicId: image.publicId,
      draftCropX: image.cropX,
      draftCropY: image.cropY,
    },
    update: {
      draftUrl: image.url,
      draftPublicId: image.publicId,
      draftCropX: image.cropX,
      draftCropY: image.cropY,
    },
  });
}

export async function saveCmsDraftImageMap(
  pageSlug: string,
  imageMap: CmsImageMap,
) {
  await prisma.$transaction(
    Object.entries(imageMap).map(([key, image]) =>
      prisma.cmsImageEntry.upsert({
        where: { pageSlug_key: { pageSlug, key } },
        create: {
          pageSlug,
          key,
          draftUrl: image.url,
          draftPublicId: image.publicId,
          draftCropX: image.cropX,
          draftCropY: image.cropY,
        },
        update: {
          draftUrl: image.url,
          draftPublicId: image.publicId,
          draftCropX: image.cropX,
          draftCropY: image.cropY,
        },
      }),
    ),
  );
}

export async function publishCmsImageMap(
  pageSlug: string,
  imageMap: CmsImageMap,
) {
  await prisma.$transaction((client) =>
    publishCmsImageMapWithClient(client, pageSlug, imageMap),
  );
}

export async function publishCmsImageMapWithClient(
  client: CmsImageRepositoryClient,
  pageSlug: string,
  imageMap: CmsImageMap,
) {
  await Promise.all(
    Object.entries(imageMap).map(([key, image]) =>
      client.cmsImageEntry.upsert({
        where: { pageSlug_key: { pageSlug, key } },
        create: {
          pageSlug,
          key,
          draftUrl: image.url,
          draftPublicId: image.publicId,
          draftCropX: image.cropX,
          draftCropY: image.cropY,
          publishedUrl: image.url,
          publishedPublicId: image.publicId,
          publishedCropX: image.cropX,
          publishedCropY: image.cropY,
        },
        update: {
          draftUrl: image.url,
          draftPublicId: image.publicId,
          draftCropX: image.cropX,
          draftCropY: image.cropY,
          publishedUrl: image.url,
          publishedPublicId: image.publicId,
          publishedCropX: image.cropX,
          publishedCropY: image.cropY,
        },
      }),
    ),
  );
}

export async function publishAllCmsDraftImages() {
  await prisma.$executeRaw`
    UPDATE "CmsImageEntry"
    SET
      "publishedUrl" = "draftUrl",
      "publishedPublicId" = "draftPublicId",
      "publishedCropX" = "draftCropX",
      "publishedCropY" = "draftCropY",
      "updatedAt" = NOW()
  `;
}
