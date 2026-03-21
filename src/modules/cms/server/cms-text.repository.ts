import { prisma } from "@/lib/prisma";
import {
  cmsLandingDefaultTextMap,
  cmsLandingTextKeys,
} from "@/modules/admin/data/cms-landing-content";

export type CmsTextMap = Record<string, string>;

async function getEntriesByKeys() {
  return prisma.cmsTextEntry.findMany({
    where: { key: { in: cmsLandingTextKeys } },
  });
}

export async function getCmsDraftTextMap(): Promise<CmsTextMap> {
  const entries = await getEntriesByKeys();
  const dbDraftMap = Object.fromEntries(
    entries.map((entry) => [entry.key, entry.draftValue]),
  );

  return {
    ...cmsLandingDefaultTextMap,
    ...dbDraftMap,
  };
}

export async function getCmsPublishedTextMap(): Promise<CmsTextMap> {
  const entries = await getEntriesByKeys();
  const dbPublishedMap = Object.fromEntries(
    entries.map((entry) => [
      entry.key,
      entry.publishedValue ?? entry.draftValue ?? cmsLandingDefaultTextMap[entry.key],
    ]),
  );

  return {
    ...cmsLandingDefaultTextMap,
    ...dbPublishedMap,
  };
}

export async function saveCmsDraftTextMap(textMap: CmsTextMap) {
  const operations = cmsLandingTextKeys.map((key) =>
    prisma.cmsTextEntry.upsert({
      where: { key },
      create: { key, draftValue: textMap[key] ?? cmsLandingDefaultTextMap[key] },
      update: { draftValue: textMap[key] ?? cmsLandingDefaultTextMap[key] },
    }),
  );

  await prisma.$transaction(operations);
}

export async function publishCmsTextMap(textMap: CmsTextMap) {
  const operations = cmsLandingTextKeys.map((key) =>
    prisma.cmsTextEntry.upsert({
      where: { key },
      create: {
        key,
        draftValue: textMap[key] ?? cmsLandingDefaultTextMap[key],
        publishedValue: textMap[key] ?? cmsLandingDefaultTextMap[key],
      },
      update: {
        draftValue: textMap[key] ?? cmsLandingDefaultTextMap[key],
        publishedValue: textMap[key] ?? cmsLandingDefaultTextMap[key],
      },
    }),
  );

  await prisma.$transaction(operations);
}
