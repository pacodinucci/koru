import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CmsImageValue = {
  url: string;
  publicId: string;
  cropX: number;
  cropY: number;
  zoom: number;
  fitMode: "COVER" | "CONTAIN";
  frameSize: "COMPACT" | "NORMAL" | "LARGE";
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
    draftZoom: number;
    draftFitMode: string;
    draftFrameSize: string;
    publishedCropX: number | null;
    publishedCropY: number | null;
    publishedZoom: number | null;
    publishedFitMode: string | null;
    publishedFrameSize: string | null;
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
            zoom: entry.draftZoom,
            fitMode: entry.draftFitMode === "CONTAIN" ? "CONTAIN" : "COVER",
            frameSize: entry.draftFrameSize === "COMPACT" ? "COMPACT" : entry.draftFrameSize === "LARGE" ? "LARGE" : "NORMAL",
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
              zoom: entry.publishedZoom ?? 1,
              fitMode: entry.publishedFitMode === "CONTAIN" ? "CONTAIN" : "COVER",
              frameSize: entry.publishedFrameSize === "COMPACT" ? "COMPACT" : entry.publishedFrameSize === "LARGE" ? "LARGE" : "NORMAL",
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
      draftZoom: image.zoom,
      draftFitMode: image.fitMode,
      draftFrameSize: image.frameSize,
    },
    update: {
      draftUrl: image.url,
      draftPublicId: image.publicId,
      draftCropX: image.cropX,
      draftCropY: image.cropY,
      draftZoom: image.zoom,
      draftFitMode: image.fitMode,
      draftFrameSize: image.frameSize,
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
          draftZoom: image.zoom,
          draftFitMode: image.fitMode,
          draftFrameSize: image.frameSize,
        },
        update: {
          draftUrl: image.url,
          draftPublicId: image.publicId,
          draftCropX: image.cropX,
          draftCropY: image.cropY,
          draftZoom: image.zoom,
          draftFitMode: image.fitMode,
          draftFrameSize: image.frameSize,
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
          draftZoom: image.zoom,
          draftFitMode: image.fitMode,
          draftFrameSize: image.frameSize,
          publishedUrl: image.url,
          publishedPublicId: image.publicId,
          publishedCropX: image.cropX,
          publishedCropY: image.cropY,
          publishedZoom: image.zoom,
          publishedFitMode: image.fitMode,
          publishedFrameSize: image.frameSize,
        },
        update: {
          draftUrl: image.url,
          draftPublicId: image.publicId,
          draftCropX: image.cropX,
          draftCropY: image.cropY,
          draftZoom: image.zoom,
          draftFitMode: image.fitMode,
          draftFrameSize: image.frameSize,
          publishedUrl: image.url,
          publishedPublicId: image.publicId,
          publishedCropX: image.cropX,
          publishedCropY: image.cropY,
          publishedZoom: image.zoom,
          publishedFitMode: image.fitMode,
          publishedFrameSize: image.frameSize,
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
      "publishedZoom" = "draftZoom",
      "publishedFitMode" = "draftFitMode",
      "publishedFrameSize" = "draftFrameSize",
      "updatedAt" = NOW()
  `;
}
