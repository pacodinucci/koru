import { prisma } from "@/lib/prisma";
import {
  ensureLandingDefaults,
  getDefaultLandingTextMap,
} from "@/modules/landing/config/landing-sections";

export type CmsTextMap = Record<string, string>;

async function getEntries() {
  return prisma.cmsTextEntry.findMany({
    orderBy: { key: "asc" },
  });
}

export async function getCmsDraftTextMap(): Promise<CmsTextMap> {
  const entries = await getEntries();
  const map = Object.fromEntries(
    entries.map((entry) => [entry.key, entry.draftValue]),
  );

  return ensureLandingDefaults(map);
}

export async function getCmsPublishedTextMap(): Promise<CmsTextMap> {
  const entries = await getEntries();
  const map = Object.fromEntries(
    entries.map((entry) => [
      entry.key,
      entry.publishedValue ?? entry.draftValue ?? "",
    ]),
  );

  return ensureLandingDefaults(map);
}

export async function saveCmsDraftTextMap(textMap: CmsTextMap) {
  const fullPayload = {
    ...getDefaultLandingTextMap(),
    ...textMap,
  };

  await Promise.all(
    Object.entries(fullPayload).map(([key, value]) =>
      prisma.cmsTextEntry.upsert({
        where: { key },
        create: { key, draftValue: value },
        update: { draftValue: value },
      }),
    ),
  );
}

export async function publishCmsTextMap(textMap: CmsTextMap) {
  const fullPayload = {
    ...getDefaultLandingTextMap(),
    ...textMap,
  };

  await Promise.all(
    Object.entries(fullPayload).map(([key, value]) =>
      prisma.cmsTextEntry.upsert({
        where: { key },
        create: {
          key,
          draftValue: value,
          publishedValue: value,
        },
        update: {
          draftValue: value,
          publishedValue: value,
        },
      }),
    ),
  );
}
