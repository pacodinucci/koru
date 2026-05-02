import { readdir } from "node:fs/promises";
import path from "node:path";

import { BlockType, PageStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CmsDiscoveredPage = {
  slug: string;
  filePath: string;
  isDynamic: boolean;
};

export type CmsEditablePage = {
  slug: string;
  title: string;
  status: PageStatus;
  seoTitle: string;
  seoDescription: string;
  content: string;
};

const PAGES_GROUP_DIR = path.join(process.cwd(), "src", "app", "(pages)");

function normalizeSlugFromRelativeDir(relativeDir: string) {
  if (!relativeDir || relativeDir === ".") {
    return "/";
  }

  const normalized = relativeDir.split(path.sep).join("/");
  return `/${normalized}`;
}

async function walkPageFiles(dir: string, found: CmsDiscoveredPage[]) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await walkPageFiles(absolute, found);
      continue;
    }

    if (entry.name !== "page.tsx" && entry.name !== "page.ts") {
      continue;
    }

    const relativeToPagesGroup = path.relative(PAGES_GROUP_DIR, absolute);
    const relativeDir = path.dirname(relativeToPagesGroup);
    const slug = normalizeSlugFromRelativeDir(relativeDir);

    found.push({
      slug,
      filePath: absolute,
      isDynamic: slug.includes("["),
    });
  }
}

export async function discoverPagesGroupRoutes() {
  const pages: CmsDiscoveredPage[] = [];
  await walkPageFiles(PAGES_GROUP_DIR, pages);

  return pages.sort((a, b) => {
    if (a.slug === "/") {
      return -1;
    }
    if (b.slug === "/") {
      return 1;
    }
    return a.slug.localeCompare(b.slug, "es");
  });
}

function defaultTitleFromSlug(slug: string) {
  if (slug === "/") {
    return "Home";
  }

  return slug
    .replace(/\//g, " ")
    .replace(/\[[^\]]+\]/g, "")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function getEditableCmsPage(slug: string): Promise<CmsEditablePage> {
  const page = await prisma.page.findUnique({
    where: { slug },
    include: {
      blocks: {
        where: { type: BlockType.RICH_TEXT },
        orderBy: { order: "asc" },
        take: 1,
      },
    },
  });

  if (!page) {
    return {
      slug,
      title: defaultTitleFromSlug(slug),
      status: PageStatus.DRAFT,
      seoTitle: "",
      seoDescription: "",
      content: "",
    };
  }

  const blockData = page.blocks[0]?.data;
  const content =
    blockData &&
    typeof blockData === "object" &&
    "content" in blockData &&
    typeof blockData.content === "string"
      ? blockData.content
      : "";

  return {
    slug: page.slug,
    title: page.title,
    status: page.status,
    seoTitle: page.seoTitle ?? "",
    seoDescription: page.seoDescription ?? "",
    content,
  };
}

export async function saveEditableCmsPage(input: CmsEditablePage) {
  const saved = await prisma.page.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      title: input.title,
      status: input.status,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
      blocks: {
        create: {
          type: BlockType.RICH_TEXT,
          order: 0,
          data: { content: input.content },
        },
      },
    },
    update: {
      title: input.title,
      status: input.status,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
    },
  });

  await prisma.pageBlock.upsert({
    where: {
      pageId_order: {
        pageId: saved.id,
        order: 0,
      },
    },
    create: {
      pageId: saved.id,
      type: BlockType.RICH_TEXT,
      order: 0,
      data: { content: input.content },
    },
    update: {
      type: BlockType.RICH_TEXT,
      data: { content: input.content },
    },
  });
}
