import { z } from "zod";

export const blogImageLayoutSchema = z.enum(["full", "left", "right"]);

export const blogTextBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("text"),
  style: z.enum(["paragraph", "heading"]).default("paragraph"),
  text: z.string().default(""),
});

export const blogImageBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("image"),
  src: z.string().min(1),
  alt: z.string().default(""),
  caption: z.string().optional(),
  layout: blogImageLayoutSchema.default("full"),
});

export const blogGalleryBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("gallery"),
  caption: z.string().optional(),
  images: z
    .array(
      z.object({
        src: z.string().min(1),
        alt: z.string().default(""),
      }),
    )
    .min(2)
    .max(2),
});

export const blogContentBlockSchema = z.discriminatedUnion("type", [
  blogTextBlockSchema,
  blogImageBlockSchema,
  blogGalleryBlockSchema,
]);

export const blogContentBlocksSchema = z.array(blogContentBlockSchema).min(1);

export type BlogTextBlock = z.infer<typeof blogTextBlockSchema>;
export type BlogImageBlock = z.infer<typeof blogImageBlockSchema>;
export type BlogGalleryBlock = z.infer<typeof blogGalleryBlockSchema>;
export type BlogContentBlock = z.infer<typeof blogContentBlockSchema>;

function sanitizeString(value: string) {
  return value.trim();
}

export function createDefaultBlogBlocks(): BlogContentBlock[] {
  return [
    {
      id: "intro-title",
      type: "text",
      style: "heading",
      text: "Titulo de la nota",
    },
    {
      id: "intro-paragraph",
      type: "text",
      style: "paragraph",
      text: "Escribe aqui la introduccion de tu nota.",
    },
  ];
}

export function parseBlogContentBlocks(
  value: unknown,
  legacyContent?: string,
): BlogContentBlock[] {
  const parsed = blogContentBlocksSchema.safeParse(value);

  if (parsed.success) {
    return parsed.data.map((block) => {
      if (block.type === "text") {
        return {
          ...block,
          text: block.text,
        };
      }

      if (block.type === "image") {
        return {
          ...block,
          src: sanitizeString(block.src),
          alt: sanitizeString(block.alt ?? ""),
          caption: block.caption ? sanitizeString(block.caption) : undefined,
        };
      }

      return {
        ...block,
        caption: block.caption ? sanitizeString(block.caption) : undefined,
        images: block.images.map((image) => ({
          src: sanitizeString(image.src),
          alt: sanitizeString(image.alt ?? ""),
        })),
      };
    });
  }

  if (legacyContent && legacyContent.trim()) {
    return [
      {
        id: "legacy-content",
        type: "text",
        style: "paragraph",
        text: legacyContent,
      },
    ];
  }

  return createDefaultBlogBlocks();
}

export function getBlogCoverImage(blocks: BlogContentBlock[]): string | null {
  for (const block of blocks) {
    if (block.type === "image" && block.src.trim()) {
      return block.src;
    }

    if (block.type === "gallery") {
      const first = block.images.find((image) => image.src.trim().length > 0);
      if (first) {
        return first.src;
      }
    }
  }

  return null;
}

export function getBlogPlainText(blocks: BlogContentBlock[]): string {
  const chunks: string[] = [];

  for (const block of blocks) {
    if (block.type === "text") {
      chunks.push(block.text.trim());
    }

    if (block.type === "image" && block.caption) {
      chunks.push(block.caption.trim());
    }

    if (block.type === "gallery" && block.caption) {
      chunks.push(block.caption.trim());
    }
  }

  return chunks.filter(Boolean).join("\n\n");
}
