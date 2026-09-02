import { prisma } from "@/lib/prisma";
import { BlockType, PageStatus, type Prisma } from "@prisma/client";
import {
  CMS_DELETED_TEXT_SLOT_IDS_KEY,
  CMS_INSERTED_TEXT_BLOCKS_KEY,
  getCmsInsertedTextBlocks,
} from "@/modules/cms/inserted-text-blocks";
import {
  ensureLandingDefaults,
  getDefaultLandingTextMap,
} from "@/modules/landing/config/landing-sections";

export type CmsTextMap = Record<string, string>;

type CmsTextRepositoryClient = Pick<
  Prisma.TransactionClient,
  "cmsTextEntry" | "page" | "pageBlock"
>;

async function getEntries(client: CmsTextRepositoryClient = prisma) {
  return client.cmsTextEntry.findMany({
    orderBy: { key: "asc" },
  });
}

export async function getCmsDraftTextMap(
  client: CmsTextRepositoryClient = prisma,
): Promise<CmsTextMap> {
  const entries = await getEntries(client);
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

export async function publishCmsTextMap(
  textMap: CmsTextMap,
  client: CmsTextRepositoryClient = prisma,
) {
  const fullPayload = {
    ...getDefaultLandingTextMap(),
    ...textMap,
  };

  await Promise.all(
    Object.entries(fullPayload).map(([key, value]) =>
      client.cmsTextEntry.upsert({
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

type CmsLandingPageBlockData = {
  cmsLandingDraftOverrides?: Record<string, string>;
  cmsLandingPublishedOverrides?: Record<string, string>;
};

function toStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, raw]) => typeof raw === "string",
  );

  return Object.fromEntries(entries) as Record<string, string>;
}

function getLandingOverrides(
  blockData: unknown,
  mode: "draft" | "published",
): Record<string, string> {
  if (!blockData || typeof blockData !== "object") {
    return {};
  }

  const data = blockData as CmsLandingPageBlockData;
  if (mode === "published") {
    return toStringMap(
      data.cmsLandingPublishedOverrides ?? data.cmsLandingDraftOverrides,
    );
  }

  return toStringMap(data.cmsLandingDraftOverrides);
}

function withoutInsertedTextBlockData(textMap: CmsTextMap): CmsTextMap {
  const insertedIds = getCmsInsertedTextBlocks(textMap).map((block) => block.id);
  return Object.fromEntries(
    Object.entries(textMap).filter(
      ([key]) =>
        key !== CMS_INSERTED_TEXT_BLOCKS_KEY &&
        key !== CMS_DELETED_TEXT_SLOT_IDS_KEY &&
        !insertedIds.some(
          (blockId) => key === blockId || key.startsWith(blockId + "__"),
        ),
    ),
  );
}

function buildOverrides(
  base: Record<string, string>,
  fullPayload: Record<string, string>,
) {
  const overrides: Record<string, string> = {};

  for (const [key, value] of Object.entries(fullPayload)) {
    if (base[key] !== value) {
      overrides[key] = value;
    }
  }

  return overrides;
}

async function getPageLandingBlock(
  slug: string,
  client: CmsTextRepositoryClient = prisma,
) {
  const page = await client.page.findUnique({
    where: { slug },
    include: {
      blocks: {
        where: {
          type: BlockType.RICH_TEXT,
          order: 0,
        },
        take: 1,
      },
    },
  });

  return {
    page,
    block: page?.blocks[0] ?? null,
  };
}

export async function getCmsDraftTextMapBySlug(slug: string): Promise<CmsTextMap> {
  const normalizedSlug = slug.trim() || "/";

  if (normalizedSlug === "/") {
    return getCmsDraftTextMap();
  }

  const baseMap = withoutInsertedTextBlockData(await getCmsDraftTextMap());
  const { block } = await getPageLandingBlock(normalizedSlug);
  const overrides = getLandingOverrides(block?.data, "draft");

  return ensureLandingDefaults({
    ...baseMap,
    ...overrides,
    [CMS_INSERTED_TEXT_BLOCKS_KEY]:
      overrides[CMS_INSERTED_TEXT_BLOCKS_KEY] ?? "[]",
    [CMS_DELETED_TEXT_SLOT_IDS_KEY]:
      overrides[CMS_DELETED_TEXT_SLOT_IDS_KEY] ?? "[]",
  });
}

export async function getCmsPublishedTextMapBySlug(
  slug: string,
): Promise<CmsTextMap> {
  const normalizedSlug = slug.trim() || "/";

  if (normalizedSlug === "/") {
    return getCmsPublishedTextMap();
  }

  const baseMap = withoutInsertedTextBlockData(await getCmsPublishedTextMap());
  const { block } = await getPageLandingBlock(normalizedSlug);
  const overrides = getLandingOverrides(block?.data, "published");

  return ensureLandingDefaults({
    ...baseMap,
    ...overrides,
    [CMS_INSERTED_TEXT_BLOCKS_KEY]:
      overrides[CMS_INSERTED_TEXT_BLOCKS_KEY] ?? "[]",
    [CMS_DELETED_TEXT_SLOT_IDS_KEY]:
      overrides[CMS_DELETED_TEXT_SLOT_IDS_KEY] ?? "[]",
  });
}

export async function saveCmsPageDraftTextMap(slug: string, textMap: CmsTextMap) {
  const normalizedSlug = slug.trim() || "/";
  if (normalizedSlug === "/") {
    await saveCmsDraftTextMap(textMap);
    return;
  }

  const baseMap = {
    ...withoutInsertedTextBlockData(await getCmsDraftTextMap()),
    [CMS_INSERTED_TEXT_BLOCKS_KEY]: "[]",
    [CMS_DELETED_TEXT_SLOT_IDS_KEY]: "[]",
  };
  const fullPayload = {
    ...getDefaultLandingTextMap(),
    ...textMap,
  };
  const overrides = buildOverrides(baseMap, fullPayload);

  const page = await prisma.page.upsert({
    where: { slug: normalizedSlug },
    create: {
      slug: normalizedSlug,
      title: normalizedSlug === "/" ? "Landing" : normalizedSlug.slice(1),
      status: PageStatus.DRAFT,
    },
    update: {},
  });

  const { block } = await getPageLandingBlock(normalizedSlug);
  const previousData =
    block && block.data && typeof block.data === "object" ? block.data : {};

  await prisma.pageBlock.upsert({
    where: {
      pageId_order: {
        pageId: page.id,
        order: 0,
      },
    },
    create: {
      pageId: page.id,
      type: BlockType.RICH_TEXT,
      order: 0,
      data: {
        ...previousData,
        cmsLandingDraftOverrides: overrides,
      },
    },
    update: {
      type: BlockType.RICH_TEXT,
      data: {
        ...previousData,
        cmsLandingDraftOverrides: overrides,
      },
    },
  });
}

export async function publishCmsPageTextMap(slug: string, textMap: CmsTextMap) {
  return publishCmsPageTextMapWithClient(prisma, slug, textMap);
}

export async function publishCmsPageTextMapWithClient(
  client: CmsTextRepositoryClient,
  slug: string,
  textMap: CmsTextMap,
) {
  const normalizedSlug = slug.trim() || "/";
  if (normalizedSlug === "/") {
    await publishCmsTextMap(textMap, client);
    return;
  }

  const baseMap = {
    ...withoutInsertedTextBlockData(await getCmsDraftTextMap(client)),
    [CMS_INSERTED_TEXT_BLOCKS_KEY]: "[]",
    [CMS_DELETED_TEXT_SLOT_IDS_KEY]: "[]",
  };
  const fullPayload = {
    ...getDefaultLandingTextMap(),
    ...textMap,
  };
  const overrides = buildOverrides(baseMap, fullPayload);

  const page = await client.page.upsert({
    where: { slug: normalizedSlug },
    create: {
      slug: normalizedSlug,
      title: normalizedSlug === "/" ? "Landing" : normalizedSlug.slice(1),
      status: PageStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    update: {
      status: PageStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  const { block } = await getPageLandingBlock(normalizedSlug, client);
  const previousData =
    block && block.data && typeof block.data === "object" ? block.data : {};

  await client.pageBlock.upsert({
    where: {
      pageId_order: {
        pageId: page.id,
        order: 0,
      },
    },
    create: {
      pageId: page.id,
      type: BlockType.RICH_TEXT,
      order: 0,
      data: {
        ...previousData,
        cmsLandingDraftOverrides: overrides,
        cmsLandingPublishedOverrides: overrides,
      },
    },
    update: {
      type: BlockType.RICH_TEXT,
      data: {
        ...previousData,
        cmsLandingDraftOverrides: overrides,
        cmsLandingPublishedOverrides: overrides,
      },
    },
  });
}



