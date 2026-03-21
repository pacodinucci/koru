import { z } from "zod";

export const pageStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const blockTypeSchema = z.enum([
  "HERO",
  "RICH_TEXT",
  "CTA",
  "IMAGE",
  "DONATION",
]);

export const pageBlockSchema = z.object({
  type: blockTypeSchema,
  order: z.number().int().min(0),
  data: z.record(z.string(), z.unknown()),
});

export const pageSchema = z.object({
  title: z.string().min(3).max(120),
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug"),
  status: pageStatusSchema.default("DRAFT"),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(320).optional(),
  blocks: z.array(pageBlockSchema).default([]),
});

export type PageFormValues = z.infer<typeof pageSchema>;
