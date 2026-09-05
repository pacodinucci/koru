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
  frameShape: "RECTANGULAR" | "RECTANGLE_HORIZONTAL" | "RECTANGLE_VERTICAL" | "SQUARE" | "OVAL" | "CIRCLE" | "IRREGULAR";
  frameScale: number;
  rotation: number;
  frameRounded?: boolean;
};

export type CmsImageMap = Record<string, CmsImageValue>;

type CmsImageRepositoryClient = Pick<Prisma.TransactionClient, "cmsImageEntry">;

function normalizeFrameShape(value: string | null): CmsImageValue["frameShape"] {
  return value === "RECTANGLE_HORIZONTAL" || value === "RECTANGLE_VERTICAL" || value === "SQUARE" || value === "OVAL" || value === "CIRCLE" || value === "IRREGULAR"
    ? value
    : "RECTANGULAR";
}

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
    draftFrameShape: string;
    draftFrameScale: number;
    draftRotation: number;
    draftRounded: boolean | null;
    publishedCropX: number | null;
    publishedCropY: number | null;
    publishedZoom: number | null;
    publishedFitMode: string | null;
    publishedFrameSize: string | null;
    publishedFrameShape: string | null;
    publishedFrameScale: number | null;
    publishedRotation: number | null;
    publishedRounded: boolean | null;
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
            frameShape: normalizeFrameShape(entry.draftFrameShape),
            frameScale: entry.draftFrameScale,
            rotation: entry.draftRotation,
            frameRounded: entry.draftRounded ?? undefined,
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
              frameShape: normalizeFrameShape(entry.publishedFrameShape),
              frameScale: entry.publishedFrameScale ?? 1,
              rotation: entry.publishedRotation ?? 0,
              frameRounded: entry.publishedRounded ?? undefined,
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
      draftFrameShape: image.frameShape,
      draftFrameScale: image.frameScale,
      draftRotation: image.rotation,
      draftRounded: image.frameRounded,
    },
    update: {
      draftUrl: image.url,
      draftPublicId: image.publicId,
      draftCropX: image.cropX,
      draftCropY: image.cropY,
      draftZoom: image.zoom,
      draftFitMode: image.fitMode,
      draftFrameSize: image.frameSize,
      draftFrameShape: image.frameShape,
      draftFrameScale: image.frameScale,
      draftRotation: image.rotation,
      draftRounded: image.frameRounded,
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
          draftFrameShape: image.frameShape,
          draftFrameScale: image.frameScale,
          draftRotation: image.rotation,
          draftRounded: image.frameRounded,

        },
        update: {
          draftUrl: image.url,
          draftPublicId: image.publicId,
          draftCropX: image.cropX,
          draftCropY: image.cropY,
          draftZoom: image.zoom,
          draftFitMode: image.fitMode,
          draftFrameSize: image.frameSize,
          draftFrameShape: image.frameShape,
          draftFrameScale: image.frameScale,
          draftRotation: image.rotation,
          draftRounded: image.frameRounded,

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
          draftFrameShape: image.frameShape,
          draftFrameScale: image.frameScale,
          draftRotation: image.rotation,
          draftRounded: image.frameRounded,

          publishedUrl: image.url,
          publishedPublicId: image.publicId,
          publishedCropX: image.cropX,
          publishedCropY: image.cropY,
          publishedZoom: image.zoom,
          publishedFitMode: image.fitMode,
          publishedFrameSize: image.frameSize,
          publishedFrameShape: image.frameShape,
          publishedFrameScale: image.frameScale,
          publishedRotation: image.rotation,
          publishedRounded: image.frameRounded,
        },
        update: {
          draftUrl: image.url,
          draftPublicId: image.publicId,
          draftCropX: image.cropX,
          draftCropY: image.cropY,
          draftZoom: image.zoom,
          draftFitMode: image.fitMode,
          draftFrameSize: image.frameSize,
          draftFrameShape: image.frameShape,
          draftFrameScale: image.frameScale,
          draftRotation: image.rotation,
          draftRounded: image.frameRounded,

          publishedUrl: image.url,
          publishedPublicId: image.publicId,
          publishedCropX: image.cropX,
          publishedCropY: image.cropY,
          publishedZoom: image.zoom,
          publishedFitMode: image.fitMode,
          publishedFrameSize: image.frameSize,
          publishedFrameShape: image.frameShape,
          publishedFrameScale: image.frameScale,
          publishedRotation: image.rotation,
          publishedRounded: image.frameRounded,
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
      "publishedFrameShape" = "draftFrameShape",
      "publishedFrameScale" = "draftFrameScale",
      "publishedRotation" = "draftRotation",
      "publishedRounded" = "draftRounded",
      "updatedAt" = NOW()
  `;
}
